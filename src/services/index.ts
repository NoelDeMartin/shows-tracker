import Catalog from './Catalog';
import TMDB from './TMDB';
import TViso from './TViso';

export const services = {
    $catalog: Catalog,
    $tmdb: TMDB,
    $tviso: TViso,
};

export type AppServices = typeof services;

declare module '@aerogel/core' {
    interface Services extends AppServices {}
}
