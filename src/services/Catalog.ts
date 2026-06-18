import { trackModels } from '@aerogel/plugin-solid';
import { arrayUnique, facade } from '@noeldemartin/utils';
import { ComputedAttribute } from 'soukai-bis';
import type { GetModelInput } from 'soukai-bis';

import type Episode from '@/models/Episode';
import type Season from '@/models/Season';
import Show from '@/models/Show';
import TMDB, {
    type TMDBEpisode,
    type TMDBSeason,
    type TMDBShow,
    type TMDBShowDetails,
    type TMDBShowExternalIds,
} from '@/services/TMDB';

import Service from './Catalog.state';

export class CatalogService extends Service {
    public async sync(show: Show): Promise<void> {
        if (!show.tmdbId) {
            return;
        }

        await show.loadAllRelationsIfUnloaded();

        const [details, externalIds] = await Promise.all([
            TMDB.getShowDetails(show.tmdbId),
            TMDB.getShowExternalIds(show.tmdbId),
        ]);

        const attributes = this.getShowAttributes(details, externalIds);

        show.setAttributes({
            ...attributes,
            externalUrls: arrayUnique([...show.externalUrls, ...(attributes.externalUrls ?? [])]),
        });

        ComputedAttribute.disableRefreshes();
        ComputedAttribute.disableLoadingRelations();

        try {
            for (const tmdbSeason of details.seasons) {
                if (tmdbSeason.season_number === 0) {
                    continue;
                }

                const seasonDetails = await TMDB.getSeasonDetails(details.id, tmdbSeason.season_number);
                const seasonAttributes = this.getSeasonAttributes(tmdbSeason);
                const season =
                    show.seasons?.find((season) => season.number === tmdbSeason.season_number) ??
                    (await show.relatedSeasons.create(seasonAttributes));

                season.setAttributes(seasonAttributes);

                for (const tmdbEpisode of seasonDetails.episodes) {
                    const episodeAttributes = this.getEpisodeAttributes(tmdbEpisode);
                    const episode = season.episodes?.find((episode) => episode.number === tmdbEpisode.episode_number);

                    if (episode) {
                        await episode.update(episodeAttributes);
                    } else {
                        await season.relatedEpisodes.create(episodeAttributes);
                    }
                }
            }

            await show.save();
        } finally {
            ComputedAttribute.enableRefreshes();
            ComputedAttribute.enableLoadingRelations();
        }

        await show.pendingEpisodeDates.updateValue({ refresh: true, loadRelations: true });
    }

    public async import(show: TMDBShow): Promise<void> {
        const tmdbUrl = TMDB.showUrl(show);
        const alreadyImported = this.shows.some((existingShow) => existingShow.externalUrls.includes(tmdbUrl));

        if (alreadyImported) {
            return;
        }

        const [details, externalIds] = await Promise.all([
            TMDB.getShowDetails(show.id),
            TMDB.getShowExternalIds(show.id),
        ]);

        const createdShow = await Show.create(this.getShowAttributes(details, externalIds));

        ComputedAttribute.disableRefreshes();
        ComputedAttribute.disableLoadingRelations();

        try {
            for (const tmdbSeason of details.seasons) {
                if (tmdbSeason.season_number === 0) {
                    continue;
                }

                const season = await createdShow.relatedSeasons.create(this.getSeasonAttributes(tmdbSeason));
                const seasonDetails = await TMDB.getSeasonDetails(details.id, tmdbSeason.season_number);

                for (const tmdbEpisode of seasonDetails.episodes) {
                    await season.relatedEpisodes.create(this.getEpisodeAttributes(tmdbEpisode));
                }
            }

            await createdShow.save();
        } finally {
            ComputedAttribute.enableRefreshes();
            ComputedAttribute.enableLoadingRelations();
        }

        await createdShow.pendingEpisodeDates.updateValue({ refresh: true, loadRelations: true });
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
}

export default facade(CatalogService);
