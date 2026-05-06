<template>
    <Page>
        <ul v-if="$catalog.shows.length > 0" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <li v-for="show in $catalog.shows" :key="show.url">
                <Button variant="secondary" route="shows.show" :route-params="{ show: show.slug }" class="w-full">
                    {{ show.name }} ({{ pendingEpisodes(show) }})
                </Button>
            </li>
        </ul>
        <p v-else>No shows found</p>
        <Button class="mt-4" route="search">Add Show</Button>
    </Page>
</template>

<script setup lang="ts">
import type Show from '@/models/Show';

function pendingEpisodes(show: Show): string {
    if (!show.seasons) {
        return '?';
    }

    let count = 0;

    for (const season of show.seasons) {
        if (!season.episodes) {
            return '?';
        }

        count += season.episodes.filter((episode) => !episode.watched).length;
    }

    return String(count);
}
</script>
