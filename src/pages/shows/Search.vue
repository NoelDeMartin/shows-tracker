<template>
    <Page>
        <h2 class="text-2xl font-bold">Search</h2>
        <form class="mt-2" @submit.prevent="search()">
            <Input v-model="query" label="Search" label-class="sr-only" placeholder="Search for a show" class="mt-2" />
            <Button class="mt-2 w-full" submit>Search</Button>
        </form>

        <template v-if="results">
            <h3 class="mt-4 text-lg font-bold">Results</h3>
            <ul v-if="results.length > 0" class="mt-2 list-inside list-disc space-y-2">
                <li v-for="result in results" :key="result.id">
                    <div class="inline-flex items-center justify-between gap-2">
                        <Button
                            v-if="!result.imported"
                            @click="importShow(result)"
                            :disabled="importingShowId === result.id"
                        >
                            <i-svg-spinners-180-ring-with-bg class="size-4" v-if="importingShowId === result.id" />
                            Import
                        </Button>
                        <span v-else>[Imported]</span>
                        <a
                            :href="TMDB.showUrl(result)"
                            target="_blank"
                            class="text-blue-500 hover:text-blue-700 hover:underline"
                        >
                            {{ result.name }}
                            <span v-if="result.first_air_date">
                                ({{ new Date(result.first_air_date).getFullYear() }})
                            </span>
                        </a>
                    </div>
                </li>
            </ul>
            <p v-else>No results found</p>
        </template>
    </Page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import Catalog from '@/services/Catalog';
import type { TMDBShow } from '@/services/TMDB';
import TMDB from '@/services/TMDB';

const query = ref('');
const importingShowId = ref<number | null>(null);
const results = ref<(TMDBShow & { imported: boolean })[] | null>(null);

async function search() {
    const trimmedQuery = query.value.trim();

    if (trimmedQuery.length === 0) {
        return;
    }

    const tmdbShows = await TMDB.searchShows(trimmedQuery);

    results.value = tmdbShows.map((show) => ({
        ...show,
        imported: Catalog.shows.some((s) => s.externalUrls.includes(TMDB.showUrl(show))),
    }));
}

async function importShow(show: TMDBShow) {
    importingShowId.value = show.id;
    await Catalog.importFromTMDB(show, { watchingStatus: 'watching' });
    importingShowId.value = null;

    results.value =
        results.value?.map((result) => ({
            ...result,
            imported: result.id === show.id ? true : result.imported,
        })) ?? null;
}
</script>
