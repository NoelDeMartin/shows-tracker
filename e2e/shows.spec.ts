import { comboboxSelect, dontSee, input, press, see } from '@aerogel/playwright';
import { test } from '@e2e/lib/setup';

test.beforeEach(async ({ page }) => {
    await page.goto('/');
});

test('computes pending episodes', async ({ page }) => {
    // Start watching a show
    await press(page, 'Add Show');
    await input(page, 'Search').fill('freaks and geeks');
    await input(page, 'Search').press('Enter');
    await press(page, 'Import', { within: page.getByRole('listitem').filter({ hasText: 'Freaks and Geeks (1999)' }) });
    await see(page, '[Imported]');

    await page.goto('/shows');
    await press(page, 'Freaks and Geeks');
    await comboboxSelect(page, 'Status', 'Watching');
    await press(page, 'Season 1', { selector: 'summary' });
    await press(page, 'Watch', { within: page.getByRole('listitem').filter({ hasText: 'Pilot' }) });
    await dontSee(page, 'Updating status...');

    // See pending episodes
    await page.goto('/');
    await see(page, 'Freaks and Geeks (17)');
});
