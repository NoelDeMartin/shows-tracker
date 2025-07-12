<template>
    <Page>
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-xl font-bold">
                {{ $t('shows.index.title') }}
            </h2>
            <div v-if="shows.length > 0" class="flex gap-2">
                <ShowsSearchButton />
                <ShowsUpdateButton />
                <Button route="shows.import" variant="secondary" class="py-1.5">
                    <i-mdi-import class="size-4" />
                    <span class="hidden sm:block">{{ $t('shows.actions.import') }}</span>
                </Button>
                <Button route="shows.create" class="py-1.5">
                    <i-mdi-plus class="size-4" />
                    <span class="hidden sm:block">{{ $t('shows.actions.add') }}</span>
                </Button>
            </div>
        </div>

        <div v-if="shows.length === 0" class="rounded-lg border-2 border-dashed p-6 text-center">
            <i-mdi-television-off class="mx-auto mb-3 size-14 text-gray-400" />
            <p class="mb-3 text-base">
                {{ $t('shows.index.empty') }}
            </p>
            <div class="flex flex-col justify-center gap-3 sm:flex-row">
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
                <Button
                    variant="secondary"
                    class="transform transition-transform duration-300 hover:scale-105"
                    route="shows.import"
                >
                    {{ $t('shows.actions.import') }}
                </Button>
            </div>
        </div>

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <template v-for="(show, index) in shows" :key="index">
                <HeadlessButton
                    v-if="show.slug"
                    class="relative cursor-pointer overflow-hidden rounded-lg border border-[#e0e0ff] bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-[#ff4081] hover:shadow-md"
                    route="shows.show"
                    :route-params="{ show: show.slug }"
                >
                    <!-- Top colorful border -->
                    <div class="h-1 w-full bg-gradient-to-r from-[#ff4081] via-[#7e57c2] to-[#ffca28]" />

                    <div class="p-3">
                        <!-- Header with title and status icon -->
                        <div class="mb-2 flex items-start justify-between">
                            <h3 class="text-base font-semibold break-words">
                                {{ show.name }}
                            </h3>
                            <div
                                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
                                :class="`bg-status-${show.status}`"
                                :title="$t(`shows.status.${show.status}`)"
                            >
                                <i-mdi-eye v-if="show.status === 'watching'" class="size-3.5" />
                                <i-mdi-check-circle v-else-if="show.status === 'completed'" class="size-3.5" />
                                <i-mdi-close-circle v-else-if="show.status === 'dropped'" class="size-3.5" />
                                <i-mdi-calendar-clock v-else-if="show.status === 'pending'" class="size-3.5" />
                            </div>
                        </div>

                        <!-- Show details with image and metadata -->
                        <div class="flex gap-3">
                            <!-- Show image if available -->
                            <div v-if="show.imageUrl" class="h-[120px] w-[80px] flex-shrink-0">
                                <ShowImage :src="show.imageUrl" class="h-full w-full rounded-md object-cover" />
                            </div>

                            <div class="flex-1 overflow-hidden">
                                <p v-if="show.description" class="line-clamp-2 text-xs text-gray-600">
                                    {{ show.description }}
                                </p>

                                <div class="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                                    <span v-if="show.seasons?.length" class="flex items-center gap-0.5">
                                        <i-mdi-television class="size-3.5" />
                                        {{ $t('shows.show.seasons_count', show.seasons.length) }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Next Unwatched Episode Section -->
                        <div v-if="show.nextEpisode" class="mt-2 rounded-md border border-blue-100 bg-blue-50 p-2">
                            <div class="flex flex-wrap items-start justify-between gap-2">
                                <div class="flex-1">
                                    <p class="text-xs font-medium text-blue-700">
                                        {{ $t('shows.episode.next_to_watch') }}:
                                    </p>
                                    <p class="text-xs break-words text-blue-600">
                                        {{ show.nextEpisode.shortName }}: {{ show.nextEpisode.name }}
                                    </p>
                                </div>
                                <button
                                    class="ml-1 shrink-0 rounded bg-green-500 px-2 py-1 text-xs font-medium text-white hover:bg-green-600"
                                    @click.stop.prevent="show.nextEpisode.watch()"
                                >
                                    {{ $t('shows.episode.mark_as_watched') }}
                                </button>
                            </div>
                        </div>
                        <div v-else class="mt-2 rounded-md border border-green-100 bg-green-50 p-2">
                            <p class="text-xs text-green-600">
                                {{ $t('shows.episode.all_watched') }}
                            </p>
                        </div>
                    </div>
                </HeadlessButton>
            </template>
        </div>
    </Page>
</template>

<script setup lang="ts">
import { useModelCollection } from '@aerogel/plugin-soukai';

import SearchShowModal from '@/components/modals/SearchShowModal.vue';
import Show from '@/models/Show';

const shows = useModelCollection(Show);
</script>
