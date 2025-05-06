describe('Home', () => {

    beforeEach(() => cy.visit('/'));

    it('Shows an empty state when there are no watching shows with new episodes', () => {
        // Verify the home page shows an empty state
        cy.contains('What\'s new?').should('be.visible');
        cy.contains('No shows with new episodes').should('be.visible');
        cy.contains('Browse My Shows').should('be.visible');
    });

    it('Shows only watching shows with new episodes', () => {
        // Create test shows programmatically
        cy.model('Show').then(async (Show) => {
            // Create a watching show with unwatched episodes (should appear on home page)
            const watchingShow = await Show.create({
                name: 'Breaking Bad',
                description: 'A high school chemistry teacher turned methamphetamine manufacturer.',
            });
            await watchingShow.relatedWatchAction.create({ status: 'watching' });
            const watchingSeason = await watchingShow.relatedSeasons.create({ number: 1 });
            await watchingSeason.relatedEpisodes.create({
                number: 1,
                name: 'Pilot',
            });

            // Create a completed show (shouldn't appear on home page)
            const completedShow = await Show.create({
                name: 'Game of Thrones',
            });
            await completedShow.relatedWatchAction.create({ status: 'completed' });
            const completedSeason = await completedShow.relatedSeasons.create({ number: 1 });
            await completedSeason.relatedEpisodes.create({
                number: 1,
                name: 'Winter is Coming',
            });

            // Create a watching show but mark all episodes as watched (shouldn't appear on home page)
            const allWatchedShow = await Show.create({
                name: 'Better Call Saul',
            });
            await allWatchedShow.relatedWatchAction.create({ status: 'watching' });
            const allWatchedSeason = await allWatchedShow.relatedSeasons.create({ number: 1 });
            const episode = await allWatchedSeason.relatedEpisodes.create({
                number: 1,
                name: 'Uno',
            });
            await episode.watch(); // Mark as watched
        });

        // Should only show Breaking Bad (watching + unwatched episodes)
        cy.contains('Breaking Bad').should('be.visible');
        cy.contains('1 new episodes').should('be.visible');
        cy.contains('Game of Thrones').should('not.exist');
        cy.contains('Better Call Saul').should('not.exist');

        // Mark Breaking Bad episode as watched
        cy.contains('Mark as watched').click();

        // Should now show empty state
        cy.contains('No shows with new episodes').should('be.visible');
    });

});
