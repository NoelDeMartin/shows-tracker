import { arrayUnique, facade, tap } from '@noeldemartin/utils';
import { getTrackedModels, trackModels } from '@aerogel/plugin-soukai';
import { Service } from '@aerogel/core';
import { maximum, minimum, nullable, number, object, string } from '@zod/mini';
import type { infer as ZodInfer } from '@zod/mini';

import Show from '@/models/Show';
import TMDB from '@/services/TMDB';
import { Solid } from '@aerogel/plugin-solid';
import { renderISO8601Duration } from '@/utils/iso8601';
import type { TMDBShow, TMDBShowDetails, TMDBShowExternalIds } from '@/services/TMDB';

export const TVISOShowSchema = object({
    title: string(),
    imdb: nullable(string()),
    type: number().check(minimum(1), maximum(4)), // 1 = TV show, 2 = movie, 3 = documentary, 4 = other
    rating: nullable(number()),
    status: string(),
    checkedDate: string(),
});

export type TVISOShow = ZodInfer<typeof TVISOShowSchema>;

export interface ImportResult {
    imported: Array<{ title: string }>;
    skipped: Array<{ title: string; reason: string }>;
    failed: Array<{ title: string; reason: string }>;
}

export class CatalogService extends Service {

    public async addShow(tmdbShow: TMDBShow): Promise<Show> {
        const details = await TMDB.getShowDetails(tmdbShow.id);
        const externalIds = await TMDB.getShowExternalIds(tmdbShow.id);

        return tap(new Show(), async (show) => {
            await this.updateShow(show, details, externalIds);

            show.mintUrl();
            await Promise.all(show.episodes.map((episode) => episode.save()));
            await show.save();
        });
    }

    public findByTmdbId(tmdbId: number): Show | null {
        const shows = getTrackedModels(Show);

        return shows.find((show) => show.tmdbId === tmdbId) || null;
    }

    public findByImdbId(imdbId: string): Show | null {
        const shows = getTrackedModels(Show);

        return shows.find((show) => show.imdbId === imdbId) || null;
    }

    public async update(): Promise<void> {
        const shows = getTrackedModels(Show).filter(
            (show) => show.status === 'watching' && show.episodes.filter((episode) => !episode.watched).length < 3,
        );

        for (const show of shows) {
            const tmdbId = show.tmdbId;

            if (!tmdbId) {
                continue;
            }

            const details = await TMDB.getShowDetails(tmdbId);

            await this.updateShow(show, details);
            await Promise.all(show.episodes.map((episode) => episode.save()));
            await show.save();
        }
    }

    public async importFromTViso(data: TVISOShow[]): Promise<ImportResult> {
        const result: ImportResult = {
            imported: [],
            skipped: [],
            failed: [],
        };

        for (const [index, item] of data.entries()) {
            try {
                const show = TVISOShowSchema.parse(item);

                // Skip non-TV shows (type 1 = TV show)
                if (show.type !== 1) {
                    result.skipped.push({
                        title: show.title,
                        reason: 'Not a TV show',
                    });

                    continue;
                }

                // Check if show already exists in catalog
                const existingImdbShow = show.imdb && this.findByImdbId(show.imdb);
                if (existingImdbShow) {
                    result.skipped.push({
                        title: show.title,
                        reason: 'Already in catalog',
                    });

                    continue;
                }

                // Search for the show on TMDB
                const searchResults = await TMDB.searchShows(show.title, show.imdb);

                if (!searchResults || searchResults.length === 0) {
                    result.failed.push({
                        title: show.title,
                        reason: 'Not found on TMDB',
                    });
                    continue;
                }

                // Get the first result (best match)
                const tmdbShow = searchResults[0];

                // Check if show already exists in catalog
                const existingShow = this.findByTmdbId(tmdbShow.id);
                if (existingShow) {
                    result.skipped.push({
                        title: show.title,
                        reason: 'Already in catalog',
                    });

                    continue;
                }

                // Get detailed show information
                const showDetails = await TMDB.getShowDetails(tmdbShow.id);
                if (!showDetails) {
                    result.failed.push({
                        title: show.title,
                        reason: 'Failed to get show details',
                    });

                    continue;
                }

                // Create new show
                const newShow = new Show({
                    name: showDetails.name,
                    description: showDetails.overview,
                    imageUrl: TMDB.showImageUrl(showDetails),
                    externalUrls: [`https://www.themoviedb.org/tv/${tmdbShow.id}`],
                    startDate: showDetails.first_air_date ? new Date(showDetails.first_air_date) : undefined,
                    endDate: showDetails.last_air_date ? new Date(showDetails.last_air_date) : undefined,
                });

                if (show.imdb) {
                    newShow.externalUrls.push(`https://www.imdb.com/title/${show.imdb}`);
                }

                // Set the watch status based on TViso status
                await newShow.updateStatus(this.mapTVisoStatusToShowStatus(show.status));

                // Add seasons and episodes
                if (showDetails.seasons) {
                    for (const seasonData of showDetails.seasons) {
                        // Skip specials
                        if (seasonData.season_number === 0) {
                            continue;
                        }

                        const seasonDetails = await TMDB.getSeasonDetails(tmdbShow.id, seasonData.season_number);

                        if (seasonDetails) {
                            const season = newShow.relatedSeasons.attach({
                                number: seasonData.season_number,
                                name: seasonData.name,
                                description: seasonData.overview || '',
                            });

                            if (seasonDetails.episodes) {
                                for (const episodeData of seasonDetails.episodes) {
                                    season.relatedEpisodes.attach({
                                        number: episodeData.episode_number,
                                        name: episodeData.name || `Episode ${episodeData.episode_number}`,
                                        description: episodeData.overview || '',
                                        airDate: episodeData.air_date ? new Date(episodeData.air_date) : undefined,
                                    });
                                }
                            }
                        }
                    }
                }

                newShow.mintUrl();
                await Promise.all(newShow.episodes.map((episode) => episode.save()));
                await newShow.save();

                result.imported.push({ title: show.title });
            } catch (error) {
                const title =
                    typeof item === 'object' && item !== null && 'title' in item && typeof item.title === 'string'
                        ? item.title
                        : `Item ${index + 1}`;

                result.failed.push({
                    title,
                    reason: 'Validation or import error',
                });
            }
        }

        return result;
    }

