import { Service } from '@aerogel/core';
import { facade } from '@noeldemartin/utils';
import { z } from 'zod';

const TMDBShowSchema = z.object({
    id: z.number(),
    name: z.string(),
    overview: z.string().optional(),
    first_air_date: z.string().optional(),
    last_air_date: z.string().optional(),
    poster_path: z.string().nullable(),
    number_of_seasons: z.number().optional(),
    number_of_episodes: z.number().optional(),
    vote_average: z.number().optional(),
});

const TMDBShowExternalIdsSchema = z.object({
    imdb_id: z.string().nullable().optional(),
});

const TMDBSeasonSchema = z.object({
    id: z.number(),
    name: z.string(),
    season_number: z.number(),
    episode_count: z.number().optional(),
    overview: z.string().optional(),
    air_date: z.string().nullable(),
});

const TMDBEpisodeSchema = z.object({
    id: z.number(),
    name: z.string(),
    episode_number: z.number(),
    season_number: z.number(),
    overview: z.string().optional(),
    air_date: z.string().nullable(),
    runtime: z.number().nullable(),
});

const TMDBShowDetailsSchema = TMDBShowSchema.extend({
    seasons: z.array(TMDBSeasonSchema),
    status: z.enum(['Ended', 'Canceled', 'Planned', 'Pilot', 'Returning Series', 'In Production']),
});
const TMDBSeasonDetailsSchema = TMDBSeasonSchema.extend({ episodes: z.array(TMDBEpisodeSchema) });

const FindResponseSchema = z.object({
    tv_results: z.array(TMDBShowSchema),
});

const SearchShowsResponseSchema = z.object({
    page: z.number(),
    total_results: z.number(),
    total_pages: z.number(),
    results: z.array(TMDBShowSchema),
});

export type TMDBShow = z.infer<typeof TMDBShowSchema>;
export type TMDBSeason = z.infer<typeof TMDBSeasonSchema>;
export type TMDBEpisode = z.infer<typeof TMDBEpisodeSchema>;
export type TMDBShowDetails = z.infer<typeof TMDBShowDetailsSchema>;
export type TMDBSeasonDetails = z.infer<typeof TMDBSeasonDetailsSchema>;
export type TMDBShowExternalIds = z.infer<typeof TMDBShowExternalIdsSchema>;

export class TMDBService extends Service {
    private apiKey = import.meta.env.VITE_TMDB_API_KEY as string;
    private baseUrl = 'https://api.themoviedb.org/3';
    private defaultParams: Record<string, string> = {
        api_key: this.apiKey,
        language: 'en-US',
    };

    public showUrl(show: TMDBShow): string {
        return `https://www.themoviedb.org/tv/${show.id}`;
    }

    public showImageUrl(show: TMDBShow): string | undefined {
        return show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : undefined;
    }

    public isTmdbShow(show: unknown): show is TMDBShow {
        return TMDBShowSchema.safeParse(show).success;
    }

    public async searchShows(query: string, imdb?: string | null): Promise<TMDBShow[]> {
        if (imdb) {
            const response = await this.request(FindResponseSchema, `find/${imdb}`, { external_source: 'imdb_id' });

            if (response.tv_results.length > 0) {
                return response.tv_results;
            }
        }

        const response = await this.request(SearchShowsResponseSchema, 'search/tv', { query });

        return response.results;
    }

    public async getShow(
        id: number,
        options: { includeExternalIds: boolean; includeSeasons: boolean },
    ): Promise<{
        details: TMDBShowDetails;
        externalIds: TMDBShowExternalIds;
        seasons: { season: TMDBShowDetails['seasons'][number]; details: TMDBSeasonDetails }[];
    }> {
        const [details, externalIds] = await Promise.all([
            this.getShowDetails(id),
            options.includeExternalIds ? this.getShowExternalIds(id) : {},
        ]);
        const seasons = options.includeSeasons
            ? await Promise.all(
                  details.seasons
                      .filter((season) => season.season_number !== 0)
                      .map(async (season) => ({
                          season,
                          details: await this.getSeasonDetails(details.id, season.season_number),
                      })),
              )
            : [];

        return { details, externalIds, seasons };
    }

    private async getShowDetails(id: number): Promise<TMDBShowDetails> {
        return this.request(TMDBShowDetailsSchema, `tv/${id}`);
    }

    private async getShowExternalIds(id: number): Promise<TMDBShowExternalIds> {
        return this.request(TMDBShowExternalIdsSchema, `tv/${id}/external_ids`);
    }

    private async getSeasonDetails(showId: number, seasonNumber: number): Promise<TMDBSeasonDetails> {
        return this.request(TMDBSeasonDetailsSchema, `tv/${showId}/season/${seasonNumber}`);
    }

    private async request<T extends z.ZodType>(
        schema: T,
        path: string,
        parameters: Record<string, string | number> = {},
    ): Promise<z.infer<T>> {
        const url = new URL(`${this.baseUrl}/${path}`);

        Object.entries(this.defaultParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        Object.entries(parameters).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
        });

        const response = await fetch(url.href);

        if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        return schema.parse(data);
    }
}

export default facade(TMDBService);
