import { belongsToMany, defineSchema, hasOne } from 'soukai-bis';
import { z } from 'zod';

import Season from '@/models/Season';
import ShowWatching from '@/models/ShowWatching';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'TVSeries',
    history: true,
    fields: {
        name: z.string(),
        description: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        imageUrl: z.url().rdfProperty('image').optional(),
        seasonUrls: z.array(z.url()).rdfProperty('containsSeason').default([]),
        externalUrls: z.array(z.url()).rdfProperty('sameAs').default([]),
    },
    relations: {
        seasons: belongsToMany(Season, 'seasonUrls').usingSameDocument(),
        watching: hasOne(ShowWatching, 'showUrl').usingSameDocument(),
    },
});
