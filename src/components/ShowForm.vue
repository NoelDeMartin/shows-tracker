<template>
    <div class="relative rounded-2xl bg-white p-8 shadow-lg">
        <Form class="space-y-4" :form @submit="save">
            <Select
                name="status"
                :label="$t('shows.form.status')"
                :options="watchStatuses"
                :render-option="(status) => $t(`shows.status.${status}`)"
            />

            <Input name="name" :label="$t('shows.form.name')" />
            <TextArea name="description" :label="$t('shows.form.description')" rows="4" />

            <!-- Seasons section -->
            <div class="space-y-2">
                <h3 class="text-lg font-medium">
                    {{ $t('shows.form.seasons') }}
                </h3>
                <details
                    v-for="(season, seasonKey) in seasons"
                    :key="seasonKey"
                    class="group rounded-lg border border-gray-200"
                >
                    <summary
                        class="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-gray-50"
                    >
                        <h4 class="flex items-center font-medium">
                            <i-mdi-chevron-right
                                class="mr-2 size-5 transform transition-transform group-open:rotate-90"
                            />
                            {{ $t('shows.form.season') }} {{ season.number }}
                            <span class="ml-2 text-sm text-gray-500">
                                ({{ season.episodes?.length || 0 }} {{ $t('shows.show.episodes') }})
                            </span>
                        </h4>
                        <div class="flex items-center gap-2">
                            <button
                                type="button"
                                class="text-red-500 hover:text-red-700"
                                @click.prevent="removeSeason(season)"
                            >
                                <i-mdi-delete class="size-5" />
                            </button>
                        </div>
                    </summary>

                    <div class="border-t border-gray-200 p-4">
                        <div class="space-y-3">
                            <div
                                v-for="(episode, episodeKey) in season.episodes"
                                :key="episodeKey"
                                class="mb-3 space-y-3 border-b border-gray-100 pb-3 last:mb-0 last:border-0 last:pb-0"
                            >
                                <div class="flex items-center gap-2">
                                    <span class="text-gray-500">{{ episode.number }}.</span>
                                    <input
                                        v-model="episode.name"
                                        class="flex-1 rounded-md border-gray-300 text-sm focus:border-[#ff4081] focus:ring-[#ff4081]"
                                        :placeholder="$t('shows.form.episode_name')"
                                    >
                                    <button
                                        type="button"
                                        class="text-red-500 hover:text-red-700"
                                        @click="removeEpisode(season, episode)"
                                    >
                                        <i-mdi-close class="size-5" />
                                    </button>
                                </div>

                                <div class="space-y-3 pl-6">
                                    <textarea
                                        v-model="episode.description"
                                        class="w-full rounded-md border-gray-300 text-sm focus:border-[#ff4081] focus:ring-[#ff4081]"
                                        :placeholder="$t('shows.form.episode_description')"
                                        rows="2"
                                    />

                                    <div class="grid grid-cols-2 gap-3">
                                        <input
                                            v-model="episode.duration"
                                            class="rounded-md border-gray-300 text-sm focus:border-[#ff4081] focus:ring-[#ff4081]"
                                            :placeholder="$t('shows.form.episode_duration')"
                                        >

                                        <input
                                            v-model="episode.publishedAt"
                                            type="date"
                                            class="rounded-md border-gray-300 text-sm focus:border-[#ff4081] focus:ring-[#ff4081]"
                                        >
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                class="inline-flex items-center text-sm text-[#ff4081] hover:text-[#d81b60]"
                                @click="addEpisode(season)"
                            >
                                <i-mdi-plus class="mr-1 size-4" />
                                {{ $t('shows.form.add_episode') }}
                            </button>
                        </div>
                    </div>
                </details>

                <button
                    type="button"
                    class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    @click="addSeason"
                >
                    <i-mdi-plus class="mr-1 size-4" />
                    {{ $t('shows.form.add_season') }}
                </button>
            </div>

            <div class="flex justify-end gap-4">
                <Button variant="secondary" @click="$emit('cancel')">
                    {{ $t('shows.form.cancel') }}
                </Button>
                <Button submit>
                    {{ show ? $t('shows.form.update') : $t('shows.form.create') }}
                </Button>
            </div>
        </Form>

        <div class="absolute -right-4 -bottom-4 rotate-15 transform text-4xl">
            📺
        </div>
    </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';
import { UI, enumInput, requiredStringInput, stringInput, translate, useForm } from '@aerogel/core';

import Show from '@/models/Show';
import Season from '@/models/Season';
import { watchStatuses } from '@/models/WatchAction';
import type Episode from '@/models/Episode';

const { show } = defineProps<{ show?: Show }>();
const emit = defineEmits<{
    saved: [show: Show];
    cancel: [];
}>();

const form = useForm({
    name: requiredStringInput(show?.name ?? ''),
    description: stringInput(show?.description ?? ''),
    status: enumInput(watchStatuses, show?.status ?? 'pending'),
});
const seasons = shallowRef<Season[]>([]);

function addSeason() {
    const newSeason = new Season({ number: seasons.value.length + 1 });

    newSeason.setRelationModels('episodes', []);

    seasons.value = seasons.value.concat([newSeason]);
}

function removeSeason(season: Season) {
    const index = seasons.value.indexOf(season);

    if (index === -1) {
        return;
    }

    seasons.value.splice(index, 1);
    seasons.value.forEach((_season, _index) => (_season.number = _index + 1));
}

function addEpisode(season: Season) {
    if (!season.episodes) {
        throw new Error('Season episodes not loaded');
    }

    season.relatedEpisodes.attach({ number: season.episodes.length + 1 });
    seasons.value = seasons.value.slice(0);
}

function removeEpisode(season: Season, episode: Episode) {
    if (!season.episodes) {
        throw new Error('Season episodes not loaded');
    }

    season.relatedEpisodes.detach(episode);
    season.episodes.forEach((_episode, index) => (_episode.number = index + 1));
}

async function save() {
    UI.loading(translate('shows.form.saving'), async () => {
        const updatedShow = show ?? new Show();
        const { status, ...attributes } = form.data();

        updatedShow.setAttributes(attributes);

        // Create or update the WatchAction
        const watchAction = updatedShow.watchAction ?? updatedShow.relatedWatchAction.attach();

        watchAction.status = status ?? undefined;

        // Handle seasons
        for (const season of seasons.value) {
            updatedShow.relatedSeasons.attach(season);
        }

        await updatedShow.save();

        emit('saved', updatedShow);
    });
}
</script>
