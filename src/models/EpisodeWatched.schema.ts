import { defineSchema, belongsToOne, requireBootedModel } from 'soukai-bis';
import { z } from 'zod';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'WatchAction',
    timestamps: false,
    history: true,
    fields: {
        episodeUrl: z.url().rdfProperty('object'),
        date: z.date().optional().rdfProperty('endTime'),
    },
    relations: {
        episode: belongsToOne(() => requireBootedModel('Episode'), 'episodeUrl'),
    },
});
