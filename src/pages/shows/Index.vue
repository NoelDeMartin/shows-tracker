<template>
    <Page>
        <div class="mb-6 flex items-center justify-between">
            <h2 class="flex items-center text-2xl font-bold">
                {{ $t('shows.index.title') }}
            </h2>
            <div class="flex gap-2">
                <Button variant="secondary" @click="$ui.modal(SearchShowModal)">
                    <i-mdi-magnify class="size-4" />
                    {{ $t('shows.actions.search') }}
                </Button>
                <Button v-if="shows.length > 0" route="shows.create">
                    <i-mdi-plus class="size-4" />
                    {{ $t('shows.actions.add') }}
                </Button>
            </div>
        </div>

        <div v-if="shows.length === 0" class="rounded-lg border-2 border-dashed p-8 py-8 text-center">
            <i-mdi-television-off class="mx-auto mb-4 size-16 text-gray-400" />
            <p class="mb-4 text-lg">
                {{ $t('shows.index.empty') }}
            </p>
            <div class="flex flex-col justify-center gap-4 sm:flex-row">
                <Button class="transform transition-transform duration-300 hover:scale-105" route="shows.create">
                    {{ $t('shows.index.add_first') }}
                </Button>
                <Button
                    variant="secondary"
                    class="transform transition-transform duration-300 hover:scale-105"
                    @click="$ui.modal(SearchShowModal)"
                >
                    {{ $t('shows.actions.search') }}
                </Button>
            </div>
        </div>

        <div v-else class="grid gap-6 md:grid-cols-2">
            <HeadlessButton
                v-for="show in shows"
                :key="show.slug"
                class="relative cursor-pointer overflow-hidden rounded-xl border-2 border-[#e0e0ff] bg-white p-5 shadow-md transition-all duration-300 after:absolute after:top-0 after:left-0 after:h-1 after:w-full after:bg-gradient-to-r after:from-[#ff4081] after:via-[#7e57c2] after:to-[#ffca28] hover:-translate-y-1 hover:border-[#ff4081] hover:shadow-lg"
                route="shows.show"
                :route-params="{ show: show.slug }"
            >
                <div class="flex items-start justify-between">
                    <h3 class="text-xl font-semibold">
                        {{ show.name }}
                    </h3>
                    <span
                        class="rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm"
                        :class="`bg-status-${show.status}`"
                    >
                        {{ $t(`shows.status.${show.status}`) }}
                    </span>
                </div>

                <p v-if="show.description" class="mt-2 line-clamp-2 text-gray-600">
                    {{ show.description }}
                </p>

                <div class="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    <span v-if="show.seasons?.length" class="flex items-center gap-1">
                        <i-mdi-television class="size-4" />
                        {{ $t('shows.show.seasons_count', show.seasons.length) }}
                    </span>
                </div>

                <!-- Next Unwatched Episode Section -->
                <div v-if="show.nextEpisode" class="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <h4 class="mb-1 font-medium text-blue-700">
                        {{ $t('shows.episode.next_to_watch') }}:
                    </h4>
                    <div class="flex items-center justify-between">
                        <p class="text-sm text-blue-600">
                            {{ show.nextEpisode.shortName }}: {{ show.nextEpisode.name }}
                        </p>
                        <button
                            class="rounded-md bg-green-500 px-3 py-1 text-xs font-medium text-white hover:bg-green-600"
                            @click.stop.prevent="show.nextEpisode.watch()"
                        >
                            {{ $t('shows.episode.mark_as_watched') }}
                        </button>
                    </div>
                </div>
                <div v-else class="mt-3 rounded-lg border border-green-100 bg-green-50 p-3">
                    <p class="text-sm text-green-600">
                        {{ $t('shows.episode.all_watched') }}
                    </p>
                </div>
            </HeadlessButton>
        </div>
    </Page>
</template>

<script setup lang="ts">
import { useModelCollection } from '@aerogel/plugin-soukai';

import SearchShowModal from '@/components/modals/SearchShowModal.vue';
import Show from '@/models/Show';

const shows = useModelCollection(Show);
</script>
