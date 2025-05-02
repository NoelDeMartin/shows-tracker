import TheMovieDatabase from './TheMovieDatabase';

export const services = {
    $tmdb: TheMovieDatabase,
};

export type AppServices = typeof services;

declare module '@aerogel/core' {
    interface Services extends AppServices {}
}
