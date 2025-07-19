describe('Catalog', () => {

    beforeEach(() => cy.visit('/shows'));

    it('Updates shows with new episodes', () => {
        // Create a test show with a season and episode programmatically
        cy.model('Show').then(async (Show) => {
            const show = await Show.create({
                name: 'The Mandalorian',
                description: 'A lone bounty hunter travels the outer reaches of the galaxy.',
                externalUrls: ['https://www.themoviedb.org/tv/82856'],
            });

            // Create a watch action with "watching" status
            await show.relatedWatchAction.create({ status: 'watching' });

            // Add a season with an episode
            const season = await show.relatedSeasons.create({ number: 1 });
            await season.relatedEpisodes.create({
                number: 1,
                name: 'Chapter 1: The Mandalorian',
            });
        });

        // Verify show was created
        cy.contains('The Mandalorian').should('be.visible');

        // Mock TMDB response for updates
        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/82856**', {
            statusCode: 200,
            fixture: 'tmdb/the-mandalorian.json',
        }).as('showDetails');

        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/82856/season/1**', {
            statusCode: 200,
            fixture: 'tmdb/the-mandalorian-s1.json',
        }).as('seasonDetails');

        // Click the Update button
        cy.contains('Update Shows').click();

        // Verify the TMDB API was called
        cy.wait('@showDetails');
        cy.wait('@seasonDetails');

        // Verify the success notification
        cy.contains('Shows updated successfully!').should('be.visible');

        // Navigate to the show's details to verify the new episode was added
        cy.contains('The Mandalorian').click();

        // Assert that both episodes are now visible
        cy.contains('Chapter 1: The Mandalorian').should('be.visible');
        cy.contains('Chapter 2: The Child').should('be.visible');
        cy.contains('Target in-hand, the Mandalorian must now contend with scavengers.').should('be.visible');
        cy.contains('32 min').should('be.visible');
    });

    it('Only updates shows with "watching" status and fewer than 3 unwatched episodes', () => {
        // Create test shows programmatically
        cy.model('Show').then(async (Show) => {
            // Create completed show (shouldn't be updated)
            const completedShow = await Show.create({
                name: 'Completed Show',
                externalUrls: ['https://www.themoviedb.org/tv/11111'],
            });
            await completedShow.relatedWatchAction.create({ status: 'completed' });

            // Create watching show with 3 unwatched episodes (shouldn't be updated)
            const manyEpisodesShow = await Show.create({
                name: 'Many Episodes Show',
                externalUrls: ['https://www.themoviedb.org/tv/22222'],
            });
            await manyEpisodesShow.relatedWatchAction.create({ status: 'watching' });

            const manyEpisodesShowSeason = await manyEpisodesShow.relatedSeasons.create({ number: 1 });
            for (let i = 1; i <= 3; i++) {
                await manyEpisodesShowSeason.relatedEpisodes.create({
                    number: i,
                    name: `Episode ${i}`,
                });
            }

            // Create eligible show with one unwatched episode (should be updated)
            const eligibleShow = await Show.create({
                name: 'Eligible Show',
                externalUrls: ['https://www.themoviedb.org/tv/33333'],
            });
            await eligibleShow.relatedWatchAction.create({ status: 'watching' });

            const eligibleShowSeason = await eligibleShow.relatedSeasons.create({ number: 1 });
            await eligibleShowSeason.relatedEpisodes.create({
                number: 1,
                name: 'Episode 1',
            });
        });

        // Set up mocks - Not expecting these to be called due to filtering
        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/11111**', {
            statusCode: 200,
            body: {
                id: 11111,
                name: 'Completed Show',
                overview: null,
                first_air_date: '2020-01-01',
                last_air_date: '2020-12-31',
                poster_path: null,
                number_of_seasons: 1,
                number_of_episodes: 10,
                vote_average: 7.5,
                status: 'Ended',
                seasons: [], // Empty but required for schema validation
            },
        }).as('completedShow');

        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/22222**', {
            statusCode: 200,
            body: {
                id: 22222,
                name: 'Many Episodes Show',
                overview: 'A show with many episodes',
                first_air_date: '2021-01-01',
                last_air_date: '2021-12-31',
                poster_path: null,
                number_of_seasons: 1,
                number_of_episodes: 10,
                vote_average: 8.0,
                status: 'Returning Series',
                seasons: [], // Empty but required for schema validation
            },
        }).as('manyEpisodesShow');

        // This one should be called
        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/33333**', {
            statusCode: 200,
            body: {
                id: 33333,
                name: 'Eligible Show',
                overview: 'A show eligible for updates',
                first_air_date: '2022-01-01',
                last_air_date: '2022-12-31',
                poster_path: null,
                number_of_seasons: 1,
                number_of_episodes: 2,
                vote_average: 8.5,
                status: 'Returning Series',
                seasons: [
                    {
                        id: 1,
                        season_number: 1,
                        name: 'Season 1',
                        episode_count: 2,
                        air_date: '2022-01-01',
                        overview: null,
                    },
                ],
            },
        }).as('eligibleShow');

        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/33333/season/1**', {
            statusCode: 200,
            body: {
                id: 1,
                name: 'Season 1',
                season_number: 1,
                episode_count: 2,
                air_date: '2022-01-01',
                overview: null,
                episodes: [
                    {
                        id: 1,
                        name: 'Episode 1',
                        episode_number: 1,
                        season_number: 1,
                        air_date: '2022-01-01',
                        runtime: 30,
                        overview: null,
                    },
                    {
                        id: 2,
                        name: 'Episode 2',
                        episode_number: 2,
                        season_number: 1,
                        air_date: '2022-01-08',
                        runtime: 30,
                        overview: null,
                    },
                ],
            },
        }).as('eligibleShowSeason');

        // Click the Update button
        cy.contains('Update Shows').click();

        // Verify only the eligible show was updated
        cy.wait('@eligibleShow');
        cy.wait('@eligibleShowSeason');

        // The other show's APIs shouldn't be called
        cy.get('@completedShow.all').should('have.length', 0);
        cy.get('@manyEpisodesShow.all').should('have.length', 0);

        // Verify the success notification
        cy.contains('Shows updated successfully!').should('be.visible');

        // Verify the eligible show was updated with a new episode
        cy.contains('Eligible Show').click();
        cy.contains('Episode 1').should('be.visible');
        cy.contains('Episode 2').should('be.visible');
    });

});
