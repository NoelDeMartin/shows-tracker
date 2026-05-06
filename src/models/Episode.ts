import type { HasOneRelation, MintUrlOptions } from 'soukai-bis';

import type EpisodeWatched from '@/models/EpisodeWatched';
import type Season from '@/models/Season';

import Model from './Episode.schema';

export default class Episode extends Model {
    declare public readonly relatedWatched: HasOneRelation<this, EpisodeWatched, typeof EpisodeWatched>;
    declare public readonly relatedSeason: HasOneRelation<this, Season, typeof Season>;

    public async toggleWatched(): Promise<void> {
        if (this.watched) {
            await this.relatedWatched.delete();

            return;
        }

        await this.relatedWatched.create({ date: new Date() });
    }

    protected newUrlDocumentUrl(options: MintUrlOptions = {}): string {
        if (!this.season?.getContainerUrl()) {
            return super.newUrlDocumentUrl(options);
        }

        return `${this.season.requireContainerUrl()}season-${this.season.number}/episode-${this.number}`;
    }
}
