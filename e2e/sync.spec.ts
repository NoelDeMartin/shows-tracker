import {
    input,
    interceptRequests,
    podUrl,
    press,
    localFirstLogin,
    solidReset,
    waitSync,
    solidCreateDocument,
    see,
    solidUpdateDocument,
} from '@aerogel/playwright';
import { requiredFixture } from '@e2e/lib/fixtures';
import { test, expect } from '@e2e/lib/setup';

test.beforeEach(async ({ page }) => {
    await solidReset();
    await page.goto('/');
});

test('imports a show from tmdb', async ({ page }) => {
    // Log in
    await localFirstLogin(page);

    // Import
    const createDocument = interceptRequests(page, 'PATCH', podUrl('/shows/*'));

    await press(page, 'Add Show');
    await input(page, 'Search').fill('freaks and geeks');
    await input(page, 'Search').press('Enter');
    await press(page, 'Import', { within: page.getByRole('listitem').filter({ hasText: 'Freaks and Geeks (1999)' }) });
    await waitSync(page);

    expect(createDocument.all).toHaveLength(19);
    expect(createDocument.nth(1)?.url).toEqual(podUrl('/shows/freaks-and-geeks-1999/info'));
    expect(createDocument.nth(1)?.body).toContain('"Freaks and Geeks"');
    expect(createDocument.nth(1)?.body).toContain('<https://www.imdb.com/title/tt0193676/>');
    expect(createDocument.nth(1)?.body).toContain('<https://schema.org/seasonNumber> 1');
    expect(createDocument.first(podUrl('/shows/freaks-and-geeks-1999/season-1/episode-1'))?.body).toEqualSparql(
        requiredFixture('/sparql/episode.sparql', { name: 'Pilot', seasonNumber: 1 }),
    );

    // Sync
    const readDocument = interceptRequests(page, 'GET', podUrl('/shows/*'));

    await press(page, 'Open account');
    await press(page, 'Synchronize', { role: 'button' });
    await waitSync(page);

    expect(readDocument.all).toHaveLength(2);
});

test('pulls in existing shows', async ({ page }) => {
    // Populate POD & Log in
    await solidUpdateDocument('/profile/card', requiredFixture('/sparql/declare-type-index.sparql'));
    await solidCreateDocument('/settings/privateTypeIndex', requiredFixture('/turtle/type-index.ttl'));
    await solidCreateDocument('/shows/freaks-and-geeks-1999/info', requiredFixture('/turtle/freaks-and-geeks.ttl'));
    await solidCreateDocument(
        '/shows/freaks-and-geeks-1999/season-1/episode-1',
        requiredFixture('/turtle/freaks-and-geeks-s01e01.ttl'),
    );
    await localFirstLogin(page);

    // See shows
    await see(page, 'Freaks and Geeks');
});
