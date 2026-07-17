import { comboboxSelect, dontSee, input, press, see } from '@aerogel/playwright';
import { test, expect } from '@e2e/lib/setup';

test.beforeEach(async ({ page }) => {
    await page.goto('/');
});

test('computes pending episodes', async ({ page }) => {
    // Start watching a show
    await press(page, 'Search Shows');
    await input(page, 'Search').fill('freaks and geeks');
    await input(page, 'Search').press('Enter');
    await press(page, 'Import Watching', {
        within: page.getByRole('listitem').filter({ hasText: 'Freaks and Geeks (1999)' }),
    });
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

test('imports from TViso', async ({ page }) => {
    // Arrange
    await press(page, 'Import Shows');

    // Act
    await page.setInputFiles('input[type="file"]', 'e2e/fixtures/tviso-small.json');
    await press(page, 'Import Collection', { role: 'button' });

    // Assert
    await see(page, 'Stranger Things', { within: page.getByRole('list', { name: 'Imported:' }) });
    await see(page, 'Breaking Bad (Validation or import error)', {
        within: page.getByRole('list', { name: 'Failed:' }),
    });
    await see(page, 'The Office (Validation or import error)', { within: page.getByRole('list', { name: 'Failed:' }) });
    await see(page, 'Lost (Validation or import error)', { within: page.getByRole('list', { name: 'Failed:' }) });

    await press(page, 'Back to Shows');
    await see(page, 'Stranger Things');
    await press(page, 'Stranger Things');
    await see(page, 'Stranger Things');
    await see(page, 'Watching');
    await see(page, 'Season 1');
});

test('fetches seasons when you start watching a show', async ({ page }) => {
    // Arrange
    await press(page, 'Import Shows');

    // Act
    await page.setInputFiles('input[type="file"]', 'e2e/fixtures/tviso-pending.json');
    await press(page, 'Import Collection', { role: 'button' });

    // Assert
    await see(page, 'Stranger Things', { within: page.getByRole('list', { name: 'Imported:' }) });

    await press(page, 'Back to Shows');
    await see(page, 'Stranger Things');
    await press(page, 'Stranger Things');
    await see(page, 'Stranger Things');
    await see(page, 'Pending');
    await see(page, 'No seasons yet');

    await comboboxSelect(page, 'Status', 'Watching');
    await dontSee(page, 'Updating status...');
    await see(page, 'Season 1');
});

test('edits external URLs', async ({ page }) => {
    // Arrange
    await press(page, 'Import Shows');
    await page.setInputFiles('input[type="file"]', 'e2e/fixtures/tviso-small.json');
    await press(page, 'Import Collection', { role: 'button' });
    await press(page, 'Back to Shows');
    await see(page, 'Stranger Things');
    await press(page, 'Stranger Things');

    // Act
    await press(page, 'Edit');

    const inputs = page.getByPlaceholder('https://example.com');
    await expect(inputs).toHaveCount(2);

    await press(page, 'Remove', { selector: 'button' });
    await expect(inputs).toHaveCount(1);

    await press(page, 'Save');
    await dontSee(page, 'Edit Show');

    // Assert
    await press(page, 'Edit');
    await expect(inputs).toHaveCount(1);
});
