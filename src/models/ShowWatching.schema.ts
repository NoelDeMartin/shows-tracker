import { defineSchema } from 'soukai-bis';
import z from 'zod';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'WatchAction',
    history: true,
    fields: {
        showUrl: z.url().rdfProperty('object'),
        statusUrl: z.url().rdfProperty('actionStatus').optional(),
    },
});
