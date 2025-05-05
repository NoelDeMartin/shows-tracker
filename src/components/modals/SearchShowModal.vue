<template>
    <HeadlessModal v-slot="{ close }" class="relative z-50">
        <HeadlessModalOverlay class="fixed inset-0 bg-black/30" />
        <HeadlessModalContent
            class="fixed top-16 left-1/2 z-10 w-full max-w-md -translate-x-1/2 overflow-hidden rounded-lg bg-white shadow-md"
        >
            <div class="relative border-b border-gray-200">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <i-mdi-magnify class="size-4 text-gray-400" />
                </div>
                <input
                    v-model="searchQuery"
                    type="search"
                    class="block w-full border-0 bg-transparent p-3 pl-10 text-gray-900 placeholder:text-gray-500 focus:ring-0"
                    :placeholder="$t('shows.search.placeholder')"
                    autofocus
                    @keydown.esc="() => close()"
                    @input="debouncedSearch"
                >
                <button
                    type="button"
                    class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                    @click="() => close()"
                >
                    <i-mdi-close class="size-4" />
                </button>
            </div>

            <div class="max-h-[70vh] overflow-y-auto">
                <div v-if="isLoading" class="flex items-center justify-center p-6">
                    <div class="h-6 w-6 animate-spin rounded-full border-3 border-gray-200 border-t-[#ff4081]" />
                </div>

                <div v-else-if="error" class="p-3 text-center text-sm text-red-500">
                    {{ error }}
                </div>

                <div
                    v-else-if="searchResults.length === 0 && searchQuery.length > 0"
                    class="p-3 text-center text-sm text-gray-500"
                >
                    {{ $t('shows.search.no_results') }}
                </div>

                <div v-else-if="searchResults.length > 0">
                    <div class="divide-y divide-gray-100">
                        <div v-for="show in searchResults" :key="show.id" class="p-3">
                            <div class="flex items-start justify-between">
                                <div class="flex gap-2">
                                    <img
                                        v-if="show.poster_path"
                                        :src="$tmdb.showImageUrl(show)"
                                        :alt="show.name"
                                        class="h-16 w-12 rounded object-cover"
                                    >
                                    <div>
                                        <h3 class="text-sm font-medium">
                                            {{ show.name }}
                                        </h3>
                                        <p v-if="show.overview" class="mt-0.5 line-clamp-2 text-xs text-gray-600">
                                            {{ show.overview }}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    v-if="!isShowAdded(show)"
                                    class="ml-2 inline-flex shrink-0 items-center rounded-full bg-pink-500 px-2 py-0.5 text-xs font-medium text-white hover:bg-pink-600"
                                    @click="addShow(show, close)"
                                >
                                    <i-mdi-plus class="mr-0.5 size-3.5" />
                                    {{ $t('shows.search.add_to_my_shows') }}
                                </button>
                                <span
                                    v-else
                                    class="ml-2 inline-flex shrink-0 items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                                >
                                    <i-mdi-check class="mr-0.5 size-3.5" />
                                    {{ $t('shows.search.already_added') }}
                                </span>
                            </div>

                            <div class="mt-2 flex items-center gap-3 text-xs text-gray-500">
                                <span v-if="show.number_of_seasons" class="flex items-center gap-0.5">
                                    <i-mdi-television class="size-3.5" />
                                    {{ $t('shows.show.seasons_count', show.number_of_seasons) }}
                                </span>
                                <span v-if="show.vote_average" class="flex items-center gap-0.5 text-[#ffca28]">
                                    <i-mdi-star class="size-3.5" />
                                    {{ (show.vote_average / 2).toFixed(1) }}/5
                                </span>
                                <span v-if="show.first_air_date" class="flex items-center gap-0.5">
                                    <i-mdi-calendar class="size-3.5" />
                                    {{ new Date(show.first_air_date).getFullYear() }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HeadlessModalContent>
    </HeadlessModal>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { Errors, UI, translate } from '@aerogel/core';
import { useModelCollection } from '@aerogel/plugin-soukai';

import Catalog from '@/services/Catalog';
import Show from '@/models/Show';
import TMDB from '@/services/TMDB';
import type { TMDBShow } from '@/services/TMDB';

let searchTimeout: number | null = null;
const searchQuery = ref('');
const searchResults = ref<TMDBShow[]>([]);
const isLoading = ref(false);
const error = ref('');
const shows = useModelCollection(Show);

function debouncedSearch() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    if (searchQuery.value.length < 2) {
        searchResults.value = [];
        return;
    }

    searchTimeout = window.setTimeout(() => searchShows(), 300);
}

async function searchShows() {
    if (!searchQuery.value) {
        searchResults.value = [];
        return;
    }

    isLoading.value = true;
    error.value = '';

    try {
        const results = await TMDB.searchShows(searchQuery.value);

        searchResults.value = results.filter((show) => show.name && show.overview);
    } catch (err) {
        error.value = translate('shows.search.error');

        Errors.report(err);
    } finally {
        isLoading.value = false;
    }
}

function isShowAdded(show: TMDBShow): boolean {
    const tmdbUrl = TMDB.showUrl(show);

    return shows.value.some((_show) => _show.externalUrls?.includes(tmdbUrl));
}

async function addShow(tmdbShow: TMDBShow, close: () => void) {
    close();

    await UI.loading(translate('shows.search.adding'), async () => {
        const show = await Catalog.addShow(tmdbShow);

        UI.toast(translate('shows.search.toast_added', { name: show.name }));
    });
}

onBeforeUnmount(() => searchTimeout && clearTimeout(searchTimeout));
</script>
