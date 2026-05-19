<template>
    <Page>
        <ShowsList v-if="activeShows.length > 0" :shows="activeShows" />
        <p v-else>No shows found</p>
        <Button class="mt-4" route="search">Add Show</Button>
        <Link route="shows.index">View all shows &rarr;</Link>
    </Page>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import Episode from '@/models/Episode';
import Catalog from '@/services/Catalog';

const activeShows = computed(() =>
    Catalog.shows.filter(
        (show) =>
            show.watchingStatus === 'watching' &&
            show.pendingEpisodeDates.value?.some((date) => date && Episode.isUpcoming(date)),
    ),
);
</script>
