<template>
    <Page>
        <div class="mb-6 flex items-center justify-between">
            <h2 class="flex items-center text-2xl font-bold">
                {{ $t('shows.index.title') }}
            </h2>
            <Button v-if="shows.length > 0" route="shows.create">
                <i-mdi-plus class="size-4" />
                {{ $t('shows.actions.add') }}
            </Button>
        </div>

        <div v-if="shows.length === 0" class="rounded-lg border-2 border-dashed p-8 py-8 text-center">
            <i-mdi-television-off class="mx-auto mb-4 size-16 text-gray-400" />
            <p class="mb-4 text-lg">
                {{ $t('shows.index.empty') }}
            </p>
            <Button class="inline transform transition-transform duration-300 hover:scale-105" route="shows.create">
                {{ $t('shows.index.add_first') }}
            </Button>
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
                        :class="
                            show.completed
                                ? 'bg-gradient-to-r from-[#66bb6a] to-[#43a047]'
                                : 'bg-gradient-to-r from-[#42a5f5] to-[#2196f3]'
                        "
                    >
                        {{ show.completed ? $t('shows.status.completed') : $t('shows.status.watching') }}
                    </span>
                </div>

                <p v-if="show.description" class="mt-2 line-clamp-2 text-gray-600">
                    {{ show.description }}
                </p>

                <div class="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    <span v-if="show.seasons" class="flex items-center gap-1">
                        <i-mdi-television class="size-4" />
                        {{ show.seasons }}
                        {{ show.seasons !== 1 ? $t('shows.show.seasons') : $t('shows.show.season') }}
                    </span>
                    <span v-if="show.rating" class="flex items-center gap-1 text-[#ffca28]">
                        <i-mdi-star class="size-4" />
                        {{ show.rating }}/5
                    </span>
                </div>
            </HeadlessButton>
        </div>
    </Page>
</template>

<script setup lang="ts">
import { useModelCollection } from '@aerogel/plugin-soukai';

import Show from '@/models/Show';

const shows = useModelCollection(Show);
</script>
