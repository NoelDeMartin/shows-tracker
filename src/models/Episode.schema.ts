import { defineSchema, hasOne, requireBootedModel } from 'soukai-bis';
import { z } from 'zod';

import EpisodeWatched from '@/models/EpisodeWatched';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'TVEpisode',
    fields: {
        name: z.string(),
        number: z.number().rdfProperty('episodeNumber'),
    },
    relations: {
        season: hasOne(() => requireBootedModel('Season'), 'episodeUrls'),
        watched: hasOne(EpisodeWatched, 'targetUrl').usingSameDocument(),
    },
});
