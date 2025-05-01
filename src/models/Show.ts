import { urlFileName } from '@noeldemartin/utils';
import type { BelongsToOneRelation, Relation } from 'soukai';

import Review from '@/models/Review';

import Model from './Show.schema';

export default class Show extends Model {

    public static cloud = true;
    public static history = true;

    declare public review?: Review;
    declare public relatedReview: BelongsToOneRelation<Show, Review, typeof Review>;

    public get completed(): boolean {
        return !!this.endDate;
    }

    public set completed(value: boolean) {
        this.endDate = value ? new Date() : undefined;
    }

    public get rating(): number | null {
        return this.review?.rating?.value ?? null;
    }

    public set rating(value: number | null) {
        if (value === null) {
            this.reviewUrl = undefined;

            this.review?.rating?.delete();
            this.review?.delete();

            return;
        }

        const review = this.review ?? this.relatedReview.attach();
        const rating = review.rating ?? review.relatedRating.attach();

        rating.value = value;
    }

    public get slug(): string {
        return urlFileName(this.url);
    }

    public reviewRelationship(): Relation {
        return this.belongsToOne(Review).usingSameDocument();
    }

}
