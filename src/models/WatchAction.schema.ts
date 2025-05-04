import { FieldType } from 'soukai';
import { defineSolidModelSchema } from 'soukai-solid';
import { invert } from '@noeldemartin/utils';
import type { Nullable } from '@noeldemartin/utils';
import type { ModelKey } from 'soukai';

import type { WatchStatus } from '@/models/WatchAction';

const WATCH_STATUSES = {
    'https://schema.org/ActiveActionStatus': 'watching',
    'https://schema.org/CompletedActionStatus': 'completed',
    'https://schema.org/FailedActionStatus': 'dropped',
    'https://schema.org/PotentialActionStatus': 'pending',
} as Record<string, WatchStatus>;
const WATCH_STATUSES_INVERTED = invert(WATCH_STATUSES);

export default defineSolidModelSchema({
    rdfContext: 'https://schema.org/',
    fields: {
        object: {
            required: true,
            type: FieldType.Key,
        },
        date: {
            type: FieldType.Date,
            rdfProperty: 'endTime',
        },
        status: {
            rdfProperty: 'actionStatus',
            type: FieldType.Key,
            serialize(value?: Nullable<{ '@id': WatchStatus }>): { '@id': string } | undefined {
                if (!value) {
                    return;
                }

                return { '@id': WATCH_STATUSES_INVERTED[value['@id']] };
            },
            deserialize(value?: Nullable<ModelKey>): WatchStatus | undefined {
                if (!value) {
                    return;
                }

                return WATCH_STATUSES[value.toString()];
            },
        },
    },
});
