<template>
    <Page>
        <div class="mb-6 flex items-center justify-between">
            <h2 class="text-2xl font-bold">
                {{ show.name }}
            </h2>
            <div class="flex gap-2">
                <Button variant="secondary" route="shows.edit" :route-params="{ show: show.slug }">
                    <i-mdi-pencil class="size-4" />
                    {{ $t('shows.actions.edit') }}
                </Button>
                <Button variant="danger" @click="deleteShow()">
                    <i-mdi-delete class="size-4" />
                    {{ $t('shows.actions.delete') }}
                </Button>
            </div>
        </div>

        <div class="rounded-xl bg-white p-6 shadow-md">
            <div v-if="show.description" class="mb-6">
                <h3 class="mb-2 text-lg font-medium">
                    {{ $t('shows.show.description') }}
                </h3>
                <p class="text-gray-700">
                    {{ show.description }}
                </p>
            </div>

            <div v-if="show.seasons?.length" class="mb-6">
                <h3 class="mb-4 text-lg font-medium">
                    {{ $t('shows.show.seasons') }} ({{ show.seasons.length }})
                </h3>

                <div class="space-y-6">
                    <div
                        v-for="season in sortedSeasons"
                        :key="season.id"
                        class="overflow-hidden rounded-lg border border-gray-200"
                    >
                        <div class="border-b border-gray-200 bg-gray-50 px-4 py-3">
                            <h4 class="font-medium">
                                {{ $t('shows.show.season') }} {{ season.number }}
                            </h4>
                        </div>

                        <ul v-if="season.episodes?.length" class="divide-y divide-gray-100">
                            <li
                                v-for="episode in sortedEpisodes(season)"
                                :key="episode.id"
                                class="p-4 transition-colors hover:bg-gray-50"
                            >
                                <div>
                                    <div class="flex items-center justify-between">
                                        <h5 class="flex items-center gap-2 font-medium">
                                            <span class="text-gray-500">{{ episode.number }}.</span>
                                            {{ episode.name }}
                                        </h5>

                                        <div class="flex items-center gap-3 text-sm text-gray-500">
                                            <div v-if="episode.duration" class="flex items-center gap-1">
                                                <i-mdi-clock-outline class="size-4" />
                                                {{
                                                    renderHumanReadableDuration(
                                                        parseISO8601Duration(episode.duration) ?? {}
                                                    )
                                                }}
                                            </div>

                                            <div v-if="episode.publishedAt" class="flex items-center gap-1">
                                                <i-mdi-calendar class="size-4" />
                                                {{ formatDate(episode.publishedAt) }}
                                            </div>
                                        </div>
                                    </div>

                                    <div v-if="episode.description" class="mt-2 text-sm text-gray-600">
                                        {{ episode.description }}
                                    </div>
                                </div>
                            </li>
                        </ul>

                        <div v-else class="p-4 text-sm text-gray-500">
                            {{ $t('shows.show.no_episodes') }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid gap-6 md:grid-cols-2">
                <div v-if="show.rating" class="flex items-center gap-2">
                    <h3 class="text-lg font-medium">
                        {{ $t('shows.show.rating') }}:
                    </h3>
                    <div class="flex items-center text-[#ffca28]">
                        <i-mdi-star v-for="i in Math.floor(show.rating)" :key="i" class="size-6" />
                        <i-mdi-star-half v-if="show.rating % 1 !== 0" class="size-6" />
                        <span class="ml-1 text-lg font-medium text-gray-900"> {{ show.rating }}/5 </span>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <h3 class="text-lg font-medium">
                        {{ $t('shows.show.status') }}:
                    </h3>
                    <span
                        class="rounded-full px-3 py-1 text-sm font-medium text-white"
                        :class="
                            show.completed
                                ? 'bg-gradient-to-r from-[#66bb6a] to-[#43a047]'
                                : 'bg-gradient-to-r from-[#42a5f5] to-[#2196f3]'
                        "
                    >
                        {{ show.completed ? $t('shows.status.completed') : $t('shows.status.watching') }}
                    </span>
                </div>
            </div>
        </div>
    </Page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { Router } from '@aerogel/plugin-routing';
import { UI, translate } from '@aerogel/core';

import { parseISO8601Duration, renderHumanReadableDuration } from '@/utils/iso8601';
import type Show from '@/models/Show';
import type Season from '@/models/Season';

const { show } = defineProps<{ show: Show }>();

const sortedSeasons = computed(() => {
    if (!show.seasons) return [];

    return [...show.seasons].sort((a, b) => (a.number || 0) - (b.number || 0));
});

function sortedEpisodes(season: Season) {
    if (!season.episodes) return [];

    return [...season.episodes].sort((a, b) => (a.number || 0) - (b.number || 0));
}

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

async function deleteShow() {
    if (
        !(await UI.confirm(translate('shows.show.delete_confirm'), {
            acceptText: translate('shows.show.delete_confirmAccept'),
            acceptVariant: 'danger',
        }))
    ) {
        return;
    }

    await show.delete();
    await Router.push({ name: 'shows.index' });
}

onMounted(async () => {
    await show.loadRelationIfUnloaded('seasons');

    if (show.seasons) {
        for (const season of show.seasons) {
            await season.loadRelationIfUnloaded('episodes');
        }
    }
});
</script>
