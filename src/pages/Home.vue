<template>
    <Page>
        <div class="mb-6 flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-xl font-bold">
                {{ $t('home.title') }}
            </h2>
            <div class="flex gap-2">
                <ShowsSearchButton />
                <ShowsUpdateButton />
            </div>
        </div>

        <!-- Shows with new episodes section -->
        <div class="mb-6">
            <div
                v-if="currentShows.length === 0"
                class="rounded-lg border border-dashed border-gray-300 p-6 text-center"
            >
                <i-mdi-television-off class="mx-auto mb-3 size-14 text-gray-400" />
                <p class="mb-2 text-gray-600">
                    {{ $t('home.no_watching_shows') }}
                </p>
                <div class="mt-3">
                    <Button route="shows.index" variant="secondary">
                        {{ $t('home.browse_shows') }}
                    </Button>
                </div>
            </div>

            <div v-else class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div
                    v-for="show in currentShows"
                    :key="show.url"
                    class="relative overflow-hidden rounded-lg border border-[#e0e0ff] bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-[#ff4081] hover:shadow-md"
                >
                    <router-link :to="{ name: 'shows.show', params: { show: show.slug } }" class="block">
                        <!-- Top colorful border -->
                        <div class="h-1 w-full bg-gradient-to-r from-[#ff4081] via-[#7e57c2] to-[#ffca28]" />

                        <div class="p-3">
                            <!-- Header with title -->
                            <div class="mb-2 flex items-start justify-between">
                                <h3 class="text-base font-semibold">
                                    {{ show.name }}
                                </h3>
                                <!-- Watching badge -->
                                <div
                                    class="bg-status-watching flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
                                >
                                    <i-mdi-eye class="size-3.5" />
                                </div>
                            </div>

                            <!-- Show details with image and metadata -->
                            <div class="flex gap-3">
                                <!-- Show image if available -->
                                <div v-if="show.imageUrl" class="h-[100px] w-[70px] flex-shrink-0">
                                    <ShowImage :src="show.imageUrl" class="h-full w-full rounded-md object-cover" />
                                </div>

                                <div class="flex-1 overflow-hidden">
                                    <div class="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                        <div class="flex items-center gap-0.5">
                                            <i-mdi-movie-open class="size-3.5" />
                                            <span>{{ $t('home.new_episodes', newEpisodes(show)) }}</span>
                                        </div>
                                    </div>

                                    <div v-if="show.nextEpisode" class="mt-2 rounded bg-blue-50 p-2">
                                        <p class="text-xs font-medium text-blue-700">
                                            {{ $t('shows.episode.next_to_watch') }}:
                                        </p>
                                        <p class="text-xs break-words text-blue-600">
                                            {{ show.nextEpisode.shortName }}: {{ show.nextEpisode.name }}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Watch button -->
                            <div class="mt-2 flex justify-end">
                                <button
                                    v-if="show.nextEpisode"
                                    class="rounded bg-green-500 px-2 py-1 text-xs font-medium text-white hover:bg-green-600"
                                    @click.prevent="show.nextEpisode.watch()"
                                >
                                    {{ $t('shows.episode.mark_as_watched') }}
                                </button>
                            </div>
                        </div>
                    </router-link>
                </div>
            </div>
            <div class="flex justify-center">
                <Link v-if="currentShows.length > 0" route="shows.index" class="flex items-center gap-1 text-sm">
                    {{ $t('home.view_all_shows') }} <i-mdi-arrow-right class="ml-0.5 size-4" />
                </Link>
            </div>
        </div>
    </Page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useModelCollection } from '@aerogel/plugin-soukai';

import Show from '@/models/Show';

const shows = useModelCollection(Show);
const currentShows = computed(() =>
    shows.value.filter((show) => show.status === 'watching' && show.nextEpisode !== null));

function newEpisodes(show: Show): number {
    return show.episodes.filter((episode) => !episode.watched).length;
}
</script>
