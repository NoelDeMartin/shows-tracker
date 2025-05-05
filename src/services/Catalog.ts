import { arrayUnique, facade, tap } from '@noeldemartin/utils';
import { getTrackedModels } from '@aerogel/plugin-soukai';
import { Service } from '@aerogel/core';

import Show from '@/models/Show';
import TMDB from '@/services/TMDB';
import { renderISO8601Duration } from '@/utils/iso8601';
import type { TMDBShow, TMDBShowDetails } from '@/services/TMDB';

export class CatalogService extends Service {

    public async addShow(tmdbShow: TMDBShow): Promise<Show> {
        const details = await TMDB.getShowDetails(tmdbShow.id);

        return tap(new Show(), async (show) => {
            await this.updateShow(show, details);
            await show.save();
        });
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
            await show.save();
        }
    }

    private async updateShow(show: Show, details: TMDBShowDetails): Promise<void> {
        show.name = details.name;
        show.description = details.overview || '';
        show.externalUrls = arrayUnique(show.externalUrls.concat([TMDB.showUrl(details)]));

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

}

export default facade(CatalogService);
