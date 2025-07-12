describe('Shows', () => {

    beforeEach(() => cy.visit('/shows'));

    it('Shows empty state when no shows exist', () => {
        // Assert shows index empty state
        cy.contains('You haven\'t added any shows yet.');
        cy.contains('Add Your First Show').should('be.visible');
    });

    it('Can create a new show with a specific status', () => {
        // Act - Navigate to create page
        cy.contains('Add Your First Show').click();

        // Fill out the form
        cy.comboboxSelect('Status', 'Completed');
        cy.get('input[name="name"]').type('Breaking Bad');
        cy.get('textarea[name="description"]').type(
            'A high school chemistry teacher turned methamphetamine manufacturer.',
        );

        // Add a season
        cy.contains('Add Season').click();

        // Add episodes to the season
        cy.contains('Season 1').click();
        cy.contains('Add Episode').click();
        cy.get('input[placeholder*="Episode name"]').first().type('Pilot');
        cy.get('textarea[placeholder*="Episode description"]').first().type('Walter White begins his journey.');
        cy.get('input[placeholder*="Episode duration"]').first().type('58m');

        // Add another episode
        cy.contains('Add Episode').click();
        cy.get('input[placeholder*="Episode name"]').eq(1).type('Cat\'s in the Bag...');

        // Submit the form
        cy.contains('Create').click();

        // Assert - Should be redirected to index page with the new show
        cy.contains('Breaking Bad').should('be.visible');
        // Check for completed status icon element by title
        cy.get('[title="Completed"]').should('be.visible');

        // Navigate to show details to verify seasons and episodes
        cy.contains('Breaking Bad').click();
        // On the details page, status text is still visible next to the icon
        cy.contains('Completed').should('be.visible');
        cy.contains('Season 1').should('be.visible');
        cy.contains('Pilot')
            .should('be.visible')
            .closest('li')
            .within(() => {
                cy.contains('58 min').should('be.visible');
                cy.contains('Walter White begins his journey.').should('be.visible');
            });
        cy.contains('Cat\'s in the Bag...').should('be.visible');
    });

    it('Can view show details with status', () => {
        // Arrange - Create a show first
        cy.contains('Add Your First Show').click();
        cy.comboboxSelect('Status', 'Watching');
        cy.get('input[name="name"]').type('Stranger Things');
        cy.get('textarea[name="description"]').type(
            'A group of kids encounter supernatural forces in their small town.',
        );

        // Add a season
        cy.contains('Add Season').click();

        // Add episodes to the season
        cy.contains('Season 1').click();
        cy.contains('Add Episode').click();
        cy.get('input[placeholder*="Episode name"]').first().type('Chapter One: The Vanishing of Will Byers');

        // Add another season
        cy.contains('Add Season').click();

        cy.contains('Create').click();

        // Act - Click on the show to view details
        cy.contains('Stranger Things').click();

        // Assert - Show details should be displayed
        cy.contains('Stranger Things').should('be.visible');
        cy.contains('Watching').should('be.visible');
        cy.contains('A group of kids encounter supernatural forces in their small town.').should('be.visible');
        cy.contains('Edit').should('be.visible');
        cy.contains('Delete').should('be.visible');

        // Should display season information
        cy.contains('Season 1').should('be.visible');
        cy.contains('Chapter One: The Vanishing of Will Byers').should('be.visible');
        cy.contains('Season 2').should('be.visible');
    });

    it('Can edit an existing show and change its status', () => {
        // Arrange - Create a show first
        cy.contains('Add Your First Show').click();
        cy.comboboxSelect('Status', 'Plan to Watch');
        cy.get('input[name="name"]').type('The Office');
        cy.get('textarea[name="description"]').type('A mockumentary about office life.');

        // Add a season with episodes
        cy.contains('Add Season').click();
        cy.contains('Season 1').click();
        cy.contains('Add Episode').click();
        cy.get('input[placeholder*="Episode name"]').first().type('Pilot');

        cy.contains('Create').click();

        // Navigate to show details
        cy.contains('The Office').click();
        cy.contains('Plan to Watch').should('be.visible');

        // Act - Edit the show
        cy.contains('Edit').click();
        cy.get('input[name="name"]').clear().type('The Office US');
        cy.comboboxSelect('Status', 'Dropped');
        cy.contains('Update').click();

        // Assert - Show should be updated with new status
        cy.contains('The Office US').should('be.visible');
        cy.contains('Dropped').should('be.visible');

        // Verify seasons and episodes are still there
        cy.contains('Season 1').should('be.visible');
        cy.contains('Pilot').should('be.visible');
    });

    it('Can delete a show', () => {
        // Arrange - Create a show first
        cy.contains('Add Your First Show').click();
        cy.get('input[name="name"]').type('Game of Thrones');

        // Add a season
        cy.contains('Add Season').click();

        cy.contains('Create').click();

        // Navigate to show details
        cy.contains('Game of Thrones').click();

        // Verify seasons are displayed
        cy.contains('Season 1').should('be.visible');

        // Act - Delete the show
        cy.contains('Delete').click();
        cy.contains('Delete Show').click(); // Confirm deletion

        // Assert - Show should be deleted and we should see empty state
        cy.contains('You haven\'t added any shows yet.').should('be.visible');
    });

    it('Can add multiple shows with different statuses and see them listed', () => {
        // Add first show
        cy.contains('Add Your First Show').click();
        cy.comboboxSelect('Status', 'Watching');
        cy.get('input[name="name"]').type('Breaking Bad');
        cy.contains('Add Season').click();
        cy.contains('Create').click();

        // Add second show
        cy.contains('Add Show').click();
        cy.comboboxSelect('Status', 'Completed');
        cy.get('input[name="name"]').type('Better Call Saul');
        cy.contains('Add Season').click();
        cy.contains('Create').click();

        // Add third show
        cy.contains('Add Show').click();
        cy.comboboxSelect('Status', 'Dropped');
        cy.get('input[name="name"]').type('Lost');
        cy.contains('Add Season').click();
        cy.contains('Create').click();

        // Assert - All shows should be visible with their statuses
        cy.contains('Breaking Bad').should('be.visible');
        // Check for icon badges by their title attribute
        cy.get('[title="Watching"]').should('be.visible');

        cy.contains('Better Call Saul').should('be.visible');
        cy.get('[title="Completed"]').should('be.visible');

        cy.contains('Lost').should('be.visible');
        cy.get('[title="Dropped"]').should('be.visible');

        // Check details of first show
        cy.contains('Breaking Bad').click();
        cy.contains('Watching').should('be.visible');
        cy.contains('Season 1').should('be.visible');
        cy.go('back');

        // Check details of second show
        cy.contains('Better Call Saul').click();
        cy.contains('Completed').should('be.visible');
        cy.contains('Season 1').should('be.visible');
    });

    it('Can search for shows and add them to my list with default pending status', () => {
        // Mock the TMDB API responses
        cy.intercept('GET', 'https://api.themoviedb.org/3/find/*', {
            fixture: 'tmdb/find-results.json',
        }).as('findShows');

        cy.intercept('GET', 'https://api.themoviedb.org/3/search/tv*', {
            fixture: 'tmdb/search-results.json',
        }).as('searchShows');

        // Mock the show details request
        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/*', {
            fixture: 'tmdb/stranger-things.json',
        }).as('showDetails');

        // Mock the external IDs request
        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/*/external_ids?*', {
            fixture: 'tmdb/stranger-things-external-ids.json',
        }).as('externalIds');

        // Mock the seasons request
        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/*/season/*', {
            fixture: 'tmdb/stranger-things-s1.json',
        }).as('seasonDetails');

        // Open search modal
        cy.contains('Search Shows').click();

        // Search for a show
        cy.get('input[type="search"]').type('stranger');

        // Wait for the API call
        cy.wait('@searchShows');

        // Should see search results
        cy.contains('Stranger Things').should('be.visible');

        // Add the show to my list
        cy.contains('Add to My Shows').click();

        // Wait for the details and seasons to be fetched
        cy.wait('@showDetails');
        cy.wait('@externalIds');
        cy.wait('@seasonDetails');

        // The modal should close and the added show should be in my list
        cy.contains('Stranger Things').should('be.visible');
        // Check for Plan to Watch icon
        cy.get('[title="Plan to Watch"]').should('be.visible');

        // Navigate to the show details page
        cy.contains('Stranger Things').click();

        // Verify show details are displayed correctly with default status
        cy.contains('Stranger Things').should('be.visible');
        cy.contains('Plan to Watch').should('be.visible');
        cy.contains('When a young boy vanishes, a small town uncovers a mystery').should('be.visible');

        // Verify seasons and episodes are displayed
        cy.contains('Season 1').should('be.visible');
        cy.contains('Chapter One: The Vanishing of Will Byers')
            .should('be.visible')
            .closest('li')
            .within(() => {
                cy.contains('48 min').should('be.visible');
            });

        // Edit the show to change its status
        cy.contains('Edit').click();
        cy.comboboxSelect('Status', 'Watching');
        cy.contains('Update').click();

        // Verify the status has been updated
        cy.contains('Watching').should('be.visible');
    });

    it('Can import shows from TViso', () => {
        // Mock the TMDB API responses
        cy.intercept('GET', 'https://api.themoviedb.org/3/find/*', {
            fixture: 'tmdb/find-results.json',
        }).as('findShows');

        // Mock the show details request
        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/*', {
            fixture: 'tmdb/stranger-things.json',
        }).as('showDetails');

        // Mock the seasons request
        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/*/season/1*', {
            fixture: 'tmdb/stranger-things-s1.json',
        }).as('s1Details');

        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/*/season/2*', {
            fixture: 'tmdb/stranger-things-s2.json',
        }).as('s2Details');

        // Navigate to import page
        cy.contains('a', 'Import Collection').click();

        // Upload TViso JSON file
        cy.get('input[type="file"]').attachFile('tviso-small.json');

        // Start import
        cy.contains('button', 'Import Collection').click();

        // Wait for API calls
        cy.wait('@findShows');
        cy.wait('@showDetails');
        cy.wait('@s1Details');
        cy.wait('@s2Details');

        // Verify import results
        cy.contains('Imported:').should('be.visible');
        cy.contains('Skipped:').should('be.visible');
        cy.contains('Failed:').should('be.visible');

        // Navigate back to shows list
        cy.contains('Back to Shows').click();

        // Verify imported shows are visible with correct statuses
        cy.contains('Stranger Things').should('be.visible');
        cy.get('[title="Plan to Watch"]').should('be.visible');

        // Verify show details for one show
        cy.contains('Stranger Things').click();
        cy.contains('Plan to Watch').should('be.visible');
        cy.contains('When a young boy vanishes, a small town uncovers a mystery').should('be.visible');
        cy.contains('Season 1').should('be.visible');

        // It should be a JSONLD graph with 15 resources
        cy.soukaiIndexedDBDocument('solid://shows/stranger-things-2016/info').should((document) => {
            expect(document).not.to.be.null;
            expect(document?.['@graph']).to.have.length(13);
        });

        cy.soukaiIndexedDBDocument('solid://shows/stranger-things-2016/season-1/episode-1').should('not.be.null');
        cy.soukaiIndexedDBDocument('solid://shows/stranger-things-2016/season-1/episode-2').should('not.be.null');
        cy.soukaiIndexedDBDocument('solid://shows/stranger-things-2016/season-1/episode-3').should('not.be.null');
        cy.soukaiIndexedDBDocument('solid://shows/stranger-things-2016/season-1/episode-4').should('not.be.null');
        cy.soukaiIndexedDBDocument('solid://shows/stranger-things-2016/season-1/episode-5').should('not.be.null');
        cy.soukaiIndexedDBDocument('solid://shows/stranger-things-2016/season-1/episode-6').should('not.be.null');
        cy.soukaiIndexedDBDocument('solid://shows/stranger-things-2016/season-1/episode-7').should('not.be.null');
        cy.soukaiIndexedDBDocument('solid://shows/stranger-things-2016/season-1/episode-8').should('not.be.null');

        cy.reload();

        // See seasons and episodes
        cy.contains('Season 1 (8 episodes)').should('be.visible');
        cy.contains('Chapter One: The Vanishing of Will Byers').should('be.visible');
        cy.contains('Chapter Two: The Weirdo on Maple Street').should('be.visible');
        cy.contains('Chapter Three: Holly, Jolly').should('be.visible');
        cy.contains('Chapter Four: The Body').should('be.visible');
        cy.contains('Chapter Five: The Flea and the Acrobat').should('be.visible');
        cy.contains('Chapter Six: The Monster').should('be.visible');
        cy.contains('Chapter Seven: The Bathtub').should('be.visible');
        cy.contains('Chapter Eight: The Upside Down').should('be.visible');
        cy.contains('Season 2 (9 episodes)').should('be.visible');
    });

});
