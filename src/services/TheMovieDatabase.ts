import { Service } from '@aerogel/core';
import { facade } from '@noeldemartin/utils';
import { array, nullable, number, object, optional, string } from '@zod/mini';
import type { infer as ZodInfer, ZodMiniType } from '@zod/mini';

const TMDBShowSchema = object({
    id: number(),
    name: string(),
    overview: optional(nullable(string())),
    first_air_date: optional(string()),
    poster_path: optional(nullable(string())),
    number_of_seasons: optional(number()),
    number_of_episodes: optional(number()),
    vote_average: optional(number()),
});

const SearchShowsResponseSchema = object({
    page: number(),
    total_results: number(),
    total_pages: number(),
    results: array(TMDBShowSchema),
});

export type TMDBShow = ZodInfer<typeof TMDBShowSchema>;

export class TheMovieDatabaseService extends Service {

    private apiKey = import.meta.env.VITE_TMDB_API_KEY as string;
    private baseUrl = 'https://api.themoviedb.org/3';
    private defaultParams: Record<string, string> = {
        api_key: this.apiKey,
        language: 'en-US',
    };

    public async searchShows(query: string): Promise<TMDBShow[]> {
        const response = await this.request(SearchShowsResponseSchema, 'search/tv', { query });

        return response.results;
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

export default facade(TheMovieDatabaseService);
