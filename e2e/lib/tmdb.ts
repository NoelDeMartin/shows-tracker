import { fixture } from '@e2e/lib/fixtures';
import { stringToSlug } from '@noeldemartin/utils';
import type { Page } from '@playwright/test';

type ShowParams = {
    showId: string;
    externalIds?: string;
    seasonNumber?: string;
};

function handleRequest(url: URL) {
    if (url.pathname === '/3/search/tv') {
        return handleSearch(url.searchParams.get('query') ?? '');
    }

    const showPathRegex =
        /^\/3\/tv\/(?<showId>\d+)(?:\/(?:(?<externalIds>external_ids)|season\/(?<seasonNumber>\d+)))?$/;

    const showMatch = url.pathname.match(showPathRegex) as { groups?: ShowParams } | null;

    if (showMatch?.groups) {
        return handleShow(showMatch.groups);
    }

    return null;
}

function handleSearch(query: string) {
    const slug = stringToSlug(query);

    return fixture(`/search/${slug}.json`);
}

function handleShow({ showId, externalIds, seasonNumber }: ShowParams) {
    if (externalIds) {
        return fixture(`/shows/${showId}-external_ids.json`);
    }

    if (seasonNumber) {
        return fixture(`/shows/${showId}-season-${seasonNumber}.json`);
    }

    return fixture(`/shows/${showId}.json`);
}

export async function interceptTMDBRequests(page: Page) {
    await page.route('https://api.themoviedb.org/**', (route) => {
        const url = new URL(route.request().url());
        const response = handleRequest(url);

        if (!response) {
            return route.fulfill({ status: 404 });
        }

        return route.fulfill({
            status: 200,
            body: response,
        });
    });
}
