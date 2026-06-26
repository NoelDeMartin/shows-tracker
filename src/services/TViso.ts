import { Service } from '@aerogel/core';
import { facade } from '@noeldemartin/utils';
import { z } from 'zod';

import type { ShowWatchingStatus } from '@/models/ShowWatching';

const TVisoShowSchema = z.object({
    title: z.string(),
    imdb: z.string().nullable(),
    type: z.number().min(1).max(4), // 1 = TV show, 2 = movie, 3 = documentary, 4 = other
    status: z.string(),
});

export type TVisoShow = z.infer<typeof TVisoShowSchema>;

export class TVisoService extends Service {
    public parseShow(data: unknown): TVisoShow {
        return TVisoShowSchema.parse(data);
    }

    public isTvShow(show: TVisoShow): boolean {
        return show.type === 1;
    }

    public imdbUrl(imdbId: string): string {
        return `https://www.imdb.com/title/${imdbId}/`;
    }

    public mapStatus(status: string): ShowWatchingStatus {
        switch (status.toLowerCase()) {
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

export default facade(TVisoService);
