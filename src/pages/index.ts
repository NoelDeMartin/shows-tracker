import { BindingNotFound, defineRouteBindings, defineRoutes } from '@aerogel/plugin-routing';
import { getTrackedModels } from '@aerogel/plugin-soukai';

import Show from '@/models/Show';

import ShowsCreate from './ShowsCreate.vue';
import ShowsEdit from './ShowsEdit.vue';
import ShowsIndex from './ShowsIndex.vue';
import ShowsShow from './ShowsShow.vue';

export const bindings = defineRouteBindings({
    show(slug) {
        const shows = getTrackedModels(Show);
        const show = shows.find((model) => model.slug === slug) ?? null;

        return show ?? new BindingNotFound(slug);
    },
});

export default defineRoutes([
    { name: 'home', path: '/', redirect: '/shows' },
    { name: 'shows.index', path: '/shows', component: ShowsIndex },
    { name: 'shows.show', path: '/shows/:show', component: ShowsShow },
    { name: 'shows.create', path: '/shows/create', component: ShowsCreate },
    { name: 'shows.edit', path: '/shows/:show/edit', component: ShowsEdit },
]);
