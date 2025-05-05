import type Episode from '@/models/Episode';
import type Season from '@/models/Season';
import type Show from '@/models/Show';
import type WatchAction from '@/models/WatchAction';

declare module 'soukai' {
    interface ModelsRegistry {
        Episode: typeof Episode;
        Season: typeof Season;
        Show: typeof Show;
        WatchAction: typeof WatchAction;
    }
}
