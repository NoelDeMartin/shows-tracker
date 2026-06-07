import { input, interceptRequests, podUrl, press, solidLogin, solidReset, waitSync } from '@aerogel/playwright';
import { fixture } from '@e2e/lib/fixtures';
import { test, expect } from '@e2e/lib/setup';

test.beforeEach(async ({ page }) => {
    await solidReset();
    await page.goto('/');
});

test('imports a show', async ({ page }) => {
    const createDocument = interceptRequests(page, 'PATCH', podUrl('/shows/*'));

    await press(page, 'Configuration');
    await press(page, 'Connect account');
    await press(page, 'Log in to dev server');
    await solidLogin(page);
    await waitSync(page);

    await press(page, 'Add Show');
    await input(page, 'Search').fill('freaks and geeks');
    await input(page, 'Search').press('Enter');
    await press(page, 'Import', { within: page.getByRole('listitem').filter({ hasText: 'Freaks and Geeks (1999)' }) });
    await waitSync(page);

    expect(createDocument.all.length).toBe(19);
    expect(createDocument.nth(1)?.url).toEqual(podUrl('/shows/freaks-and-geeks-1999/info'));
    expect(createDocument.nth(1)?.body).toContain('"Freaks and Geeks"');
    expect(createDocument.nth(1)?.body).toContain('<https://www.imdb.com/title/tt0193676/>');
    expect(createDocument.nth(1)?.body).toContain('<https://schema.org/seasonNumber> 1');
    expect(createDocument.first(podUrl('/shows/freaks-and-geeks-1999/season-1/episode-1'))?.body).toEqualSparql(
        fixture('/sparql/episode.sparql', { name: 'Pilot', seasonNumber: 1 }) ?? '',
    );
});
