import { arraySorted } from '@noeldemartin/utils';
import { emitModelEvent } from 'soukai';
import type { Relation } from 'soukai';
import type { SolidBelongsToManyRelation, SolidHasOneRelation } from 'soukai-solid';

import Episode from '@/models/Episode';
import Show from '@/models/Show';

import Model from './Season.schema';

export default class Season extends Model {

    public static history = true;

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

    public async watch(): Promise<void> {
        if (!this.show || !this.episodes) {
            return;
        }

        this.episodes.forEach((episode) => {
            if (episode.watched) {
                return;
            }

            episode.relatedWatchAction.attach({ date: new Date() });
        });

        await Promise.all(this.show.episodes.map((episode) => episode.save()));
        await this.show.updateStatus('watching');
        await this.emit('updated');
    }

    public showRelationship(): Relation {
        return this.hasOne(Show, 'seasonUrls');
    }

    public episodesRelationship(): Relation {
        return this.belongsToMany(Episode);
    }

}
