import { BindingNotFound, defineRouteBindings, defineRoutes } from '@aerogel/plugin-routing';
import { getTrackedModels } from '@aerogel/plugin-soukai';

import Show from '@/models/Show';

import Home from './Home.vue';
import ShowsCreate from './shows/Create.vue';
import ShowsEdit from './shows/Edit.vue';
import ShowsIndex from './shows/Index.vue';
import ShowsImport from './shows/Import.vue';
import ShowsShow from './shows/show/Show.vue';

export const bindings = defineRouteBindings({
    show(slug) {
        const shows = getTrackedModels(Show);
        const show = shows.find((model) => model.slug === slug) ?? null;

        return show ?? new BindingNotFound(slug);
    },
});

export default defineRoutes([
    { name: 'home', path: '/', component: Home },
    { name: 'shows.index', path: '/shows', component: ShowsIndex },
    { name: 'shows.import', path: '/shows/import', component: ShowsImport },
    { name: 'shows.show', path: '/shows/:show', component: ShowsShow },
    { name: 'shows.create', path: '/shows/create', component: ShowsCreate },
    { name: 'shows.edit', path: '/shows/:show/edit', component: ShowsEdit },
]);