    protected async boot(): Promise<void> {
        await Solid.booted;
        await trackModels(Show);
        await Promise.all(getTrackedModels(Show).map((show) => show.loadRelationsIfUnloaded()));
    }

    private async updateShow(show: Show, details: TMDBShowDetails, externalIds?: TMDBShowExternalIds): Promise<void> {
        await show.loadRelationsIfUnloaded();

        const externalUrls = [TMDB.showUrl(details)];

        if (externalIds?.imdb_id) {
            externalUrls.push(`https://www.imdb.com/title/${externalIds.imdb_id}`);
        }

        show.name = details.name;
        show.description = details.overview || '';
        show.externalUrls = arrayUnique(show.externalUrls.concat(arrayUnique(externalUrls)));

        show.imageUrl ??= TMDB.showImageUrl(details);

        if (details.first_air_date) {
            show.startDate = new Date(details.first_air_date);
        }

        if (details.last_air_date && (details.status === 'Ended' || details.status === 'Canceled')) {
            show.endDate = new Date(details.last_air_date);
        }

        const tmdbSeasons = details.seasons.filter((season) => season.season_number > 0) ?? [];

        if (
            tmdbSeasons.length === 0 ||
            (details.number_of_episodes && show.episodes.length === details.number_of_episodes)
        ) {
            return;
        }

        for (const tmdbSeason of tmdbSeasons) {
            const seasonDetails = await TMDB.getSeasonDetails(details.id, tmdbSeason.season_number);
            const season =
                show.seasons?.find((_season) => _season.number === tmdbSeason.season_number) ??
                show.relatedSeasons.attach({ number: tmdbSeason.season_number });

            if (season.episodes?.length === seasonDetails.episodes.length) {
                continue;
            }

            for (const tmdbEpisode of seasonDetails.episodes) {
                const episode =
                    season.episodes?.find((_episode) => _episode.number === tmdbEpisode.episode_number) ??
                    season.relatedEpisodes.attach({ number: tmdbEpisode.episode_number });

                episode.name = tmdbEpisode.name;

                if (tmdbEpisode.overview) {
                    episode.description = tmdbEpisode.overview;
                }

                if (tmdbEpisode.runtime) {
                    episode.duration = renderISO8601Duration({ minutes: tmdbEpisode.runtime });
                }

                if (tmdbEpisode.air_date) {
                    episode.publishedAt = new Date(tmdbEpisode.air_date);
                }
            }
        }
    }

    protected mapTVisoStatusToShowStatus(tvisoStatus: string): 'pending' | 'watching' | 'completed' | 'dropped' {
        switch (tvisoStatus.toLowerCase()) {
            case 'watching':
            case 'following':
                return 'watching';
            case 'completed':
            case 'watched':
                return 'completed';
            case 'dropped':
                return 'dropped';
            default:
                return 'pending';
        }
    }

}

export default facade(CatalogService);
