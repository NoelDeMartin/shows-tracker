import type { Relation } from 'soukai';

import Episode from '@/models/Episode';
import Show from '@/models/Show';

import Model from './WatchAction.schema';

export const watchStatuses = ['watching', 'completed', 'dropped', 'pending'] as const;
export type WatchStatus = (typeof watchStatuses)[number];

export default class WatchAction extends Model {

    declare public show?: Show;
    declare public episode?: Episode;

    public showRelationship(): Relation {
        return this.belongsToOne(Show, 'object');
    }

    public episodeRelationship(): Relation {
        return this.belongsToOne(Episode, 'object');
    }

}
