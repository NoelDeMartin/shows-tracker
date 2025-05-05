import { arraySorted } from '@noeldemartin/utils';
import { emitModelEvent } from 'soukai';
import type { Relation } from 'soukai';
import type { SolidBelongsToManyRelation, SolidHasOneRelation } from 'soukai-solid';

import Episode from '@/models/Episode';
import Show from '@/models/Show';

import Model from './Season.schema';

export default class Season extends Model {

    public static boot(name?: string): void {
        super.boot(name);

        Episode.on('updated', (episode) => episode.season && emitModelEvent(episode.season, 'updated'));
    }

    declare public show?: Show;
    declare public relatedShow: SolidHasOneRelation<Season, Show, typeof Show>;
    declare public episodes?: Episode[];
    declare public relatedEpisodes: SolidBelongsToManyRelation<Season, Episode, typeof Episode>;

    public get sortedEpisodes(): Episode[] {
        return arraySorted(this.episodes ?? [], 'number');
    }

    public showRelationship(): Relation {
        return this.hasOne(Show, 'seasonUrls');
    }

    public episodesRelationship(): Relation {
        return this.belongsToMany(Episode).usingSameDocument().onDelete('cascade');
    }

}
