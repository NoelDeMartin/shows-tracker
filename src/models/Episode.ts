import { emitModelEvent } from 'soukai';
import type { Relation } from 'soukai';
import type { Nullable } from '@noeldemartin/utils';
import type { SolidHasOneRelation } from 'soukai-solid';

import { isISO8601Duration, parseHumanReadableDuration, renderISO8601Duration } from '@/utils/iso8601';

import Season from '@/models/Season';
import WatchAction from '@/models/WatchAction';
import type Show from '@/models/Show';

import Model from './Episode.schema';

const formatNumber = (value?: Nullable<number>) => (value || 0).toString().padStart(2, '0');

export default class Episode extends Model {

    public static boot(name?: string): void {
        super.boot(name);

        Season.on('updated', async (season) => {
            const episodes = season.episodes ?? [];

            await Promise.all(episodes.map((episode) => emitModelEvent(episode, 'updated')));
        });
        WatchAction.on(
            'created',
            (watchAction) => watchAction.episode && emitModelEvent(watchAction.episode, 'updated'),
        );
        WatchAction.on(
            'deleted',
            (watchAction) => watchAction.episode && emitModelEvent(watchAction.episode, 'updated'),
        );
        WatchAction.on(
            'updated',
            (watchAction) => watchAction.episode && emitModelEvent(watchAction.episode, 'updated'),
        );
    }

    declare public season?: Season;
    declare public relatedSeason: SolidHasOneRelation<Episode, Season, typeof Season>;
    declare public watchAction?: WatchAction;
    declare public relatedWatchAction: SolidHasOneRelation<Episode, WatchAction, typeof WatchAction>;

    public get show(): Show | null {
        return this.season?.show ?? null;
    }

    public get shortName(): string {
        return `S${formatNumber(this.season?.number)}E${formatNumber(this.number)}`;
    }

    public get watched(): boolean {
        return !!this.watchAction;
    }

    public async toggle(): Promise<void> {
        await (this.watched ? this.unwatch() : this.watch());
    }

    public async unwatch(): Promise<void> {
        if (!this.watched) {
            return;
        }

        await this.relatedWatchAction.remove();
    }

    public async watch(): Promise<void> {
        if (this.watched) {
            return;
        }

        await this.relatedWatchAction.create({ date: new Date() });

        // Update show status if it's currently "pending"
        if (this.show?.status === 'pending') {
            const watchAction = this.show.watchAction ?? this.show.relatedWatchAction.attach();

            await watchAction.update({ status: 'watching' });
        }
    }

    public seasonRelationship(): Relation {
        return this.hasOne(Season, 'episodeUrls');
    }

    public watchActionRelationship(): Relation {
        return this.hasOne(WatchAction, 'object').usingSameDocument().onDelete('cascade');
    }

    protected async beforeSave(ignoreRelations?: boolean): Promise<void> {
        await super.beforeSave(ignoreRelations);

        if (this.duration && !isISO8601Duration(this.duration)) {
            this.duration = renderISO8601Duration(parseHumanReadableDuration(this.duration) ?? {});
        }
    }

}
