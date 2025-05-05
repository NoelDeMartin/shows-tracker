describe('Show Updates', () => {

    beforeEach(() => cy.visit('/'));

    it('Updates shows with new episodes', () => {
        // Create a test show with a season and episode
        cy.contains('Add Your First Show').click();
        cy.get('input[name="name"]').type('The Mandalorian');
        cy.get('textarea[name="description"]').type('A lone bounty hunter travels the outer reaches of the galaxy.');
        cy.comboboxSelect('Status', 'Watching');

        // Add external URL for TMDB
        cy.contains('External URLs').should('be.visible');
        cy.contains('Add URL').click();
        cy.get('input[placeholder*="Enter URL"]').type('https://www.themoviedb.org/tv/82856');

        // Add a season
        cy.contains('Add Season').click();

        // Add episode to the season
        cy.contains('Season 1').click();
        cy.contains('Add Episode').click();
        cy.get('input[placeholder*="Episode name"]').first().type('Chapter 1: The Mandalorian');

        // Submit the form
        cy.contains('Create').click();

        // Verify show was created
        cy.contains('The Mandalorian').should('be.visible');

        // Mock TMDB response for updates
        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/82856**', {
            statusCode: 200,
            fixture: 'tmdb-mandalorian-details.json',
        }).as('showDetails');

        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/82856/season/1**', {
            statusCode: 200,
            fixture: 'tmdb-mandalorian-season.json',
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
        // Create show with "completed" status (shouldn't be updated)
        cy.contains('Add Your First Show').click();
        cy.get('input[name="name"]').type('Completed Show');
        cy.comboboxSelect('Status', 'Completed');

        // Add external URL
        cy.contains('Add URL').click();
        cy.get('input[placeholder*="Enter URL"]').type('https://www.themoviedb.org/tv/11111');

        cy.contains('Create').click();

        // Create show with "watching" status but already has 3 unwatched episodes
        cy.contains('Add Show').click();
        cy.get('input[name="name"]').type('Many Episodes Show');
        cy.comboboxSelect('Status', 'Watching');

        // Add external URL
        cy.contains('Add URL').click();
        cy.get('input[placeholder*="Enter URL"]').type('https://www.themoviedb.org/tv/22222');

        // Add season with 3 episodes
        cy.contains('Add Season').click();
        cy.contains('Season 1').click();

        // Add 3 episodes
        for (let i = 1; i <= 3; i++) {
            cy.contains('Add Episode').click();
            cy.get('input[placeholder*="Episode name"]')
                .eq(i - 1)
                .type(`Episode ${i}`);
        }

        cy.contains('Create').click();

        // Create eligible show for update
        cy.contains('Add Show').click();
        cy.get('input[name="name"]').type('Eligible Show');
        cy.comboboxSelect('Status', 'Watching');

        // Add external URL
        cy.contains('Add URL').click();
        cy.get('input[placeholder*="Enter URL"]').type('https://www.themoviedb.org/tv/33333');

        cy.contains('Add Season').click();
        cy.contains('Season 1').click();
        cy.contains('Add Episode').click();
        cy.get('input[placeholder*="Episode name"]').first().type('Episode 1');
        cy.contains('Create').click();

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
