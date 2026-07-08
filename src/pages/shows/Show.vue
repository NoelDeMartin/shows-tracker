<template>
    <Page>
        <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold">
                {{ show.name }}
            </h2>

            <Button v-if="$app.devMode" variant="secondary" @click="clearCache()">Clear Cache</Button>
        </div>

        <Details
            v-for="{ season, watched, total } of sortedSeasons"
            :key="season.url"
            :label="`Season ${season.number} (${watched}/${total})`"
            class="mt-4"
            content-class="pl-8"
        >
            <ol class="list-decimal space-y-2">
                <li v-for="episode of season.episodes" :key="episode.url">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span
                                v-if="episode.publishedAt"
                                class="rounded-full bg-gray-500 px-2 py-1 text-xs text-white"
                            >
                                {{ episode.publishedAt.toLocaleDateString() }}
                            </span>
                            <span>{{ episode.name }}</span>
                        </div>
                        <Button @click="episode.toggleWatched()">
                            {{ episode.watched ? 'Unwatch' : 'Watch' }}
                        </Button>
                    </div>
                </li>
                <li v-if="watched !== total" class="flex items-center justify-end">
                    <Button @click="watchSeason(season)">Watch All</Button>
                </li>
            </ol>
        </Details>

        <p v-if="show.seasonUrls.length === 0" class="mt-4">No seasons yet</p>

        <div class="mt-4 flex items-center gap-2">
            <Button @click="sync()" :disabled="syncing">
                <i-lucide-refresh-cw class="size-4" :class="{ 'animate-spin': syncing }" />
                Synchronize
            </Button>

            <div v-if="changingStatus">
                <i-svg-spinners-180-ring-with-bg />
                <span class="sr-only">Updating status...</span>
            </div>
            <Select
                v-else
                label="Status"
                label-class="sr-only"
                :options="statusOptions"
                :model-value="show.watchingStatus"
                :render-option="stringToStudlyCase"
                @update:modelValue="updateWatchingStatus($event as ShowWatchingStatus)"
            />
        </div>
    </Page>
</template>

<script setup lang="ts">
import { UI } from '@aerogel/core';
import { computedModel } from '@aerogel/plugin-solid';
import { after, arrayFilter, arraySorted, arrayUnique, stringToStudlyCase } from '@noeldemartin/utils';
import { ComputedAttributesCache, engineFulfillsContract, requireEngine } from 'soukai-bis';
import { computed, ref, watch } from 'vue';
import { toRaw } from 'vue';

import type Season from '@/models/Season';
import type Show from '@/models/Show';
import { SHOW_WATCHING_STATUSES, type ShowWatchingStatus } from '@/models/ShowWatching';
import Catalog from '@/services/Catalog';

const { show } = defineProps<{ show: Show }>();
const loading = new Set<string>();
const statusOptions = Object.keys(SHOW_WATCHING_STATUSES);
const syncing = ref(false);
const changingStatus = ref(false);
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

async function updateWatchingStatus(status: ShowWatchingStatus) {
    changingStatus.value = true;

    try {
        await Promise.all([after(1000), toRaw(show).updateWatchingStatus(status)]);
        await Catalog.syncIfNeeded(show);
    } finally {
        changingStatus.value = false;
    }
}

async function sync() {
    syncing.value = true;

    try {
        await Promise.all([after(1000), Catalog.sync(show)]);
    } finally {
        syncing.value = false;
    }
}

async function clearCache() {
    if (!computedShow.value) {
        return;
    }

    const engine = requireEngine();
    const documentUrls = arrayUnique(
        arrayFilter([
            computedShow.value.getDocumentUrl(),
            computedShow.value.getContainerUrl(),
            ...(computedShow.value.seasons?.map((season) => season.getDocumentUrl()) ?? []),
            ...(computedShow.value.seasons?.flatMap((season) =>
                season.episodes?.map((episode) => episode.getDocumentUrl()),
            ) ?? []),
            ...(computedShow.value.seasons?.flatMap((season) =>
                season.episodes?.map((episode) => episode.getContainerUrl()),
            ) ?? []),
        ]),
    );

    if (engineFulfillsContract(engine, 'PurgesMetadata')) {
        await engine.purgeMetadata({ documentUrls });
    }

    await ComputedAttributesCache.invalidate({ documentUrls });

    UI.toast('Cache cleared!');
}

watch(
    computedShow,
    async (newShow) => {
        signal.value = Math.random();

        if (!newShow?.hasUrl() || loading.has(newShow.url)) {
            return;
        }

        loading.add(newShow.url);

        try {
            await newShow.loadAllRelationsIfUnloaded();
        } finally {
            loading.delete(newShow.url);
        }
    },
    {
        deep: true,
        immediate: true,
    },
);
</script>
