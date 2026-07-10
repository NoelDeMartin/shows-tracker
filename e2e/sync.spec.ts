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
import { SolidStore, turtleToQuads } from '@noeldemartin/solid-utils';
import { objectWithoutEmpty } from '@noeldemartin/utils';

test.beforeEach(async ({ page }) => {
    await solidReset();
    await page.goto('/');
});

test('imports a show from tmdb', async ({ page }) => {
    // Log in
    await localFirstLogin(page);

    // Import
    const createDocument = interceptRequests(page, 'PATCH', podUrl('/shows/*'));
    const registerContainer = interceptRequests(page, 'PATCH', podUrl('/settings/privateTypeIndex'));

    await press(page, 'Search Shows');
    await input(page, 'Search').fill('freaks and geeks');
    await input(page, 'Search').press('Enter');
    await press(page, 'Import', { within: page.getByRole('listitem').filter({ hasText: 'Freaks and Geeks (1999)' }) });
    await waitSync(page);

    expect(registerContainer.all).toHaveLength(1);
    expect(registerContainer.nth(1)?.body).toContain(podUrl('/shows/'));
    expect(registerContainer.nth(1)?.body).not.toContain(podUrl('/shows/freaks-and-geeks-1999/'));
    expect(createDocument.all).toHaveLength(19);
    expect(createDocument.nth(1)?.url).toEqual(podUrl('/shows/freaks-and-geeks-1999/info'));
    expect(createDocument.nth(1)?.body).toContain('"Freaks and Geeks"');
    expect(createDocument.nth(1)?.body).toContain('<https://www.imdb.com/title/tt0193676/>');
    expect(createDocument.nth(1)?.body).toContain('<https://schema.org/seasonNumber> 1');
    expect(createDocument.first(podUrl('/shows/freaks-and-geeks-1999/season-1/episode-1'))?.body).toEqualSparql(
        requiredFixture('/sparql/create-episode.sparql', { name: 'Pilot', seasonNumber: 1 }),
    );

    // Sync
    const readDocument = interceptRequests(page, 'GET', podUrl('/shows/*'));

    await press(page, 'Open account');
    await press(page, 'Synchronize', { role: 'button' });
    await waitSync(page);

    expect(readDocument.all).toHaveLength(3);
});

test('pulls in existing shows & updates', async ({ page }) => {
    // Populate POD & Log in
    await solidUpdateDocument('/profile/card', requiredFixture('/sparql/declare-type-index.sparql'));
    await solidCreateDocument('/settings/privateTypeIndex', requiredFixture('/turtle/type-index.ttl'));
    await solidCreateDocument(
        '/shows/freaks-and-geeks-1999/info',
        requiredFixture('/turtle/freaks-and-geeks-info.ttl'),
    );
    await solidCreateDocument(
        '/shows/freaks-and-geeks-1999/season-1/episode-1',
        requiredFixture('/turtle/freaks-and-geeks-s01e01.ttl'),
    );
    await solidCreateDocument(
        '/shows/freaks-and-geeks-1999/season-1/episode-2',
        requiredFixture('/turtle/freaks-and-geeks-s01e02.ttl'),
    );
    await localFirstLogin(page);

    // See shows
    await see(page, 'Freaks and Geeks (2)');

    // Prepare updates
    await solidUpdateDocument(
        '/shows/freaks-and-geeks-1999/season-1/episode-1',
        requiredFixture('/sparql/watch-episode.sparql'),
    );

    // Pull updates
    await press(page, 'Open account');
    await press(page, 'Synchronize', { role: 'button' });
    await waitSync(page);

    await see(page, 'Freaks and Geeks (1)');
});

test('skips containers with deep last modified dates', async ({ page }) => {
    // Arrange
    const requests: Record<string, number> = {};
    const fixtures = {
        'shows/': '/turtle/shows.ttl',
        'shows/freaks-and-geeks-1999/': '/turtle/freaks-and-geeks.ttl',
        'shows/freaks-and-geeks-1999/info': '/turtle/freaks-and-geeks-info.ttl',
        'shows/freaks-and-geeks-1999/season-1/': '/turtle/freaks-and-geeks-s01.ttl',
        'shows/freaks-and-geeks-1999/season-1/episode-1': '/turtle/freaks-and-geeks-s01e01-watched.ttl',
        'shows/freaks-and-geeks-1999/season-1/episode-2': '/turtle/freaks-and-geeks-s01e02.ttl',
    };

    await page.route(podUrl('/shows/**/*'), async (route) => {
        const url = route.request().url();
        const path = url.slice(podUrl().length) as keyof typeof fixtures;

        requests[path] ??= 0;
        requests[path]++;

        if (!(path in fixtures)) {
            return route.fulfill({
                status: 404,
                headers: { 'Content-Type': 'text/plain' },
                body: `${path} not found`,
            });
        }

        const body = requiredFixture(fixtures[path]);
        const store = new SolidStore(await turtleToQuads(body, { baseIRI: url }));
        const lastModified =
            store.statement(`${url}#watched`, 'schema:endTime') ??
            store.statement(`${url}#it-metadata`, 'crdt:updatedAt');

        return route.fulfill({
            status: 200,
            headers: objectWithoutEmpty({
                'Content-Type': 'text/turtle',
                'Last-Modified': lastModified && new Date(lastModified.object.value).toUTCString(),
                'Access-Control-Expose-Headers': 'Last-Modified',
            }),
            body,
        });
    });

    await solidUpdateDocument('/profile/card', requiredFixture('/sparql/declare-type-index.sparql'));
    await solidCreateDocument('/settings/privateTypeIndex', requiredFixture('/turtle/type-index.ttl'));

    // Log in
    await localFirstLogin(page);

    // First Sync
    await press(page, 'Open account');
    await press(page, 'Synchronize', { role: 'button' });
    await waitSync(page);
    await page.keyboard.press('Escape');

    expect(requests).toEqual({
        'shows/': 2,
        'shows/freaks-and-geeks-1999/': 1,
        'shows/freaks-and-geeks-1999/info': 1,
        'shows/freaks-and-geeks-1999/season-1/': 1,
        'shows/freaks-and-geeks-1999/season-1/episode-1': 1,
        'shows/freaks-and-geeks-1999/season-1/episode-2': 1,
    });

    // Watch episode
    await press(page, 'Freaks and Geeks');
    await press(page, 'Season 1', { selector: 'summary' });
    await press(page, 'Watch', { within: page.getByRole('listitem').filter({ hasText: 'Beers and Weirs' }) });
    await waitSync(page);

    expect(requests).toEqual({
        'shows/': 3,
        'shows/freaks-and-geeks-1999/': 1,
        'shows/freaks-and-geeks-1999/info': 1,
        'shows/freaks-and-geeks-1999/season-1/': 1,
        'shows/freaks-and-geeks-1999/season-1/episode-1': 1,
        'shows/freaks-and-geeks-1999/season-1/episode-2': 4,
    });
});
