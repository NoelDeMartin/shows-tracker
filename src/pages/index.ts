import { defineRouteBindings, defineRoutes } from '@aerogel/plugin-routing';

import ShowModel from '@/models/Show';

import Home from './home/Home.vue';
import Search from './Search.vue';
import Show from './Show.vue';

export const bindings = defineRouteBindings({
    show: ShowModel,
});

export default defineRoutes([
    { name: 'home', path: '/', component: Home },
    { name: 'shows.show', path: '/shows/:show', component: Show },
    { name: 'search', path: '/search', component: Search },
]);
