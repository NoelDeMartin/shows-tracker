import { arraySorted, urlFileName } from '@noeldemartin/utils';
import { emitModelEvent } from 'soukai';
import type { Relation } from 'soukai';
import type { SolidBelongsToManyRelation, SolidHasOneRelation } from 'soukai-solid';

import Season from '@/models/Season';
import WatchAction from '@/models/WatchAction';
import Episode from '@/models/Episode';
import type { WatchStatus } from '@/models/WatchAction';

import Model from './Show.schema';

export default class Show extends Model {

    public static cloud = true;
    public static history = true;

    public static boot(name?: string): void {
        super.boot(name);

        Season.on('updated', (season) => season.show && emitModelEvent(season.show, 'updated'));
        Episode.on('updated', (episode) => episode.show && emitModelEvent(episode.show, 'updated'));
        WatchAction.on('created', (watchAction) => watchAction.show && emitModelEvent(watchAction.show, 'updated'));
        WatchAction.on('updated', (watchAction) => watchAction.show && emitModelEvent(watchAction.show, 'updated'));
    }

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

    public get tmdbId(): number | null {
        // Look for TMDB URL in the external URLs
        const tmdbUrl = this.externalUrls.find((url) => url.includes('themoviedb.org/tv/'));

        if (!tmdbUrl) {
            return null;
        }

        // Extract ID from URL like https://www.themoviedb.org/tv/123456
        const match = tmdbUrl.match(/\/tv\/(\d+)/);

        return match && parseInt(match[1], 10);
    }

    public get sortedSeasons(): Season[] {
        return arraySorted(this.seasons ?? [], 'number');
    }

    public get episodes(): Episode[] {
        return (this.seasons ?? []).flatMap((season) => season.episodes ?? []);
    }

    public get nextEpisode(): Episode | null {
        for (const season of this.sortedSeasons) {
            for (const episode of season.sortedEpisodes) {
                if (episode.watched) {
                    continue;
                }

                return episode;
            }
        }

        return null;
    }

    public watchActionRelationship(): Relation {
        return this.hasOne(WatchAction, 'object').usingSameDocument().onDelete('cascade');
    }

    public seasonsRelationship(): Relation {
        return this.belongsToMany(Season).usingSameDocument().onDelete('cascade');
    }

}
