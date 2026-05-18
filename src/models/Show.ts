import { stringToSlug, urlResolve, uuid } from '@noeldemartin/utils';
import type { BelongsToManyRelation, ComputedAttribute, ComputedProxy, MintUrlOptions } from 'soukai-bis';

import type Season from '@/models/Season';

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

    public get slug(): string {
        return stringToSlug(this.name);
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
