import { urlFileName } from '@noeldemartin/utils';
import type { Relation } from 'soukai';
import type { SolidBelongsToManyRelation, SolidHasOneRelation } from 'soukai-solid';

import Season from '@/models/Season';
import WatchAction from '@/models/WatchAction';
import type { WatchStatus } from '@/models/WatchAction';

import Model from './Show.schema';

export default class Show extends Model {

    public static cloud = true;
    public static history = true;

    declare public watchAction?: WatchAction;
    declare public relatedWatchAction: SolidHasOneRelation<Show, WatchAction, typeof WatchAction>;
    declare public seasons?: Season[];
    declare public relatedSeasons: SolidBelongsToManyRelation<Show, Season, typeof Season>;

    public get status(): WatchStatus {
        return this.watchAction?.status ?? 'pending';
    }

    public get slug(): string {
        return urlFileName(this.url);
    }

    public watchActionRelationship(): Relation {
        return this.hasOne(WatchAction, 'object').usingSameDocument().onDelete('cascade');
    }

    public seasonsRelationship(): Relation {
        return this.belongsToMany(Season).usingSameDocument().onDelete('cascade');
    }

}
