<template>
    <Modal v-slot="{ close }" :title="`Identify ${show.name}`" persistent>
        <form @submit.prevent="search()">
            <div class="flex gap-2">
                <Input
                    v-model="query"
                    label="Show Name"
                    label-class="sr-only"
                    placeholder="Search for a show on TMDB..."
                    class="flex-1"
                />
                <Button submit :loading="searching">
                    <i-lucide-search class="mr-1 size-4" />
                    Search
                </Button>
            </div>
        </form>

        <div class="mt-4 max-h-[60vh] overflow-y-auto pr-1">
            <div v-if="searching" class="flex justify-center py-8">
                <i-svg-spinners-180-ring-with-bg class="text-primary-600 size-8" />
            </div>

            <div v-else-if="hasSearched && results.length === 0" class="py-8 text-center text-gray-500">
                No shows found on TMDB.
            </div>

            <ul v-else class="space-y-4">
                <li
                    v-for="result in results"
                    :key="result.id"
                    class="flex gap-4 rounded-lg border border-gray-100 p-4 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50"
                >
                    <img
                        v-if="result.poster_path"
                        :src="`https://image.tmdb.org/t/p/w92${result.poster_path}`"
                        :alt="result.name"
                        class="h-20 w-14 flex-shrink-0 rounded object-cover shadow-sm"
                    />
                    <div
                        v-else
                        class="flex h-20 w-14 flex-shrink-0 items-center justify-center rounded bg-gray-100 text-gray-400 dark:bg-gray-800"
                    >
                        <i-lucide-tv class="size-6" />
                    </div>

                    <div class="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                            <div class="flex items-start justify-between gap-2">
                                <h4 class="truncate font-semibold text-gray-900 dark:text-gray-100">
                                    {{ result.name }}
                                    <span v-if="result.first_air_date" class="text-sm font-normal text-gray-500">
                                        ({{ new Date(result.first_air_date).getFullYear() }})
                                    </span>
                                </h4>
                                <a
                                    :href="TMDB.showUrl(result)"
                                    target="_blank"
                                    class="flex-shrink-0 text-xs text-blue-500 hover:underline"
                                >
                                    TMDB
                                </a>
                            </div>
                            <p class="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                                {{ result.overview || 'No description available.' }}
                            </p>
                        </div>

                        <div class="mt-2 flex justify-end">
                            <Button
                                :loading="matchingId === result.id"
                                :disabled="matchingId !== null"
                                @click="match(result)"
                            >
                                Match
                            </Button>
                        </div>
                    </div>
                </li>
            </ul>
        </div>

        <div class="mt-6 flex justify-end">
            <Button variant="secondary" type="button" @click="close()"> Cancel </Button>
        </div>
    </Modal>
</template>

<script setup lang="ts">
import { useModal, useLoading } from '@aerogel/core';
import { ref, toRaw, onMounted } from 'vue';

import type Show from '@/models/Show';
import type { TMDBShow } from '@/services/TMDB';
import TMDB from '@/services/TMDB';

const props = defineProps<{ show: Show }>();
const { close } = useModal();
const { loading: searching, run: runSearching } = useLoading();
const matchingId = ref<number | null>(null);

const query = ref(props.show.name);
const results = ref<TMDBShow[]>([]);
const hasSearched = ref(false);

async function search() {
    const trimmedQuery = query.value.trim();
    if (trimmedQuery.length === 0) {
        return;
    }
    await runSearching(async () => {
        results.value = await TMDB.searchShows(trimmedQuery);
        hasSearched.value = true;
    });
}

async function match(selectedShow: TMDBShow) {
    matchingId.value = selectedShow.id;
    try {
        const tmdbUrl = TMDB.showUrl(selectedShow);
        const otherUrls = (props.show.externalUrls ?? []).filter(
            (url) => !url.startsWith('https://www.themoviedb.org/tv/'),
        );
        await toRaw(props.show).update({
            externalUrls: [...otherUrls, tmdbUrl],
        });
        close();
    } finally {
        matchingId.value = null;
    }
}

onMounted(() => {
    search();
});
</script>
