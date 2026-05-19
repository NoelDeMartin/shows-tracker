import { stringToSlug, tap, urlResolve, uuid } from '@noeldemartin/utils';
import type {
    BelongsToManyRelation,
    ComputedAttribute,
    ComputedProxy,
    HasOneRelation,
    MintUrlOptions,
} from 'soukai-bis';
import { emitModelEvent } from 'soukai-bis';

import type Season from '@/models/Season';
import ShowWatching, { SHOW_WATCHING_STATUSES, type ShowWatchingStatus } from '@/models/ShowWatching';

import Model from './Show.schema';

export default class Show extends Model {
    public static cloud = { depth: 1 };
    public static computed = {
        pendingEpisodeDates(show: ComputedProxy<Show>) {
            return show.seasons.flatMap((season) =>
                season.episodes.filter((episode) => !episode.watched).map((episode) => episode.publishedAt),
            );
        },
    };

    declare public readonly pendingEpisodeDates: ComputedAttribute<Date[]>;
    declare public readonly relatedSeasons: BelongsToManyRelation<this, Season, typeof Season>;
    declare public readonly relatedWatching: HasOneRelation<this, ShowWatching, typeof ShowWatching>;

    public get slug(): string {
        return stringToSlug(this.name);
    }

    public get watchingStatus(): ShowWatchingStatus {
        return this.watching?.status ?? 'pending';
    }

    public get tmdbId(): number | null {
        const id = this.externalUrls
            .find((url) => url.startsWith('https://www.themoviedb.org/tv/'))
            ?.split('/')
            .pop();

        return id ? Number(id) : null;
    }

    public async loadAllRelations(): Promise<void> {
        await this.loadRelationIfUnloaded('seasons');
        await Promise.all(this.seasons?.map((season) => season.loadRelationIfUnloaded('episodes')) ?? []);

        for (const season of this.seasons ?? []) {
            for (const episode of season.episodes ?? []) {
                if (episode.isRelationLoaded('watched')) {
                    continue;
                }

                episode.relatedWatched.related = null;

                await emitModelEvent(episode, 'relation-loaded', episode.relatedWatched);
            }
        }
    }

    public async updateWatchingStatus(status: ShowWatchingStatus) {
        if (this.watchingStatus === status) {
            return;
        }

        const watching = tap(
            this.watching ?? this.relatedWatching.attach({}),
            (watching) => (watching.statusUrl = SHOW_WATCHING_STATUSES[status]),
        );

        await this.relatedWatching.save(watching);
    }

    protected newUrlDocumentUrl(options: MintUrlOptions = {}): string {
        const slug = this.newUrlDocumentUrlSlug() ?? uuid();

        return urlResolve(options.containerUrl ?? this.static('defaultContainerUrl'), `${slug}/info`);
    }

    protected newUrlDocumentUrlSlug(): string | null {
        if (!this.name || !this.startDate) {
            return null;
        }

        return `${stringToSlug(this.name)}-${this.startDate.getFullYear()}`;
    }
}
