import { stringToSlug, tap, urlResolve, uuid } from '@noeldemartin/utils';
import { emitModelEvent, InvalidationStrategies, loaded } from 'soukai-bis';
import type { BelongsToManyRelation, ComputedAttribute, HasOneRelation, MintUrlOptions } from 'soukai-bis';

import type Season from '@/models/Season';
import ShowWatching, { SHOW_WATCHING_STATUSES } from '@/models/ShowWatching';
import type { ShowWatchingStatus } from '@/models/ShowWatching';

import Model from './Show.schema';

export default class Show extends Model {
    public static cloud = { depth: 1 };
    public static computed = {
        pendingEpisodeDates: {
            invalidationStrategy: InvalidationStrategies.CONTAINER,
            compute(show: Show) {
                return loaded(show, 'seasons').flatMap((season) =>
                    loaded(season, 'episodes')
                        .filter((episode) => !loaded(episode, 'watched'))
                        .map((episode) => episode.publishedAt),
                );
            },
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

    public get imdbId(): string | null {
        const id = this.externalUrls
            .find((url) => url.includes('imdb.com/title/'))
            ?.split('/')
            .filter(Boolean)
            .pop();

        return id?.split(/[?#]/)[0] ?? null;
    }

    public async loadAllRelationsIfUnloaded(): Promise<void> {
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
