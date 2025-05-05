<template>
    <Page>
        <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <h2 class="text-xl font-bold">
                    {{ show.name }}
                </h2>
                <div
                    class="flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm"
                    :class="`bg-status-${show.status}`"
                    :title="$t(`shows.status.${computedShow.status}`)"
                >
                    <i-mdi-eye v-if="show.status === 'watching'" class="size-4" />
                    <i-mdi-check-circle v-else-if="show.status === 'completed'" class="size-4" />
                    <i-mdi-close-circle v-else-if="show.status === 'dropped'" class="size-4" />
                    <i-mdi-calendar-clock v-else-if="show.status === 'pending'" class="size-4" />
                </div>
                <!-- Display status text next to icon -->
                <span class="text-sm font-medium text-gray-600">
                    {{ $t(`shows.status.${computedShow.status}`) }}
                </span>
            </div>
            <div class="flex gap-2">
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
                <div v-if="show.imageUrl" class="sm:w-1/5">
                    <img
                        :src="show.imageUrl"
                        :alt="show.name"
                        class="h-auto w-full rounded-md object-cover shadow-sm"
                        @error="onImageError"
                    >
                </div>

                <div class="flex-1">
                    <div v-if="show.description" class="mb-4">
                        <h3 class="mb-1 text-base font-medium">
                            {{ $t('shows.show.description') }}
                        </h3>
                        <p class="text-sm text-gray-700">
                            {{ show.description }}
                        </p>
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
import { computedModel } from '@aerogel/plugin-soukai';
import { Router } from '@aerogel/plugin-routing';
import { UI, translate } from '@aerogel/core';

import type Show from '@/models/Show';

const { show } = defineProps<{ show: Show }>();

// TODO fix Aerogel so that route models are reactive out of the box.
const computedShow = computedModel(() => show);

function onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
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
</script>
