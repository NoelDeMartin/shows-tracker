import { Service } from '@aerogel/core';
import { facade } from '@noeldemartin/utils';
import { array, extend, nullable, number, object, optional, string, enum as zodEnum } from '@zod/mini';
import type { infer as ZodInfer, ZodMiniType } from '@zod/mini';

const TMDBShowSchema = object({
    id: number(),
    name: string(),
    overview: optional(nullable(string())),
    first_air_date: optional(string()),
    last_air_date: optional(string()),
    poster_path: optional(nullable(string())),
    number_of_seasons: optional(number()),
    number_of_episodes: optional(number()),
    vote_average: optional(number()),
});

const TMDBShowExternalIdsSchema = object({
    imdb_id: optional(nullable(string())),
});

const TMDBSeasonSchema = object({
    id: number(),
    name: string(),
    season_number: number(),
    episode_count: optional(number()),
    overview: optional(nullable(string())),
    air_date: optional(nullable(string())),
});

const TMDBEpisodeSchema = object({
    id: number(),
    name: string(),
    episode_number: number(),
    season_number: number(),
    overview: optional(nullable(string())),
    air_date: optional(nullable(string())),
    runtime: optional(nullable(number())),
});

const TMDBShowExtraSchema = object({
    seasons: array(TMDBSeasonSchema),
    status: zodEnum(['Ended', 'Canceled', 'Planned', 'Pilot', 'Returning Series', 'In Production']),
});
const TMDBShowDetailsSchema = extend(TMDBShowSchema, TMDBShowExtraSchema);

const TMDBSeasonExtraSchema = object({ episodes: array(TMDBEpisodeSchema) });
const TMDBSeasonDetailsSchema = extend(TMDBSeasonSchema, TMDBSeasonExtraSchema);

const FindResponseSchema = object({
    tv_results: array(TMDBShowSchema),
});

const SearchShowsResponseSchema = object({
    page: number(),
    total_results: number(),
    total_pages: number(),
    results: array(TMDBShowSchema),
});

export type TMDBShow = ZodInfer<typeof TMDBShowSchema>;
export type TMDBSeason = ZodInfer<typeof TMDBSeasonSchema>;
export type TMDBEpisode = ZodInfer<typeof TMDBEpisodeSchema>;
export type TMDBShowDetails = ZodInfer<typeof TMDBShowSchema> & ZodInfer<typeof TMDBShowExtraSchema>;
export type TMDBSeasonDetails = ZodInfer<typeof TMDBSeasonSchema> & ZodInfer<typeof TMDBSeasonExtraSchema>;
export type TMDBShowExternalIds = ZodInfer<typeof TMDBShowExternalIdsSchema>;

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

    public async getShowDetails(id: number): Promise<TMDBShowDetails> {
        // https://github.com/colinhacks/zod/issues/4082
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.request(TMDBShowDetailsSchema as any, `tv/${id}`);
    }

    public async getShowExternalIds(id: number): Promise<TMDBShowExternalIds> {
        // https://github.com/colinhacks/zod/issues/4082
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.request(TMDBShowExternalIdsSchema as any, `tv/${id}/external_ids`);
    }

    public async getSeasonDetails(showId: number, seasonNumber: number): Promise<TMDBSeasonDetails> {
        // https://github.com/colinhacks/zod/issues/4082
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.request(TMDBSeasonDetailsSchema as any, `tv/${showId}/season/${seasonNumber}`);
    }

    private async request<T extends ZodMiniType>(
        schema: T,
        path: string,
        parameters: Record<string, string | number> = {},
    ): Promise<ZodInfer<T>> {
        const url = new URL(`${this.baseUrl}/${path}`);

        // Add default parameters
        Object.entries(this.defaultParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        // Add custom parameters
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
