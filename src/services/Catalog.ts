import { trackModels } from '@aerogel/plugin-solid';
import { facade } from '@noeldemartin/utils';

import Show from '@/models/Show';
import TMDB, { type TMDBShow } from '@/services/TMDB';

import Service from './Catalog.state';

export class CatalogService extends Service {
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

        const externalUrls = [tmdbUrl];
        const startDate = details.first_air_date ? new Date(details.first_air_date) : undefined;
        const endDate = details.last_air_date ? new Date(details.last_air_date) : undefined;

        if (externalIds.imdb_id) {
            externalUrls.push(`https://www.imdb.com/title/${externalIds.imdb_id}/`);
        }

        const createdShow = await Show.create({
            name: details.name,
            description: details.overview,
            imageUrl: TMDB.showImageUrl(details),
            startDate,
            endDate,
            externalUrls,
        });

        for (const tmdbSeason of details.seasons) {
            if (tmdbSeason.season_number === 0) {
                continue;
            }

            const season = await createdShow.relatedSeasons.create({
                number: tmdbSeason.season_number,
            });

            const seasonDetails = await TMDB.getSeasonDetails(details.id, tmdbSeason.season_number);

            for (const tmdbEpisode of seasonDetails.episodes) {
                await season.relatedEpisodes.create({
                    name: tmdbEpisode.name,
                    number: tmdbEpisode.episode_number,
                });
            }
        }

        await createdShow.save();
    }

    protected async boot(): Promise<void> {
        await trackModels(Show, {
            service: this,
            property: 'shows',
        });
    }
}

export default facade(CatalogService);
