<template>
    <Page>
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-xl font-bold">
                    <DropdownMenu v-if="$ui.mobile" align="end">
                        <Button
                            size="icon"
                            variant="ghost"
                            :title="$t('task.actions')"
                            :aria-label="$t('task.actions')"
                        >
                            <i-zondicons-dots-horizontal-triple class="size-5" />
                        </Button>
                        <template #options>
                            <DropdownMenuOptions>
                                <DropdownMenuOption
                                    @select="$router.push({ name: 'shows.edit', params: { show: show.slug } })"
                                >
                                    <i-mdi-pencil class="size-4" />
                                    <span>{{ $t('shows.actions.edit') }}</span>
                                </DropdownMenuOption>
                                <DropdownMenuOption @select="deleteShow()">
                                    <i-mdi-delete class="size-4" />
                                    <span>{{ $t('shows.actions.delete') }}</span>
                                </DropdownMenuOption>
                            </DropdownMenuOptions>
                        </template>
                    </DropdownMenu>
                    {{ show.name }}
                </h2>
                <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
                    :class="`bg-status-${show.status}`"
                    :title="$t(`shows.status.${computedShow.status}`)"
                >
                    <i-mdi-eye v-if="show.status === 'watching'" class="size-4" />
                    <i-mdi-check-circle v-else-if="show.status === 'completed'" class="size-4" />
                    <i-mdi-close-circle v-else-if="show.status === 'dropped'" class="size-4" />
                    <i-mdi-calendar-clock v-else-if="show.status === 'pending'" class="size-4" />
                </div>
                <!-- Display status text next to icon -->
                <span class="hidden text-sm font-medium text-gray-600 md:block">
                    {{ $t(`shows.status.${computedShow.status}`) }}
                </span>
            </div>
            <div v-if="!$ui.mobile" class="flex gap-2">
                <Button
                    variant="secondary"
                    route="shows.edit"
                    :route-params="{ show: show.slug }"
                    class="py-1.5"
                >
                    <i-mdi-pencil class="size-4" />
                    {{ $t('shows.actions.edit') }}
                </Button>
                <Button variant="danger" class="py-1.5" @click="deleteShow()">
                    <i-mdi-delete class="size-4" />
                    {{ $t('shows.actions.delete') }}
                </Button>
            </div>
        </div>

        <div class="rounded-lg bg-white p-4 shadow-sm">
            <div class="mb-4 flex flex-col gap-4 sm:flex-row">
                <!-- Show image if available -->
                <div v-if="show.imageUrl" class="mx-auto w-full max-w-[180px] sm:mx-0 sm:w-1/5">
                    <ShowImage :src="show.imageUrl" class="h-auto w-full rounded-md object-cover shadow-sm" />
                </div>

                <div class="flex-1">
                    <!-- Show Description -->
                    <div v-if="show.description" class="mb-4">
                        <h3 class="mb-1 text-base font-medium">
                            {{ $t('shows.show.description') }}
                        </h3>
                        <p class="text-sm text-gray-700">
                            {{ show.description }}
                        </p>
                    </div>

                    <!-- Show Metadata -->
                    <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <!-- Air Dates -->
                        <div v-if="show.startDate || show.endDate" class="rounded-md bg-gray-50 p-3">
                            <h4 class="mb-1 text-sm font-medium text-gray-700">
                                {{ $t('shows.show.air_dates') }}
                            </h4>
                            <div v-if="show.startDate" class="flex items-center gap-1 text-sm text-gray-600">
                                <i-mdi-calendar-start class="size-4 text-gray-500" />
                                <span>{{ $t('shows.show.start_date') }}: {{ formatDate(show.startDate) }}</span>
                            </div>
                            <div v-if="show.endDate" class="flex items-center gap-1 text-sm text-gray-600">
                                <i-mdi-calendar-end class="size-4 text-gray-500" />
                                <span>{{ $t('shows.show.end_date') }}: {{ formatDate(show.endDate) }}</span>
                            </div>
                        </div>

                        <!-- Episodes Info -->
                        <div class="rounded-md bg-gray-50 p-3">
                            <h4 class="mb-1 text-sm font-medium text-gray-700">
                                {{ $t('shows.show.episodes_info') }}
                            </h4>
                            <div class="text-sm text-gray-600">
                                <div class="flex items-center gap-1">
                                    <i-mdi-television class="size-4 text-gray-500" />
                                    <span>{{ $t('shows.show.seasons_count', show.sortedSeasons.length) }}</span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <i-mdi-movie-open class="size-4 text-gray-500" />
                                    <span>{{ $t('shows.show.total_episodes', show.episodes.length) }}</span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <i-mdi-check-circle class="size-4 text-gray-500" />
                                    <span>{{ $t('shows.show.watched_episodes', watchedEpisodesLength) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- External URLs -->
                    <div v-if="show.externalUrls && show.externalUrls.length > 0" class="mb-4">
                        <h3 class="mb-1 text-base font-medium">
                            {{ $t('shows.show.external_urls') }}
                        </h3>
                        <div class="space-y-1">
                            <div v-for="(url, index) in show.externalUrls" :key="index" class="flex items-center gap-1">
                                <i-mdi-link class="size-4 shrink-0 text-gray-500" />
                                <a
                                    :href="url"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="text-sm break-all text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    {{ getDisplayUrl(url) }}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="show.sortedSeasons.length" class="mb-4">
                <h3 class="mb-3 text-base font-medium">
                    {{ $t('shows.show.seasons') }} ({{ show.sortedSeasons.length }})
                </h3>

                <div class="space-y-2">
                    <ShowSeason
                        v-for="season in show.sortedSeasons"
                        :key="season.url"
                        :season
                        :open="season === show.nextEpisode?.season"
                    />
                </div>
            </div>
        </div>
    </Page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { computedModel } from '@aerogel/plugin-soukai';
import { Router } from '@aerogel/plugin-routing';
import { UI, translate } from '@aerogel/core';
import { urlParse } from '@noeldemartin/utils';

import { formatDate } from '@/utils/dates';
import type Show from '@/models/Show';

const DOMAINS = {
    'themoviedb.org': 'The Movie Database (TMDB)',
    'imdb.com': 'IMDB',
};

const { show } = defineProps<{ show: Show }>();
const watchedEpisodesLength = computed(() => show.episodes.filter((episode) => episode.watched).length);
const computedShow = computedModel(() => show);

function getDisplayUrl(url: string): string {
    const { domain } = urlParse(url) ?? {};

    return DOMAINS[domain as keyof typeof DOMAINS] ?? url;
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

onMounted(() => show.loadRelationsIfUnloaded());
</script>
