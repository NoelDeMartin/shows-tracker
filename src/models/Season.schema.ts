import { belongsToMany, defineSchema } from 'soukai-bis';
import { z } from 'zod';

import Episode from '@/models/Episode';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'TVSeason',
    history: true,
    fields: {
        number: z.number().rdfProperty('seasonNumber'),
        episodeUrls: z.array(z.url()).rdfProperty('episode').default([]),
    },
    relations: {
        episodes: belongsToMany(Episode, 'episodeUrls'),
    },
});
