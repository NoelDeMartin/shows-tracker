import { trackModels } from '@aerogel/plugin-solid';
import { arrayUnique, facade, arrayFrom } from '@noeldemartin/utils';
import type { Nullable } from '@noeldemartin/utils';
import { ComputedAttribute } from 'soukai-bis';
import type { GetModelInput } from 'soukai-bis';

import type Episode from '@/models/Episode';
import type Season from '@/models/Season';
import Show from '@/models/Show';
import type { ShowWatchingStatus } from '@/models/ShowWatching';
import TMDB, {
    type TMDBEpisode,
    type TMDBSeason,
    type TMDBShow,
    type TMDBShowDetails,
    type TMDBShowExternalIds,
} from '@/services/TMDB';
import TViso from '@/services/TViso';

import Service from './Catalog.state';

const WATCHING_STATUSES_WITHOUT_SEASONS = ['dropped', 'pending'] satisfies ShowWatchingStatus[];

export interface ImportResults {
    imported: Array<{ title: string }>;
    skipped: Array<{ title: string; reason: string }>;
    failed: Array<{ title: string; reason: string }>;
}

export class CatalogService extends Service {
    public async needsSync(show: Show): Promise<boolean> {
        if (WATCHING_STATUSES_WITHOUT_SEASONS.includes(show.watchingStatus)) {
            return false;
        }

        await show.loadRelationIfUnloaded('seasons');

        return !show.seasons || show.seasons.length === 0;
    }

    public async syncIfNeeded(show: Show): Promise<void> {
        const needsSync = await this.needsSync(show);

        if (!needsSync) {
            return;
        }

        await this.sync(show);
    }

    public async sync(show: Show): Promise<void> {
        if (!show.tmdbId) {
            return;
        }

        await show.loadAllRelationsIfUnloaded();

        const { details, externalIds, seasons } = await TMDB.getShow(show.tmdbId, {
            includeExternalIds: true,
            includeSeasons: !WATCHING_STATUSES_WITHOUT_SEASONS.includes(show.watchingStatus),
        });
        const attributes = this.getShowAttributes(details, externalIds);

        show.setAttributes({
            ...attributes,
            externalUrls: arrayUnique([...show.externalUrls, ...(attributes.externalUrls ?? [])]),
        });

        ComputedAttribute.disableRefreshes();
        ComputedAttribute.disableLoadingRelations();

        try {
            for (const tmdbSeason of seasons) {
                const seasonAttributes = this.getSeasonAttributes(tmdbSeason.season);
                const season =
                    show.seasons?.find((season) => season.number === tmdbSeason.season.season_number) ??
                    (await show.relatedSeasons.create(seasonAttributes));

                season.setAttributes(seasonAttributes);

                for (const tmdbEpisode of tmdbSeason.details.episodes) {
                    const episodeAttributes = this.getEpisodeAttributes(tmdbEpisode);
                    const episode = season.episodes?.find((episode) => episode.number === tmdbEpisode.episode_number);

                    if (episode) {
                        episode.setAttributes(episodeAttributes);
                    } else {
                        season.relatedEpisodes.attach(episodeAttributes);
                    }
                }

                await Promise.all(season.relatedEpisodes.getLoadedModels().map((episode) => episode.save()));
                await season.save();
            }

            await show.save();
        } finally {
            ComputedAttribute.enableRefreshes();
            ComputedAttribute.enableLoadingRelations();
        }

        await show.pendingEpisodeDates.updateValue({ refresh: true, loadRelations: true });
    }

    public async importFromTMDB(
        tmdbShow: TMDBShow,
        options: { watchingStatus?: Nullable<ShowWatchingStatus> } = {},
    ): Promise<void> {
        await this.importShow(tmdbShow, options);
    }

    public async importFromTViso(
        shows: unknown,
        options: { onProgress?(current: number, total: number): void; signal?: AbortSignal } = {},
    ): Promise<ImportResults> {
        const results: ImportResults = {
            imported: [],
            skipped: [],
            failed: [],
        };

        const showsArray = arrayFrom(shows);
        const total = showsArray.length;

        options.onProgress?.(0, total);

        for (const [index, show] of showsArray.entries()) {
            if (options.signal?.aborted) {
                for (let i = index; i < total; i++) {
                    const remainingShow = showsArray[i];

                    results.skipped.push({
                        title: Object(remainingShow).title ?? Object(remainingShow).name ?? `Item ${i + 1}`,
                        reason: 'Import cancelled',
                    });
                }

                break;
            }

            try {
                const parsed = await this.parseShow(show);

                if ('skipped' in parsed) {
                    results.skipped.push(parsed.skipped);

                    continue;
                }

                if ('failed' in parsed) {
                    results.failed.push(parsed.failed);

                    continue;
                }

                const tmdbShow = parsed.show;

                if (this.hasByTmdbId(tmdbShow.id)) {
                    results.skipped.push({
                        title: tmdbShow.name,
                        reason: 'Already in catalog',
                    });

                    continue;
                }

                await this.importShow(tmdbShow, {
                    imdbId: parsed.imdbId,
                    watchingStatus: parsed.watchingStatus,
                });

                results.imported.push({ title: tmdbShow.name });
            } catch {
                results.failed.push({
                    title: Object(show).title ?? Object(show).name ?? `Item ${index + 1}`,
                    reason: 'Validation or import error',
                });
            } finally {
                options.onProgress?.(index + 1, total);
            }
        }

        return results;
    }

