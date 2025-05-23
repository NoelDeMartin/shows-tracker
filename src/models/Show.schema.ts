import { FieldType } from 'soukai';
import { defineSolidModelSchema } from 'soukai-solid';

export default defineSolidModelSchema({
    rdfContext: 'https://schema.org/',
    rdfsClass: 'TVSeries',
    fields: {
        name: FieldType.String,
        description: FieldType.String,
        startDate: FieldType.Date,
        endDate: FieldType.Date,
        imageUrl: {
            type: FieldType.Key,
            rdfProperty: 'image',
        },
        seasonUrls: {
            type: FieldType.Array,
            rdfProperty: 'containsSeason',
            items: FieldType.Key,
        },
        externalUrls: {
            type: FieldType.Array,
            rdfProperty: 'schema:sameAs',
            items: FieldType.Key,
        },
    },
});
