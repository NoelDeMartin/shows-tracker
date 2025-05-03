import type { Relation } from 'soukai';
import type { SolidBelongsToManyRelation } from 'soukai-solid';

import Episode from '@/models/Episode';

import Model from './Season.schema';

export default class Season extends Model {

    declare public episodes?: Episode[];
    declare public relatedEpisodes: SolidBelongsToManyRelation<Season, Episode, typeof Episode>;

    public episodesRelationship(): Relation {
        return this.belongsToMany(Episode).usingSameDocument().onDelete('cascade');
    }

}
