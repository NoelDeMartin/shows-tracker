import { FieldType } from 'soukai';
import { defineSolidModelSchema } from 'soukai-solid';

export default defineSolidModelSchema({
    rdfContext: 'https://schema.org/',
    rdfsClass: 'TVSeries',
    fields: {
        name: FieldType.String,
        description: FieldType.String,
        endDate: FieldType.Date,
        seasons: {
            type: FieldType.Number,
            rdfProperty: 'numberOfSeasons',
        },
        episodes: {
            type: FieldType.Number,
            rdfProperty: 'numberOfEpisodes',
        },
        reviewUrl: {
            type: FieldType.Key,
            rdfProperty: 'review',
        },
        externalUrls: {
            type: FieldType.Array,
            rdfProperty: 'schema:sameAs',
            items: { type: FieldType.String },
        },
    },
});
