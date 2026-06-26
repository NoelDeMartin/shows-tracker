import { defineRouteBindings, defineRoutes } from '@aerogel/plugin-routing';

import ShowModel from '@/models/Show';

import Home from './Home.vue';
import ShowsImport from './shows/Import.vue';
import ShowsIndex from './shows/Index.vue';
import ShowsSearch from './shows/Search.vue';
import ShowsShow from './shows/Show.vue';

export const bindings = defineRouteBindings({
    show: ShowModel,
});

export default defineRoutes([
    { name: 'home', path: '/', component: Home },
    { name: 'shows.index', path: '/shows', component: ShowsIndex },
    { name: 'shows.import', path: '/shows/import', component: ShowsImport },
    { name: 'shows.search', path: '/shows/search', component: ShowsSearch },
    { name: 'shows.show', path: '/shows/:show', component: ShowsShow },
]);
