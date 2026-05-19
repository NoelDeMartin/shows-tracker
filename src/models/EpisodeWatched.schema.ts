import { defineSchema } from 'soukai-bis';
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
});
