<template>
    <Page>
        <h2 class="text-2xl font-bold">
            {{ show.name }}
        </h2>

        <Details
            v-for="{ season, watched, total } of sortedSeasons"
            :key="season.url"
            :label="`Season ${season.number} (${watched}/${total})`"
            class="mt-4"
        >
            <ul class="list-inside list-disc space-y-2">
                <li v-for="episode of season.episodes" :key="episode.url" class="flex items-center justify-between">
                    <span>{{ episode.name }}</span>
                    <Button @click="episode.toggleWatched()">
                        {{ episode.watched ? 'Unwatch' : 'Watch' }}
                    </Button>
                </li>
                <li v-if="watched !== total" class="flex items-center justify-end">
                    <Button @click="watchSeason(season)">Watch All</Button>
                </li>
            </ul>
        </Details>

        <p v-if="show.seasonUrls.length === 0" class="mt-4">No seasons yet</p>

        <Button @click="sync()" :disabled="syncing" class="mt-4">
            <i-lucide-refresh-cw class="size-4" :class="{ 'animate-spin': syncing }" />
            Synchronize
        </Button>
    </Page>
</template>

<script setup lang="ts">
import { computedModel } from '@aerogel/plugin-solid';
import { after, arraySorted } from '@noeldemartin/utils';
import { computed, onMounted, ref, watch } from 'vue';

import type Season from '@/models/Season';
import type Show from '@/models/Show';
import Catalog from '@/services/Catalog';

const { show } = defineProps<{ show: Show }>();
const syncing = ref(false);
const signal = ref<unknown>(null);
const computedShow = computedModel(() => Catalog.shows.find((s) => s.url === show.url));
const sortedSeasons = computed(() => {
    if (!signal.value) {
        return [];
    }

    return (
        arraySorted(computedShow.value?.seasons ?? [], 'number').map((season) => ({
            season,
            watched: season.episodes?.reduce((acc, episode) => acc + (episode.watched ? 1 : 0), 0) ?? 0,
            total: season.episodeUrls.length,
        })) ?? []
    );
});

async function watchSeason(season: Season) {
    await Promise.all(season.episodes?.map((episode) => episode.watched || episode.toggleWatched()) ?? []);
}

async function sync() {
    syncing.value = true;

    try {
        await Promise.all([after(1000), Catalog.sync(show)]);
    } finally {
        syncing.value = false;
    }
}

watch(computedShow, () => (signal.value = Math.random()), {
    deep: true,
    immediate: true,
});

onMounted(() => show.loadAllRelations());
</script>
