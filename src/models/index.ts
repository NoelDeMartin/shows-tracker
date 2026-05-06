import type Episode from '@/models/Episode';
import type EpisodeWatched from '@/models/EpisodeWatched';
import type Season from '@/models/Season';
import type Show from '@/pages/Show.vue';

declare module 'soukai-bis' {
    interface ModelsRegistry {
        Season: typeof Season;
        Episode: typeof Episode;
        EpisodeWatched: typeof EpisodeWatched;
        Show: typeof Show;
    }
}
