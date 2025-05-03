import { isISO8601Duration, parseHumanReadableDuration, renderISO8601Duration } from '@/utils/iso8601';

import Model from './Episode.schema';

export default class Episode extends Model {

    protected async beforeSave(ignoreRelations?: boolean): Promise<void> {
        await super.beforeSave(ignoreRelations);

        if (this.duration && !isISO8601Duration(this.duration)) {
            this.duration = renderISO8601Duration(parseHumanReadableDuration(this.duration) ?? {});
        }
    }

}
