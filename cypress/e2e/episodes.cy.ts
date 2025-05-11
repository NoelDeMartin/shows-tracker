describe('Episodes', () => {

    beforeEach(() => {
        cy.visit('/shows');

        // Set up a show with multiple seasons and episodes
        createStubs();
    });

    it('Shows the next unwatched episode on the index page and updates when marked as watched', () => {
        // Next unwatched episode should be the first one
        cy.contains('Next episode to watch').should('be.visible');
        cy.contains('S01E01: Pilot').should('be.visible');
        cy.contains('Mark as watched').should('be.visible');

        // Mark the first episode as watched
        cy.contains('Mark as watched').click();

        // Next unwatched episode should update to episode 2
        cy.contains('S01E02: The Train Job').should('be.visible');
    });

    it('Updates the next episode when marking all episodes in a season as watched', () => {
        // Go to the show detail page
        cy.contains('Firefly').click();

        // Season 1 should be expanded by default as it contains unwatched episodes
        cy.contains('Season 1').should('be.visible');
        cy.contains('Pilot').should('be.visible');

        // Mark all episodes in season 1 as watched
        cy.contains('Mark all as watched').click();

        // Now all episodes in season 1 should be marked as watched
        cy.get('li').contains('Pilot').get('button[title*="Watched on"]').should('exist');
        cy.get('li').contains('The Train Job').get('button[title*="Watched on"]').should('exist');

        // Go back to index page
        cy.go('back');

        // Next unwatched episode should now be from season 2
        cy.contains('S02E01: Out of Gas').should('be.visible');
    });

    it('Shows "All episodes watched" when all episodes are marked as watched', () => {
        // Go to the show detail page
        cy.contains('Firefly').click();

        // Mark all episodes in all seasons as watched
        cy.contains('Season 1').parent().contains('Mark all as watched').click();
        cy.contains('Season 2').click(); // Open season 2
        cy.contains('Season 2').parent().contains('Mark all as watched').click();

        // Go back to index page
        cy.go('back');

        // Should show "All episodes watched" instead of next episode
        cy.contains('All episodes watched').should('be.visible');
        cy.contains('Mark as watched').should('not.exist');
    });

    it('Automatically expands the current season on the show page', () => {
        // Go to the show detail page
        cy.contains('Firefly').click();

        // Season 1 should be expanded by default (because it has the next unwatched episode)
        cy.contains('Pilot').should('be.visible');

        // Season 2 should be collapsed
        cy.contains('Out of Gas').should('not.be.visible');

        // Mark all episodes in season 1 as watched
        cy.contains('Mark all as watched').click();

        // Refresh the page to ensure the current season is updated
        cy.reload();

        // Now season 2 should be expanded automatically
        cy.contains('Out of Gas').should('be.visible');
    });

    it('Can toggle episode watch status by clicking on the check icon', () => {
        // Go to the show detail page
        cy.contains('Firefly').click();

        // Mark episode 1 as watched by clicking the check icon
        cy.contains('Pilot').parent().find('button').first().click();

        // Verify the icon changes
        cy.contains('Pilot').parent().get('button[title*="Watched on"]').should('exist');

        // Toggle it back to unwatched
        cy.contains('Pilot').parent().find('button').first().click();

        // Verify the icon changes back
        cy.contains('Pilot').parent().get('button[title*="Watched on"]').should('not.exist');
    });

    it('Changes show status from "Plan to Watch" to "Watching" when marking an episode as watched', () => {
        // Verify show is created with "Plan to Watch" status
        cy.contains('Firefly').should('be.visible');
        // Check for Plan to Watch icon
        cy.get('[title="Plan to Watch"]').should('be.visible');

        // Go to the show detail page
        cy.contains('Firefly').click();

        // On the detail page, we can still check for the text since it's displayed next to the icon
        cy.contains('Plan to Watch').should('be.visible');

        // Mark the episode as watched
        cy.contains('Pilot').parent().find('button').first().click();

        // Verify the status has changed to "Watching" (text is still visible on detail page)
        cy.contains('Watching').should('be.visible');
        cy.contains('Plan to Watch').should('not.exist');
    });

});

// Helper function to create a show with multiple seasons and episodes
function createStubs() {
    cy.model('Show').then(async (Show) => {
        const show = await Show.create({ name: 'Firefly', description: 'A space western set in the future.' });
        const firstSeason = await show.relatedSeasons.create({ number: 1 });
        const secondSeason = await show.relatedSeasons.create({ number: 2 });

        await firstSeason.relatedEpisodes.create({
            number: 1,
            name: 'Pilot',
            description: 'The crew of Serenity takes on passengers.',
        });

        await firstSeason.relatedEpisodes.create({
            number: 2,
            name: 'The Train Job',
            description: 'The crew takes on a job to steal cargo from a train.',
        });

        await secondSeason.relatedEpisodes.create({
            number: 1,
            name: 'Out of Gas',
            description: 'The ship suffers a catastrophe.',
        });
    });
}
