import '@aerogel/cypress/support';
import 'cypress-file-upload';

declare global {
    namespace Cypress {
        interface Chainable {
            attachFile(fileName: string): Chainable<JQuery<HTMLElement>>;
        }
    }
}
