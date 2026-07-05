import { defineServiceState } from '@aerogel/core';
import { objectFromEntries } from '@noeldemartin/utils';
import { shallowRef } from 'vue';

import type Show from '@/models/Show';

export default defineServiceState({
    name: 'catalog',
    initialState: () => ({
        shows: shallowRef([] as Show[]),
    }),
    computed: {
        showsBySlug: ({ shows }) => objectFromEntries(Object.values(shows).map((show) => [show.slug, show])),
        showsWithUrl: ({ shows }) => shows.filter((show) => show.hasUrl()),
    },
});
