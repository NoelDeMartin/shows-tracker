<template>
    <details :open class="group overflow-hidden rounded-lg border border-gray-200">
        <summary
            class="flex cursor-pointer items-center justify-between bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100"
        >
            <h4 class="flex items-center font-medium">
                <i-mdi-chevron-right class="mr-2 size-5 transform transition-transform group-open:rotate-90" />
                {{ $t('shows.show.season') }} {{ season.number }}
                <span class="ml-2 text-sm text-gray-500">
                    ({{ episodes.length }} {{ $t('shows.show.episodes') }})
                </span>
                <span
                    v-if="watchedEpisodesLength > 0"
                    class="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                >
                    {{ watchedEpisodesLength }}/{{ episodes.length }}
                    {{ $t('shows.episode.watched') }}
                </span>
            </h4>
            <button
                v-if="episodes.length && watchedEpisodesLength < episodes.length"
                class="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                :title="$t('shows.season.mark_all_watched')"
                @click.prevent="episodes.forEach((episode) => episode.watch())"
            >
                {{ $t('shows.season.mark_all_watched') }}
            </button>
        </summary>

        <ul v-if="episodes.length" class="divide-y divide-gray-100">
            <li v-for="episode in episodes" :key="episode.id" class="p-4 transition-colors hover:bg-gray-50">
                <div>
                    <div class="flex items-center justify-between">
                        <h5 class="flex items-center gap-2 font-medium">
                            <button
                                class="flex items-center justify-center rounded-full transition-colors"
                                :class="
                                    episode.watchAction
                                        ? 'text-green-500 hover:text-green-600'
                                        : 'text-gray-300 hover:text-gray-400'
                                "
                                :title="
                                    episode.watchAction
                                        ? $t('shows.episode.watched_on', {
                                            date: formatDate(episode.watchAction.date),
                                        })
                                        : $t('shows.episode.mark_as_watched')
                                "
                                @click="episode.toggle()"
                            >
                                <i-mdi-check-circle-outline v-if="!episode.watchAction" class="size-5" />
                                <i-mdi-check-circle v-else class="size-5" />
                            </button>
                            <span class="text-gray-500">{{ episode.number }}.</span>
                            {{ episode.name }}
                        </h5>

                        <div class="flex items-center gap-3 text-sm text-gray-500">
                            <div v-if="episode.duration" class="flex items-center gap-1">
                                <i-mdi-clock-outline class="size-4" />
                                {{ renderHumanReadableDuration(parseISO8601Duration(episode.duration) ?? {}) }}
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
    </details>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { computedModels } from '@aerogel/plugin-soukai';

import Episode from '@/models/Episode';
import { parseISO8601Duration, renderHumanReadableDuration } from '@/utils/iso8601';
import type Season from '@/models/Season';

const { season } = defineProps<{
    season: Season;
    open?: boolean;
}>();
const episodes = computedModels(Episode, () => season.sortedEpisodes);
const watchedEpisodesLength = computed(() => episodes.value.filter((episode) => episode.watched).length);

function formatDate(date: Date | undefined): string {
    if (!date) {
        return '';
    }

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
</script>
