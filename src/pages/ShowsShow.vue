<template>
    <Page>
        <div class="mb-6 rounded-lg bg-gradient-to-r from-[#ff4081] to-[#7e57c2] p-4 text-white shadow-md">
            <div class="flex items-start justify-between">
                <div>
                    <h2 class="text-3xl font-bold">
                        {{ show.name }}
                    </h2>
                    <span
                        class="mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm"
                        :class="show.completed ? 'bg-gradient-to-r from-[#66bb6a] to-[#43a047]' : 'bg-[#2196f3]'"
                    >
                        {{ show.completed ? $t('shows.status.completed') : $t('shows.status.watching') }}
                    </span>
                </div>

                <div class="flex gap-2">
                    <Button
                        variant="secondary"
                        class="transform transition-transform duration-300 hover:scale-105"
                        route="shows.edit"
                        :params="{ show: show.slug }"
                    >
                        <i-mdi-pencil class="size-4" />
                        {{ $t('shows.actions.edit') }}
                    </Button>
                    <Button
                        variant="danger"
                        class="transform transition-transform duration-300 hover:scale-105"
                        @click="deleteShow()"
                    >
                        <i-mdi-delete class="size-4" />
                        {{ $t('shows.actions.delete') }}
                    </Button>
                </div>
            </div>
        </div>

        <div
            class="relative mb-6 overflow-hidden rounded-xl border-2 border-[#e0e0ff] bg-white p-6 shadow-md transition-all duration-300 after:absolute after:top-0 after:left-0 after:h-1 after:w-full after:bg-gradient-to-r after:from-[#ff4081] after:via-[#7e57c2] after:to-[#ffca28] hover:-translate-y-1 hover:border-[#ff4081] hover:shadow-lg"
        >
            <div v-if="show.description" class="mb-4">
                <h3 class="mb-1 text-sm font-medium text-[#ff4081]">
                    {{ $t('shows.show.description') }}
                </h3>
                <p class="text-gray-800">
                    {{ show.description }}
                </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div v-if="show.seasons" class="bg-primary-50 rounded-lg p-3">
                    <h3 class="mb-1 text-sm font-medium text-[#ff4081]">
                        {{ $t('shows.show.seasons') }}
                    </h3>
                    <p class="flex items-center text-gray-800">
                        <i-mdi-television-classic class="mr-2 size-5 text-[#ff4081]" />
                        {{ show.seasons }}
                    </p>
                </div>

                <div v-if="show.episodes" class="bg-secondary-50 rounded-lg p-3">
                    <h3 class="mb-1 text-sm font-medium text-[#7e57c2]">
                        {{ $t('shows.show.episodes') }}
                    </h3>
                    <p class="flex items-center text-gray-800">
                        <i-mdi-filmstrip class="mr-2 size-5 text-[#7e57c2]" />
                        {{ show.episodes }}
                    </p>
                </div>

                <div v-if="show.rating" class="bg-accent-50 rounded-lg p-3">
                    <h3 class="mb-1 text-sm font-medium text-[#ffca28]">
                        {{ $t('shows.show.rating') }}
                    </h3>
                    <div class="flex items-center text-[#ffca28]">
                        <i-mdi-star class="mr-1 size-5" />
                        <span class="text-gray-800">{{ show.rating }}/5</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex justify-start">
            <Button
                variant="secondary"
                class="transform transition-transform duration-300 hover:scale-105"
                route="shows.index"
            >
                <i-mdi-arrow-left class="size-4" />
                {{ $t('shows.actions.back') }}
            </Button>
        </div>
    </Page>
</template>

<script setup lang="ts">
import { Router } from '@aerogel/plugin-routing';
import { UI, translate } from '@aerogel/core';

import type Show from '@/models/Show';

const { show } = defineProps<{ show: Show }>();

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
