import { FieldType } from 'soukai';
import { defineSolidModelSchema } from 'soukai-solid';

export default defineSolidModelSchema({
    rdfContext: 'https://schema.org/',
    rdfsClass: 'TVEpisode',
    fields: {
        name: FieldType.String,
        description: FieldType.String,
        duration: FieldType.String,
        number: {
            type: FieldType.Number,
            rdfProperty: 'episodeNumber',
        },
        publishedAt: {
            type: FieldType.Date,
            rdfProperty: 'datePublished',
        },
    },
});
