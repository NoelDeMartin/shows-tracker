import { arraySorted, stringToSlug, urlFileName, urlResolve, uuid } from '@noeldemartin/utils';
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

    public get slug(): string | undefined {
        if (!this.url) {
            return;
        }

        if (this.url.endsWith('/info#it')) {
            return urlFileName(this.url.slice(0, -8));
        }

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

    public get imdbId(): string | null {
        // Look for IMDB URL in the external URLs
        const imdbUrl = this.externalUrls.find((url) => url.includes('imdb.com/title/'));

        if (!imdbUrl) {
            return null;
        }

        // Extract ID from URL like https://www.imdb.com/title/tt123456/
        const match = imdbUrl.match(/\/title\/(tt\d+)/);

        return match && match[1];
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

    public async loadRelationsIfUnloaded(): Promise<void> {
        await this.loadRelationIfUnloaded('seasons');
        await Promise.all(this.seasons?.map((season) => season.loadRelationIfUnloaded('episodes')) ?? []);
        await emitModelEvent(this, 'updated');
        await Promise.all(this.seasons?.map((season) => emitModelEvent(season, 'updated')) ?? []);
    }

    public async updateStatus(status: WatchStatus): Promise<void> {
        if (status === this.status) {
            await this.save();

            return;
        }

        const watchAction = this.watchAction ?? this.relatedWatchAction.attach();

        watchAction.status = status;

        await this.save();
    }

    public watchActionRelationship(): Relation {
        return this.hasOne(WatchAction, 'object').usingSameDocument().onDelete('cascade');
    }

    public seasonsRelationship(): Relation {
        return this.belongsToMany(Season).usingSameDocument().onDelete('cascade');
    }

    protected newUrl(documentUrl?: string, resourceHash?: string): string {
        const slug = this.name
            ? this.startDate
                ? `${stringToSlug(this.name)}-${this.startDate.getFullYear()}`
                : stringToSlug(this.name)
            : uuid();
        documentUrl = documentUrl ?? urlResolve(this.static().collection, `${slug}/info`);
        resourceHash = resourceHash ?? this.static().defaultResourceHash ?? 'it';

        return `${documentUrl}#${resourceHash}`;
    }

}
