import { FieldType } from 'soukai';
import { defineSolidModelSchema } from 'soukai-solid';

export default defineSolidModelSchema({
    rdfContext: 'https://schema.org/',
    rdfsClass: 'Review',
    fields: {
        ratingUrl: {
            type: FieldType.Key,
            rdfProperty: 'reviewRating',
        },
    },
});
