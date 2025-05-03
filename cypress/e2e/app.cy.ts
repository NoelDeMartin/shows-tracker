describe('App', () => {

    beforeEach(() => cy.visit('/'));

    it('Shows empty state when no shows exist', () => {
        // Assert
        cy.contains('You haven\'t added any shows yet.');
        cy.contains('Add Your First Show').should('be.visible');
    });

    it('Can create a new show', () => {
        // Act - Navigate to create page
        cy.contains('Add Your First Show').click();

        // Fill out the form
        cy.get('input[name="name"]').type('Breaking Bad');
        cy.get('textarea[name="description"]').type(
            'A high school chemistry teacher turned methamphetamine manufacturer.',
        );

        // Add a season
        cy.contains('Add Season').click();

        // Add episodes to the season
        cy.contains('Add Episode').click();
        cy.get('input[placeholder*="Episode name"]').first().type('Pilot');
        cy.get('textarea[placeholder*="Episode description"]').first().type('Walter White begins his journey.');
        cy.get('input[placeholder*="Episode duration"]').first().type('58m');

        // Add another episode
        cy.contains('Add Episode').click();
        cy.get('input[placeholder*="Episode name"]').eq(1).type('Cat\'s in the Bag...');

        // Set rating and mark as completed
        cy.get('input[name="rating"]').clear().type('5');
        cy.get('input[name="completed"]').check();

        // Submit the form
        cy.contains('Create').click();

        // Assert - Should be redirected to index page with the new show
        cy.contains('Breaking Bad').should('be.visible');
        cy.contains('Completed').should('be.visible');
        cy.contains('5/5').should('be.visible');

        // Navigate to show details to verify seasons and episodes
        cy.contains('Breaking Bad').click();
        cy.contains('Season 1').should('be.visible');
        cy.contains('1. Pilot')
            .should('be.visible')
            .closest('li')
            .within(() => {
                cy.contains('58 min').should('be.visible');
                cy.contains('Walter White begins his journey.').should('be.visible');
            });
        cy.contains('2. Cat\'s in the Bag...').should('be.visible');
    });

    it('Can view show details', () => {
        // Arrange - Create a show first
        cy.contains('Add Your First Show').click();
        cy.get('input[name="name"]').type('Stranger Things');
        cy.get('textarea[name="description"]').type(
            'A group of kids encounter supernatural forces in their small town.',
        );

        // Add a season
        cy.contains('Add Season').click();

        // Add episodes to the season
        cy.contains('Add Episode').click();
        cy.get('input[placeholder*="Episode name"]').first().type('Chapter One: The Vanishing of Will Byers');

        // Add another season
        cy.contains('Add Season').click();

        cy.get('input[name="rating"]').clear().type('4.5');
        cy.contains('Create').click();

        // Act - Click on the show to view details
        cy.contains('Stranger Things').click();

        // Assert - Show details should be displayed
        cy.contains('Stranger Things').should('be.visible');
        cy.contains('A group of kids encounter supernatural forces in their small town.').should('be.visible');
        cy.contains('Rating')
            .parent()
            .within(() => {
                cy.contains('4.5/5').should('be.visible');
            });
        cy.contains('Edit').should('be.visible');
        cy.contains('Delete').should('be.visible');

        // Should display season information
        cy.contains('Season 1').should('be.visible');
        cy.contains('Chapter One: The Vanishing of Will Byers').should('be.visible');
        cy.contains('Season 2').should('be.visible');
    });

    it('Can edit an existing show', () => {
        // Arrange - Create a show first
        cy.contains('Add Your First Show').click();
        cy.get('input[name="name"]').type('The Office');
        cy.get('textarea[name="description"]').type('A mockumentary about office life.');

        // Add a season with episodes
        cy.contains('Add Season').click();
        cy.contains('Add Episode').click();
        cy.get('input[placeholder*="Episode name"]').first().type('Pilot');

        cy.get('input[name="rating"]').clear().type('4.5');
        cy.contains('Create').click();

        // Navigate to show details
        cy.contains('The Office').click();

        // Verify seasons and episodes are displayed
        cy.contains('Season 1').should('be.visible');
        cy.contains('1. Pilot').should('be.visible');

        // Act - Edit the show
        cy.contains('Edit').click();
        cy.get('input[name="name"]').clear().type('The Office US');
        cy.get('input[name="completed"]').check();
        cy.contains('Update').click();

        // Assert - Show should be updated
        cy.contains('The Office US').should('be.visible');
        cy.contains('Completed').should('be.visible');

        // Verify seasons and episodes are still there
        cy.contains('Season 1').should('be.visible');
        cy.contains('1. Pilot').should('be.visible');
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

    it('Can add multiple shows and see them listed', () => {
        // Add first show
        cy.contains('Add Your First Show').click();
        cy.get('input[name="name"]').type('Breaking Bad');
        cy.contains('Add Season').click();
        cy.contains('Create').click();

        // Add second show
        cy.contains('Add Show').click();
        cy.get('input[name="name"]').type('Better Call Saul');
        cy.contains('Add Season').click();
        cy.contains('Create').click();

        // Assert - Both shows should be visible
        cy.contains('Breaking Bad').should('be.visible');
        cy.contains('Better Call Saul').should('be.visible');

        // Check details of first show
        cy.contains('Breaking Bad').click();
        cy.contains('Season 1').should('be.visible');
        cy.go('back');

        // Check details of second show
        cy.contains('Better Call Saul').click();
        cy.contains('Season 1').should('be.visible');
    });

    it('Can search for shows and add them to my list', () => {
        // Mock the TMDB API responses
        cy.intercept('GET', 'https://api.themoviedb.org/3/search/tv*', {
            fixture: 'tmdb-search-results.json',
        }).as('searchShows');

        // Mock the show details request
        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/*', {
            fixture: 'tmdb-show-details.json',
        }).as('showDetails');

        // Mock the seasons request
        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/*/season/*', {
            fixture: 'tmdb-season-details.json',
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
        cy.wait('@seasonDetails');

        // The modal should close and the added show should be in my list
        cy.contains('Stranger Things').should('be.visible');

        // Navigate to the show details page
        cy.contains('Stranger Things').click();

        // Verify show details are displayed correctly
        cy.contains('Stranger Things').should('be.visible');
        cy.contains('When a young boy vanishes, a small town uncovers a mystery').should('be.visible');

        // Verify seasons and episodes are displayed
        cy.contains('Season 1').should('be.visible');
        cy.contains('Chapter One: The Vanishing of Will Byers')
            .should('be.visible')
            .closest('li')
            .within(() => {
                cy.contains('48 min').should('be.visible');
            });
        cy.contains('Chapter Two: The Weirdo on Maple Street')
            .should('be.visible')
            .closest('li')
            .within(() => {
                cy.contains('55 min').should('be.visible');
            });
        cy.contains('Chapter Three: Holly, Jolly')
            .should('be.visible')
            .closest('li')
            .within(() => {
                cy.contains('51 min').should('be.visible');
            });

        // Go back to the list page
        cy.go('back');

        // Verify that if we search again, the show is marked as already added
        cy.contains('Search Shows').click();
        cy.get('input[type="search"]').type('stranger');
        cy.wait('@searchShows');
        cy.contains('Already in My Shows').should('be.visible');
    });

});
