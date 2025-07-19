import { podUrl, webId } from '@aerogel/cypress';

describe('Solid', () => {

    beforeEach(() => {
        cy.solidReset();
        cy.visit('/');
    });

    it('Syncs new show creation', () => {
        // Intercept requests to detect synchronization
        cy.intercept('PATCH', podUrl('/shows/breaking-bad/info')).as('createShow');
        cy.intercept('PATCH', podUrl('/shows/breaking-bad/season-1/*')).as('createEpisode');
        cy.intercept('PATCH', podUrl('/shows/**/*')).as('createSomething');

        // Login to Solid
        cy.ariaLabel('Configuration').click();
        cy.contains('Connect account').click();
        cy.ariaInput('Login url').type(`${webId()}{enter}`);
        cy.solidLogin();

        // Act - Create a new show
        cy.contains('My Shows').click();
        cy.contains('Add Your First Show').click();
        cy.comboboxSelect('Status', 'Watching');
        cy.get('input[name="name"]').type('Breaking Bad');
        cy.get('textarea[name="description"]').type(
            'A high school chemistry teacher turned methamphetamine manufacturer.',
        );

        // Add a season with episodes
        cy.contains('Add Season').click();
        cy.contains('Season 1').click();
        cy.contains('Add Episode').click();
        cy.get('input[placeholder*="Episode name"]').first().type('Pilot');
        cy.get('textarea[placeholder*="Episode description"]').first().type('Walter White begins his journey.');
        cy.get('input[placeholder*="Episode duration"]').first().type('58m');

        // Add external URL
        cy.contains('External URLs').should('be.visible');
        cy.contains('Add URL').click();
        cy.get('input[placeholder*="Enter URL"]').type('https://www.themoviedb.org/tv/1396');

        cy.contains('Create').click();
        cy.waitSync();

        // Assert requests
        cy.get('@createShow.all').should('have.length', 1);
        cy.get('@createEpisode.all').should('have.length', 1);
        cy.get('@createSomething.all').should('have.length', 2);

        cy.fixture('sparql/create-show.sparql').then((sparql) => {
            cy.get('@createShow').its('response.statusCode').should('eq', 201);
            cy.get('@createShow').its('request.body').should('be.sparql', sparql);
        });

        cy.fixture('sparql/create-episode.sparql').then((sparql) => {
            cy.get('@createEpisode').its('response.statusCode').should('eq', 201);
            cy.get('@createEpisode').its('request.body').should('be.sparql', sparql);
        });

        cy.fixture('turtle/type-index.ttl').then((expected) => {
            cy.solidReadDocument('/settings/privateTypeIndex').then((actual) => {
                cy.wrap(actual).should('be.turtle', expected);
            });
        });

        // Subsequent syncs should work
        cy.ariaLabel('Open account').click();
        cy.contains('button', 'Synchronize').click();
        cy.waitSync();

        cy.get('@createShow.all').should('have.length', 1);
        cy.get('@createEpisode.all').should('have.length', 1);
        cy.get('@createSomething.all').should('have.length', 2);
    });

    it('Syncs show status changes', () => {
        // Arrange
        cy.ariaLabel('Configuration').click();
        cy.contains('Connect account').click();
        cy.ariaInput('Login url').type(`${webId()}{enter}`);
        cy.solidLogin();
        cy.waitSync();

        cy.model('Show').then(async (Show) => {
            const show = new Show({
                name: 'Stranger Things',
                description: 'A group of kids encounter supernatural forces in their small town.',
            });

            show.mintUrl();

            const season = show.relatedSeasons.attach({ number: 1 });
            show.relatedWatchAction.attach({ status: 'pending' });
            season.relatedEpisodes.attach({
                number: 1,
                name: 'Chapter One: The Vanishing of Will Byers',
            });

            await Promise.all(show.episodes.map((episode) => episode.save()));
            await show.save();
        });
        cy.waitSync();

        // Navigate to the show details page
        cy.contains('My Shows').click();
        cy.contains('Stranger Things').click();

        // Intercept PATCH requests for status updates
        cy.intercept('PATCH', podUrl('/shows/**/*')).as('updateShowStatus');

        // Act - Edit the show to change status
        cy.contains('Edit').click();
        cy.comboboxSelect('Status', 'Watching');
        cy.contains('Update').click();
        cy.waitSync();

        // Assert - Verify status was updated
        cy.get('@updateShowStatus.all').should('have.length', 1);

        cy.fixture('sparql/update-show-status.sparql').then((sparql) => {
            cy.get('@updateShowStatus').its('response.statusCode').should('eq', 205);
            cy.get('@updateShowStatus').its('request.body').should('be.sparql', sparql);
        });
    });

    it('Syncs episode watch state changes', () => {
        // Arrange
        cy.ariaLabel('Configuration').click();
        cy.contains('Connect account').click();
        cy.ariaInput('Login url').type(`${webId()}{enter}`);
        cy.solidLogin();
        cy.waitSync();

        cy.model('Show').then(async (Show) => {
            const show = new Show({
                name: 'Firefly',
                description: 'A space western drama about the adventures of the renegade crew of a small spacecraft.',
            });

            // Set status to pending
            show.relatedWatchAction.attach({ status: 'pending' });

            show.mintUrl();

            // Add a season with episodes
            const season = show.relatedSeasons.attach({ number: 1 });

            season.relatedEpisodes.attach({
                number: 1,
                name: 'Serenity',
                description: 'The crew of Serenity takes on a pair of passengers.',
            });

            season.relatedEpisodes.attach({
                number: 2,
                name: 'The Train Job',
                description: 'Mal and his crew are forced to pull a train heist.',
            });

            await Promise.all(show.episodes.map((episode) => episode.save()));
            await show.save();
        });
        cy.waitSync();

        cy.intercept('PATCH', podUrl('/shows/**/info')).as('updateShowStatus');
        cy.intercept('PATCH', podUrl('/shows/**/episode-1')).as('updateEpisodeStatus');

        // Navigate to show details
        cy.contains('My Shows').click();
        cy.contains('Firefly').click();

        // Act - Mark episode as watched
        cy.contains('Serenity').parent().find('button').first().click();
        cy.waitSync();

        // Assert - Verify the episode was synced
        cy.get('@updateShowStatus.all').should('have.length', 1);
        cy.get('@updateEpisodeStatus.all').should('have.length', 1);

        cy.fixture('sparql/update-show-status.sparql').then((sparql) => {
            cy.get('@updateShowStatus').its('response.statusCode').should('eq', 205);
            cy.get('@updateShowStatus').its('request.body').should('be.sparql', sparql);
        });

        cy.fixture('sparql/update-episode-status.sparql').then((sparql) => {
            cy.get('@updateEpisodeStatus').its('response.statusCode').should('eq', 205);
            cy.get('@updateEpisodeStatus').its('request.body').should('be.sparql', sparql);
        });
    });

    it('Syncs show updates from TMDB', () => {
        // Mock TMDB API responses
        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/82856**', {
            statusCode: 200,
            fixture: 'tmdb/the-mandalorian.json',
        }).as('showDetails');

        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/82856/season/1**', {
            statusCode: 200,
            fixture: 'tmdb/the-mandalorian-s1.json',
        }).as('seasonDetails');

        cy.ariaLabel('Configuration').click();
        cy.contains('Connect account').click();
        cy.ariaInput('Login url').type(`${webId()}{enter}`);
        cy.solidLogin();
        cy.waitSync();

        // Create a show with external TMDB URL programmatically
        cy.model('Show').then(async (Show) => {
            const show = new Show({
                name: 'The Mandalorian',
                description: 'A lone bounty hunter travels the outer reaches of the galaxy.',
                externalUrls: ['https://www.themoviedb.org/tv/82856'],
            });

            // Set status to watching
            show.relatedWatchAction.attach({ status: 'watching' });

            show.mintUrl();

            // Add a season with one episode
            const season = show.relatedSeasons.attach({ number: 1 });

            season.relatedEpisodes.attach({
                number: 1,
                name: 'Chapter 1: The Mandalorian',
            });

            await Promise.all(show.episodes.map((episode) => episode.save()));
            await show.save();
        });
        cy.waitSync();

        // Intercept PATCH requests for show updates
        cy.intercept('PATCH', podUrl('/shows/**/info')).as('updateShow');
        cy.intercept('PATCH', podUrl('/shows/**/**/episode-1')).as('updateEpisode1');
        cy.intercept('PATCH', podUrl('/shows/**/**/episode-2')).as('createEpisode2');

        // Act - Update shows from TMDB
        cy.contains('Update Shows').click();
        cy.waitSync();

        // Wait for the success message
        cy.contains('Shows updated successfully!').should('be.visible');

        // Assert - Verify the show was synced
        cy.get('@updateShow.all').should('have.length', 1);
        cy.get('@updateEpisode1.all').should('have.length', 1);
        cy.get('@createEpisode2.all').should('have.length', 1);

        cy.fixture('sparql/update-show.sparql').then((sparql) => {
            cy.get('@updateShow').its('response.statusCode').should('eq', 205);
            cy.get('@updateShow').its('request.body').should('be.sparql', sparql);
        });

        cy.fixture('sparql/update-episode-1.sparql').then((sparql) => {
            cy.get('@updateEpisode1').its('response.statusCode').should('eq', 205);
            cy.get('@updateEpisode1').its('request.body').should('be.sparql', sparql);
        });

        cy.fixture('sparql/create-episode-2.sparql').then((sparql) => {
            cy.get('@createEpisode2').its('response.statusCode').should('eq', 201);
            cy.get('@createEpisode2').its('request.body').should('be.sparql', sparql);
        });
    });

    it('Loads data from Solid pod on login', () => {
        // Arrange - Create some data in the pod directly
        cy.solidCreateContainer('/shows/', 'Shows');
        cy.solidCreateDocument('/settings/privateTypeIndex', '<> a <http://www.w3.org/ns/solid/terms#TypeIndex> .');
        cy.solidUpdateDocument(
            '/settings/privateTypeIndex',
            `
                INSERT DATA {
                    <#shows>
                        a <http://www.w3.org/ns/solid/terms#TypeRegistration> ;
                        <http://www.w3.org/ns/solid/terms#forClass> <https://schema.org/TVSeries>  ;
                        <http://www.w3.org/ns/solid/terms#instanceContainer> <${podUrl('/shows/')}> .
                }
            `,
        );
        cy.solidUpdateDocument(
            '/profile/card',
            `
                INSERT DATA {
                    <http://localhost:3000/alice/profile/card#me>
                        <http://www.w3.org/ns/solid/terms#privateTypeIndex>
                        <http://localhost:3000/alice/settings/privateTypeIndex> .
                }
            `,
        );
        cy.solidCreateDocument(
            '/shows/show-1',
            `
                @prefix schema: <https://schema.org/> .

                <#it> a schema:TVSeries ;
                    schema:name "Preloaded Show" ;
                    schema:description "This show was preloaded in the pod." ;
                    schema:containsSeason <#season-1> .

                <#season-1> a schema:TVSeason ;
                    schema:seasonNumber 1 ;
                    schema:episode <#episode-1> .

                <#episode-1> a schema:TVEpisode ;
                    schema:episodeNumber 1 ;
                    schema:name "Preloaded Episode" .

                <#action> a schema:WatchAction ;
                    schema:object <#it> ;
                    schema:actionStatus schema:ActiveActionStatus .
            `,
        );

        // Act - Login to load the data
        cy.visit('/');
        cy.ariaLabel('Configuration').click();
        cy.contains('Connect account').click();
        cy.ariaInput('Login url').type(`${webId()}{enter}`);
        cy.solidLogin();
        cy.waitSync();

        // Assert - Verify the preloaded show appears in the UI
        cy.contains('Preloaded Show').should('be.visible');
        cy.contains('Preloaded Show').click();

        // Check show details loaded correctly
        cy.contains('Preloaded Show').should('be.visible');
        cy.contains('This show was preloaded in the pod.').should('be.visible');
        cy.contains('Watching').should('be.visible');
        cy.contains('Season 1').should('be.visible');
        cy.contains('Preloaded Episode').should('be.visible');
    });

    it('Syncs show deletion', () => {
        // Login
        cy.ariaLabel('Configuration').click();
        cy.contains('Connect account').click();
        cy.ariaInput('Login url').type(`${webId()}{enter}`);
        cy.solidLogin();
        cy.waitSync();

        // Create a show programmatically
        cy.model('Show').then(async (Show) => {
            const show = new Show({
                url: podUrl('/shows/to-delete#it'),
                name: 'Show To Delete',
                description: 'This show will be deleted during the test.',
            });

            // Set status and add a season
            show.relatedWatchAction.attach({ status: 'pending' });
            show.relatedSeasons.attach({ number: 1 });

            await show.save();
        });
        cy.waitSync();

        // Navigate to the show
        cy.contains('My Shows').click();
        cy.contains('Show To Delete').click();

        // Act - Delete the show
        cy.contains('button', 'Delete').click();
        cy.contains('Delete Show').click(); // Confirm deletion
        cy.waitSync();

        // Verify show is no longer in the UI - we should be redirected to shows index
        cy.url().should('include', '/shows');
        cy.contains('Show To Delete').should('not.exist');

        // Assert - Verify deletion was synced
        cy.fixture('turtle/tombstone.ttl').then((expected) => {
            cy.solidReadDocument('/shows/to-delete').then((actual) => {
                cy.wrap(actual).should('be.turtle', expected);
            });
        });
    });

    it('Syncs shows imported from TMDB search', () => {
        // Mock TMDB API responses for search
        cy.intercept('GET', 'https://api.themoviedb.org/3/search/tv*', {
            statusCode: 200,
            fixture: 'tmdb/search-results.json',
        }).as('searchShows');

        // Mock TMDB API responses for show details
        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/66732**', {
            statusCode: 200,
            fixture: 'tmdb/stranger-things.json',
        }).as('showDetails');

        // Mock TMDB API responses for external IDs
        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/66732/external_ids?*', {
            statusCode: 200,
            fixture: 'tmdb/stranger-things-external-ids.json',
        }).as('externalIds');

        // Mock TMDB API responses for season details
        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/66732/season/1**', {
            statusCode: 200,
            fixture: 'tmdb/stranger-things-s1.json',
        }).as('season1Details');

        // Mock TMDB API responses for season 2 details
        cy.intercept('GET', 'https://api.themoviedb.org/3/tv/66732/season/2**', {
            statusCode: 200,
            fixture: 'tmdb/stranger-things-s2.json',
        }).as('season2Details');

        // Intercept Solid sync requests
        cy.intercept('PATCH', podUrl('/shows/stranger-things-2016/info')).as('createShow');
        cy.intercept('PATCH', podUrl('/shows/stranger-things-2016/season-1/*')).as('createS1Episode');
        cy.intercept('PATCH', podUrl('/shows/stranger-things-2016/season-2/*')).as('createS2Episode');
        cy.intercept('PATCH', podUrl('/shows/**/*')).as('createSomething');

        // Act - First, add a show WITHOUT being connected to Solid
        cy.contains('My Shows').click();
        cy.contains('Search Shows').click();

        // Search for a show
        cy.get('input[type="search"]').type('stranger');

        // Wait for the search API call
        cy.wait('@searchShows');

        // Should see search results
        cy.contains('Stranger Things').should('be.visible');

        // Add the show to my list
        cy.contains('Add to My Shows').click();

        // Wait for the TMDB API calls
        cy.wait('@showDetails');
        cy.wait('@externalIds');
        cy.wait('@season1Details');
        cy.wait('@season2Details');

        // Verify the show appears in the UI (should be stored locally)
        cy.contains('Stranger Things').should('be.visible');
        cy.get('[title="Plan to Watch"]').should('be.visible');

        // Navigate to show details and verify data
        cy.contains('Stranger Things').click();
        cy.contains('Plan to Watch').should('be.visible');
        cy.contains('When a young boy vanishes, a small town uncovers a mystery').should('be.visible');
        cy.contains('Season 1').should('be.visible');

        // Verify episodes are loaded
        cy.contains('Chapter One: The Vanishing of Will Byers').should('be.visible');
        cy.contains('Chapter Two: The Weirdo on Maple Street').should('be.visible');

        // Go back to shows list
        cy.go('back');

        // NOW connect to Solid account (this is where the bug should reproduce)
        cy.ariaLabel('Configuration').click();
        cy.contains('Connect account').click();
        cy.ariaInput('Login url').type(`${webId()}{enter}`);
        cy.solidLogin();
        cy.waitSync();

        // Assert - Verify the show was synced to Solid
        cy.get('@createShow.all').should('have.length', 1);
        cy.get('@createS1Episode.all').should('have.length', 8);
        cy.get('@createS2Episode.all').should('have.length', 9);
        cy.get('@createSomething.all').should('have.length', 18);

        // Verify the show still appears in the UI after sync
        cy.contains('Stranger Things').should('be.visible');
        cy.get('[title="Plan to Watch"]').should('be.visible');

        // Navigate to show details and verify data is still intact
        cy.contains('Stranger Things').click();
        cy.contains('Plan to Watch').should('be.visible');
        cy.contains('When a young boy vanishes, a small town uncovers a mystery').should('be.visible');
        cy.contains('Season 1').should('be.visible');
        cy.url().should('include', '/shows/stranger-things-2016');
    });

    it('Creates a second show with the correct folder structure when connected to Solid', () => {
        // Intercept requests to detect synchronization and verify folder structure
        cy.intercept('PATCH', podUrl('/shows/friends/info')).as('createFirstShow');
        cy.intercept('PATCH', podUrl('/shows/seinfeld/info')).as('createSecondShow');
        cy.intercept('PATCH', podUrl('/shows/**/*')).as('createSomething');

        // Login to Solid first
        cy.ariaLabel('Configuration').click();
        cy.contains('Connect account').click();
        cy.ariaInput('Login url').type(`${webId()}{enter}`);
        cy.solidLogin();
        cy.waitSync();

        // Act - Create first show using the form
        cy.contains('My Shows').click();
        cy.contains('Add Your First Show').click();
        cy.comboboxSelect('Status', 'Watching');
        cy.get('input[name="name"]').type('Friends');
        cy.get('textarea[name="description"]').type(
            'A group of friends living in Manhattan navigate life and love together.',
        );

        // Add a season with episodes
        cy.contains('Add Season').click();
        cy.contains('Season 1').click();
        cy.contains('Add Episode').click();
        cy.get('input[placeholder*="Episode name"]').first().type('The One Where Monica Gets a Roommate');
        cy.get('textarea[placeholder*="Episode description"]')
            .first()
            .type('Rachel moves in with Monica after leaving her fiancé at the altar.');
        cy.get('input[placeholder*="Episode duration"]').first().type('22m');

        cy.contains('Create').click();
        cy.waitSync();

        // Verify first show was created with the correct folder
        cy.get('@createFirstShow.all').should('have.length', 1);
        cy.get('@createFirstShow').its('request.url').should('include', '/shows/friends/info');

        // Reload the page
        cy.reload();
        cy.solidAuthorize();

        // Now create second show using the form after reload
        cy.contains('My Shows').click();
        cy.contains('Add Show').click();
        cy.comboboxSelect('Status', 'Completed');
        cy.get('input[name="name"]').type('Seinfeld');
        cy.get('textarea[name="description"]').type(
            'A show about nothing, following the lives of four friends in New York City.',
        );

        // Add a season with episodes
        cy.contains('Add Season').click();
        cy.contains('Season 1').click();
        cy.contains('Add Episode').click();
        cy.get('input[placeholder*="Episode name"]').first().type('The Seinfeld Chronicles');
        cy.get('textarea[placeholder*="Episode description"]')
            .first()
            .type('Jerry and George discuss the button on George\'s shirt.');
        cy.get('input[placeholder*="Episode duration"]').first().type('23m');

        cy.contains('Create').click();
        cy.waitSync();

        // Verify second show was created with the correct folder structure
        cy.get('@createSecondShow.all').should('have.length', 1);
        cy.get('@createSecondShow').its('request.url').should('include', '/shows/seinfeld/info');

        // Verify both shows exist in the UI
        cy.contains('Friends').should('be.visible');
        cy.contains('Seinfeld').should('be.visible');

        // Verify both shows are accessible via their URLs
        cy.contains('Friends').click();
        cy.url().should('include', '/shows/friends');
        cy.go('back');

        cy.contains('Seinfeld').click();
        cy.url().should('include', '/shows/seinfeld');

        // Verify the folder structure in the Solid pod
        cy.solidReadDocument('/shows/friends/info').should('contain', 'Friends');
        cy.solidReadDocument('/shows/friends/season-1/episode-1').should('contain', 'Monica Gets a Roommate');
        cy.solidReadDocument('/shows/seinfeld/info').should('contain', 'Seinfeld');
        cy.solidReadDocument('/shows/seinfeld/season-1/episode-1').should('contain', 'The Seinfeld Chronicles');
    });

});
