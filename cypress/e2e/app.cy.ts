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
        cy.get('input[name="seasons"]').clear().type('5');
        cy.get('input[name="episodes"]').clear().type('62');
        cy.get('input[name="rating"]').clear().type('5');
        cy.get('input[name="completed"]').check();

        // Submit the form
        cy.contains('Create').click();

        // Assert - Should be redirected to index page with the new show
        cy.contains('Breaking Bad').should('be.visible');
        cy.contains('5 Seasons').should('be.visible');
        cy.contains('Completed').should('be.visible');
        cy.contains('5/5').should('be.visible');
    });

    it('Can view show details', () => {
        // Arrange - Create a show first
        cy.contains('Add Your First Show').click();
        cy.get('input[name="name"]').type('Stranger Things');
        cy.get('textarea[name="description"]').type(
            'A group of kids encounter supernatural forces in their small town.',
        );
        cy.get('input[name="seasons"]').clear().type('4');
        cy.get('input[name="episodes"]').clear().type('34');
        cy.get('input[name="rating"]').clear().type('4.5');
        cy.contains('Create').click();

        // Act - Click on the show to view details
        cy.contains('Stranger Things').click();

        // Assert - Show details should be displayed
        cy.contains('Stranger Things').should('be.visible');
        cy.contains('A group of kids encounter supernatural forces in their small town.').should('be.visible');
        cy.contains('Seasons')
            .parent()
            .within(() => {
                cy.contains('4').should('be.visible');
            });
        cy.contains('Episodes')
            .parent()
            .within(() => {
                cy.contains('34').should('be.visible');
            });
        cy.contains('Rating')
            .parent()
            .within(() => {
                cy.contains('4.5/5').should('be.visible');
            });
        cy.contains('Edit').should('be.visible');
        cy.contains('Delete').should('be.visible');
    });

    it('Can edit an existing show', () => {
        // Arrange - Create a show first
        cy.contains('Add Your First Show').click();
        cy.get('input[name="name"]').type('The Office');
        cy.get('textarea[name="description"]').type('A mockumentary about office life.');
        cy.get('input[name="seasons"]').clear().type('9');
        cy.get('input[name="episodes"]').clear().type('201');
        cy.get('input[name="rating"]').clear().type('4.5');
        cy.contains('Create').click();

        // Navigate to show details
        cy.contains('The Office').click();

        // Act - Edit the show
        cy.contains('Edit').click();
        cy.get('input[name="name"]').clear().type('The Office US');
        cy.get('input[name="completed"]').check();
        cy.contains('Update').click();

        // Assert - Show should be updated
        cy.contains('The Office US').should('be.visible');
        cy.contains('Completed').should('be.visible');
    });

    it('Can delete a show', () => {
        // Arrange - Create a show first
        cy.contains('Add Your First Show').click();
        cy.get('input[name="name"]').type('Game of Thrones');
        cy.get('input[name="seasons"]').clear().type('8');
        cy.get('input[name="episodes"]').clear().type('73');
        cy.contains('Create').click();

        // Navigate to show details
        cy.contains('Game of Thrones').click();

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
        cy.get('input[name="seasons"]').clear().type('5');
        cy.get('input[name="episodes"]').clear().type('62');
        cy.contains('Create').click();

        // Add second show
        cy.contains('Add Show').click();
        cy.get('input[name="name"]').type('Better Call Saul');
        cy.get('input[name="seasons"]').clear().type('6');
        cy.get('input[name="episodes"]').clear().type('63');
        cy.contains('Create').click();

        // Assert - Both shows should be visible
        cy.contains('Breaking Bad').should('be.visible');
        cy.contains('Better Call Saul').should('be.visible');
    });

});
