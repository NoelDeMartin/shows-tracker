import type { BelongsToOneRelation, Relation } from 'soukai';

import Rating from '@/models/Rating';

import Model from './Review.schema';

export default class Review extends Model {

    declare public rating?: Rating;
    declare public relatedRating: BelongsToOneRelation<Review, Rating, typeof Rating>;

    public ratingRelationship(): Relation {
        return this.belongsToOne(Rating).usingSameDocument().onDelete('cascade');
    }

}
