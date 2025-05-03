import { FieldType } from 'soukai';
import { defineSolidModelSchema } from 'soukai-solid';

export default defineSolidModelSchema({
    rdfContext: 'https://schema.org/',
    rdfsClass: 'TVSeason',
    fields: {
        number: {
            type: FieldType.Number,
            rdfProperty: 'seasonNumber',
        },
        episodeUrls: {
            type: FieldType.Array,
            rdfProperty: 'episode',
            items: FieldType.Key,
        },
    },
});