    private async importShow(
        tmdbShow: TMDBShow,
        options: { imdbId?: Nullable<string>; watchingStatus?: Nullable<ShowWatchingStatus> } = {},
    ): Promise<Show> {
        const { details, externalIds, seasons } = await TMDB.getShow(tmdbShow.id, {
            includeExternalIds: !options.imdbId,
            includeSeasons:
                !!options.watchingStatus && !WATCHING_STATUSES_WITHOUT_SEASONS.includes(options.watchingStatus),
        });

        const showAttributes = this.getShowAttributes(details, externalIds);

        if (options.imdbId && !showAttributes.externalUrls?.some((url) => url.includes(`/title/${options.imdbId}`))) {
            showAttributes.externalUrls?.push(TViso.imdbUrl(options.imdbId));
        }

        const show = await Show.create(showAttributes);

        ComputedAttribute.disableRefreshes();
        ComputedAttribute.disableLoadingRelations();

        try {
            for (const tmdbSeason of seasons) {
                const season = await show.relatedSeasons.create(this.getSeasonAttributes(tmdbSeason.season));

                for (const tmdbEpisode of tmdbSeason.details.episodes) {
                    season.relatedEpisodes.attach(this.getEpisodeAttributes(tmdbEpisode));
                }

                await Promise.all(season.relatedEpisodes.getLoadedModels().map((episode) => episode.save()));
                await season.save();
            }

            if (options.watchingStatus) {
                await show.updateWatchingStatus(options.watchingStatus);
            }

            await show.save();
        } finally {
            ComputedAttribute.enableRefreshes();
            ComputedAttribute.enableLoadingRelations();
        }

        await show.pendingEpisodeDates.updateValue({ refresh: true, loadRelations: true });

        return show;
    }

    protected async boot(): Promise<void> {
        await trackModels(Show, {
            service: this,
            property: 'shows',
        });
    }

    protected getShowAttributes(
        details: TMDBShowDetails,
        externalIds: TMDBShowExternalIds,
    ): GetModelInput<typeof Show> {
        const externalUrls = [TMDB.showUrl(details)];

        if (externalIds.imdb_id) {
            externalUrls.push(`https://www.imdb.com/title/${externalIds.imdb_id}/`);
        }

        return {
            name: details.name,
            description: details.overview,
            imageUrl: TMDB.showImageUrl(details),
            startDate: details.first_air_date ? new Date(details.first_air_date) : undefined,
            endDate: details.last_air_date ? new Date(details.last_air_date) : undefined,
            externalUrls,
        };
    }

    protected getSeasonAttributes(season: TMDBSeason): GetModelInput<typeof Season> {
        return {
            number: season.season_number,
        };
    }

    protected getEpisodeAttributes(episode: TMDBEpisode): GetModelInput<typeof Episode> {
        return {
            name: episode.name,
            number: episode.episode_number,
            publishedAt: episode.air_date ? new Date(episode.air_date) : undefined,
        };
    }

    protected async parseShow(
        show: unknown,
    ): Promise<
        | { show: TMDBShow; imdbId?: Nullable<string>; watchingStatus?: Nullable<ShowWatchingStatus> }
        | { skipped: ImportResults['skipped'][number] }
        | { failed: ImportResults['failed'][number] }
    > {
        if (TMDB.isTmdbShow(show)) {
            return { show };
        }

        const tvisoShow = TViso.parseShow(show);

        if (!TViso.isTvShow(tvisoShow)) {
            return {
                skipped: {
                    title: tvisoShow.title,
                    reason: 'Not a TV show',
                },
            };
        }

        if (tvisoShow.imdb && this.hasByImdbId(tvisoShow.imdb)) {
            return {
                skipped: {
                    title: tvisoShow.title,
                    reason: 'Already in catalog',
                },
            };
        }

        const [tmdbShow] = await TMDB.searchShows(tvisoShow.title, tvisoShow.imdb);

        if (!tmdbShow) {
            return {
                failed: {
                    title: tvisoShow.title,
                    reason: 'Not found on TMDB',
                },
            };
        }

        return {
            show: tmdbShow,
            imdbId: tvisoShow.imdb,
            watchingStatus: TViso.mapStatus(tvisoShow.status),
        };
    }

    protected hasByTmdbId(tmdbId: number): boolean {
        return this.shows.some((show) => show.tmdbId === tmdbId);
    }

    protected hasByImdbId(imdbId: string): boolean {
        return this.shows.some((show) => show.imdbId === imdbId);
    }
}

export default facade(CatalogService);
