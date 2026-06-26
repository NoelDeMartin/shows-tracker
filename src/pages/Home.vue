<template>
    <Page>
        <ShowsList v-if="activeShows.length > 0" :shows="activeShows" />
        <p v-else>No shows found</p>
        <div class="mt-4 flex flex-col gap-2">
            <Button route="shows.search">Search Shows</Button>
            <Button route="shows.import">Import Shows</Button>
            <Link route="shows.index">View all shows &rarr;</Link>
        </div>
    </Page>
</template>

<script setup lang="ts">
import { computedModels } from '@aerogel/plugin-solid';

import Episode from '@/models/Episode';
import Show from '@/models/Show';
import Catalog from '@/services/Catalog';

const activeShows = computedModels(
    Show,
    () =>
        Catalog.shows.filter(
            (show) =>
                show.watchingStatus === 'watching' &&
                show.pendingEpisodeDates.value?.some((date) => date && Episode.isUpcoming(date)),
        ),
    { watch: ['pendingEpisodeDates'] },
);
</script>
