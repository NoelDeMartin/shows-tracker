<template>
    <details :open class="group overflow-hidden rounded-md border border-gray-200">
        <summary
            class="flex cursor-pointer items-center justify-between bg-gray-50 px-3 py-2 transition-colors hover:bg-gray-100"
        >
            <h4 class="flex items-center text-sm font-medium">
                <i-mdi-chevron-right class="mr-1.5 size-4 transform transition-transform group-open:rotate-90" />
                {{ $t('shows.show.season') }} {{ season.number }}
                <span class="ml-1.5 text-xs text-gray-500">
                    ({{ episodes.length }} {{ $t('shows.show.episodes') }})
                </span>
                <span
                    v-if="watchedEpisodesLength > 0"
                    class="ml-1.5 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800"
                >
                    {{ watchedEpisodesLength }}/{{ episodes.length }}
                    {{ $t('shows.episode.watched') }}
                </span>
            </h4>
            <button
                v-if="episodes.length && watchedEpisodesLength < episodes.length"
                class="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-100"
                :title="$t('shows.season.mark_all_watched')"
                @click.prevent="episodes.forEach((episode) => episode.watch())"
            >
                {{ $t('shows.season.mark_all_watched') }}
            </button>
        </summary>

        <ul v-if="episodes.length" class="divide-y divide-gray-100">
            <li v-for="episode in episodes" :key="episode.id" class="p-2.5 transition-colors hover:bg-gray-50">
                <div>
                    <div class="flex items-center justify-between">
                        <h5 class="flex items-center gap-1.5 text-sm font-medium">
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
                                <i-mdi-check-circle-outline v-if="!episode.watchAction" class="size-4" />
                                <i-mdi-check-circle v-else class="size-4" />
                            </button>
                            <span class="text-gray-500">{{ episode.number }}.</span>
                            {{ episode.name }}
                        </h5>

                        <div class="flex items-center gap-2 text-xs text-gray-500">
                            <div v-if="episode.duration" class="flex items-center gap-0.5">
                                <i-mdi-clock-outline class="size-3.5" />
                                {{ renderHumanReadableDuration(parseISO8601Duration(episode.duration) ?? {}) }}
                            </div>

                            <div v-if="episode.publishedAt" class="flex items-center gap-0.5">
                                <i-mdi-calendar class="size-3.5" />
                                {{ formatDate(episode.publishedAt) }}
                            </div>
                        </div>
                    </div>

                    <div v-if="episode.description" class="mt-1 text-xs text-gray-600">
                        {{ episode.description }}
                    </div>
                </div>
            </li>
        </ul>

        <div v-else class="p-2.5 text-xs text-gray-500">
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
