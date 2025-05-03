import { urlFileName } from '@noeldemartin/utils';
import type { Relation } from 'soukai';
import type { SolidBelongsToManyRelation, SolidBelongsToOneRelation } from 'soukai-solid';

import Review from '@/models/Review';
import Season from '@/models/Season';

import Model from './Show.schema';

export default class Show extends Model {

    public static cloud = true;
    public static history = true;

    declare public review?: Review;
    declare public relatedReview: SolidBelongsToOneRelation<Show, Review, typeof Review>;
    declare public seasons?: Season[];
    declare public relatedSeasons: SolidBelongsToManyRelation<Show, Season, typeof Season>;

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
            // TODO implement this.relatedReview.detach()
            // This should remove review, rating, and set reviewUrl to null

            throw new Error('belongsToOne detach not implemented');
        }

        const review = this.review ?? this.relatedReview.attach();
        const rating = review.rating ?? review.relatedRating.attach();

        rating.value = value;
    }

    public get slug(): string {
        return urlFileName(this.url);
    }

    public reviewRelationship(): Relation {
        return this.belongsToOne(Review).usingSameDocument().onDelete('cascade');
    }

    public seasonsRelationship(): Relation {
        return this.belongsToMany(Season).usingSameDocument().onDelete('cascade');
    }

}
