<template>
    <Page>
        <div class="mb-6 flex items-center justify-between">
            <div class="flex gap-2">
                <h2 class="text-2xl font-bold">
                    {{ show.name }}
                </h2>
                <span class="rounded-full px-3 py-1 text-sm font-medium text-white" :class="`bg-status-${show.status}`">
                    {{ $t(`shows.status.${computedShow.status}`) }}
                </span>
            </div>
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

            <div v-if="show.sortedSeasons.length" class="mb-6">
                <h3 class="mb-4 text-lg font-medium">
                    {{ $t('shows.show.seasons') }} ({{ show.sortedSeasons.length }})
                </h3>

                <div class="space-y-4">
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
