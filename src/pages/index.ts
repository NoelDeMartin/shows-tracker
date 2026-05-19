import { defineRouteBindings, defineRoutes } from '@aerogel/plugin-routing';

import ShowModel from '@/models/Show';

import Home from './Home.vue';
import Search from './Search.vue';
import ShowsIndex from './shows/Index.vue';
import ShowsShow from './shows/Show.vue';

export const bindings = defineRouteBindings({
    show: ShowModel,
});

export default defineRoutes([
    { name: 'home', path: '/', component: Home },
    { name: 'shows.index', path: '/shows', component: ShowsIndex },
    { name: 'shows.show', path: '/shows/:show', component: ShowsShow },
    { name: 'search', path: '/search', component: Search },
]);
