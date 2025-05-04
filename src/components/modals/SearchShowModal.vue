<template>
    <HeadlessModal v-slot="{ close }" class="relative z-50">
        <HeadlessModalOverlay class="fixed inset-0 bg-black/30" />
        <HeadlessModalContent
            class="fixed top-20 left-1/2 z-10 w-full max-w-md -translate-x-1/2 overflow-hidden rounded-lg bg-white shadow-xl"
        >
            <div class="relative border-b border-gray-200">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <i-mdi-magnify class="size-5 text-gray-400" />
                </div>
                <input
                    v-model="searchQuery"
                    type="search"
                    class="block w-full border-0 bg-transparent p-4 pl-10 text-gray-900 placeholder:text-gray-500 focus:ring-0"
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
                    <i-mdi-close class="size-5" />
                </button>
            </div>

            <div class="max-h-[60vh] overflow-y-auto">
                <div v-if="isLoading" class="flex items-center justify-center p-8">
                    <div class="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#ff4081]" />
                </div>

                <div v-else-if="error" class="p-4 text-center text-red-500">
                    {{ error }}
                </div>

                <div
                    v-else-if="searchResults.length === 0 && searchQuery.length > 0"
                    class="p-4 text-center text-gray-500"
                >
                    {{ $t('shows.search.no_results') }}
                </div>

                <div v-else-if="searchResults.length > 0">
                    <div class="divide-y divide-gray-100">
                        <div v-for="show in searchResults" :key="show.id" class="p-4">
                            <div class="flex items-start justify-between">
                                <h3 class="text-lg font-medium">
                                    {{ show.name }}
                                </h3>
                                <button
                                    v-if="!isShowAdded(show.id)"
                                    class="inline-flex items-center rounded-full bg-pink-500 px-3 py-1 text-xs font-medium text-white hover:bg-pink-600"
                                    @click="addShow(show, close)"
                                >
                                    <i-mdi-plus class="mr-1 size-4" />
                                    {{ $t('shows.search.add_to_my_shows') }}
                                </button>
                                <span
                                    v-else
                                    class="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
                                >
                                    <i-mdi-check class="mr-1 size-4" />
                                    {{ $t('shows.search.already_added') }}
                                </span>
                            </div>

                            <p v-if="show.overview" class="mt-1 line-clamp-2 text-sm text-gray-600">
                                {{ show.overview }}
                            </p>

                            <div class="mt-2 flex items-center gap-4 text-sm text-gray-500">
                                <span v-if="show.number_of_seasons" class="flex items-center gap-1">
                                    <i-mdi-television class="size-4" />
                                    {{ $t('shows.show.seasons_count', show.number_of_seasons) }}
                                </span>
                                <span v-if="show.vote_average" class="flex items-center gap-1 text-[#ffca28]">
                                    <i-mdi-star class="size-4" />
                                    {{ (show.vote_average / 2).toFixed(1) }}/5
                                </span>
                                <span v-if="show.first_air_date" class="flex items-center gap-1">
                                    <i-mdi-calendar class="size-4" />
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
import { UI, translate } from '@aerogel/core';
import { useModelCollection } from '@aerogel/plugin-soukai';

import Show from '@/models/Show';
import TheMovieDatabase from '@/services/TheMovieDatabase';
import { renderISO8601Duration } from '@/utils/iso8601';
import type { TMDBShow } from '@/services/TheMovieDatabase';

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
        const results = await TheMovieDatabase.searchShows(searchQuery.value);

        searchResults.value = results.filter((show) => show.name && show.overview);
    } catch (err) {
        error.value = translate('shows.search.error');
    } finally {
        isLoading.value = false;
    }
}

function getTmdbUrl(id: number): string {
    return `https://www.themoviedb.org/tv/${id}`;
}

function isShowAdded(id: number): boolean {
    const tmdbUrl = getTmdbUrl(id);
    return shows.value.some((show) => show.externalUrls?.includes(tmdbUrl));
}

async function addShow(tmdbShow: TMDBShow, close: () => void) {
    close();

    await UI.loading(translate('shows.search.adding'), async () => {
        // Fetch detailed show information including seasons
        const showDetails = await TheMovieDatabase.getShowDetails(tmdbShow.id);

        // Create the show
        const show = new Show();
        show.name = showDetails.name;
        show.description = showDetails.overview || '';
        show.externalUrls = [getTmdbUrl(showDetails.id)];

        // Create seasons and episodes
        if (showDetails.seasons && showDetails.seasons.length > 0) {
            // Filter out special seasons (like season 0)
            const regularSeasons = showDetails.seasons.filter((season) => season.season_number > 0);

            for (const tmdbSeason of regularSeasons) {
                // Create season
                const season = show.relatedSeasons.attach({ number: tmdbSeason.season_number });

                // Fetch detailed season information including episodes
                const seasonDetails = await TheMovieDatabase.getSeasonDetails(showDetails.id, tmdbSeason.season_number);

                if (seasonDetails.episodes && seasonDetails.episodes.length > 0) {
                    for (const tmdbEpisode of seasonDetails.episodes) {
                        const episode = season.relatedEpisodes.attach({
                            number: tmdbEpisode.episode_number,
                            name: tmdbEpisode.name,
                        });

                        if (tmdbEpisode.overview) {
                            episode.description = tmdbEpisode.overview;
                        }

                        // Convert runtime minutes to duration string (e.g. "42m")
                        if (tmdbEpisode.runtime) {
                            episode.duration = renderISO8601Duration({ minutes: tmdbEpisode.runtime });
                        }

                        // Set air date if available
                        if (tmdbEpisode.air_date) {
                            episode.publishedAt = new Date(tmdbEpisode.air_date);
                        }
                    }
                }
            }
        }

        await show.save();

        UI.toast(translate('shows.search.toast_added', { name: show.name }));
    });
}

onBeforeUnmount(() => searchTimeout && clearTimeout(searchTimeout));
</script>
