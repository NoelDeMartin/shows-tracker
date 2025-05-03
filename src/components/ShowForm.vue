<template>
    <div class="relative rounded-2xl bg-white p-8 shadow-lg">
        <Form class="space-y-4" :form @submit="save">
            <Input name="name" :label="$t('shows.form.name')" />
            <TextArea name="description" :label="$t('shows.form.description')" rows="4" />

            <!-- Seasons section -->
            <div class="space-y-2">
                <h3 class="text-lg font-medium">
                    {{ $t('shows.form.seasons') }}
                </h3>
                <div
                    v-for="(season, seasonKey) in seasons"
                    :key="seasonKey"
                    class="rounded-lg border border-gray-200 p-4"
                >
                    <div class="mb-2 flex items-center justify-between">
                        <h4 class="font-medium">
                            {{ $t('shows.form.season') }} {{ season.number }}
                        </h4>
                        <button type="button" class="text-red-500 hover:text-red-700" @click="removeSeason(season)">
                            <i-mdi-delete class="size-5" />
                        </button>
                    </div>

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

                <button
                    type="button"
                    class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    @click="addSeason"
                >
                    <i-mdi-plus class="mr-1 size-4" />
                    {{ $t('shows.form.add_season') }}
                </button>
            </div>

            <Input
                name="rating"
                min="0"
                max="5"
                step="0.5"
                :label="$t('shows.form.rating')"
            />

            <Checkbox name="completed" :label="$t('shows.form.completed')" />

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
import { onMounted, shallowRef } from 'vue';
import { UI, booleanInput, numberInput, requiredStringInput, stringInput, useForm } from '@aerogel/core';

import Show from '@/models/Show';
import Season from '@/models/Season';
import type Episode from '@/models/Episode';

const { show } = defineProps<{ show?: Show }>();
const emit = defineEmits<{
    saved: [show: Show];
    cancel: [];
}>();

const form = useForm({
    name: requiredStringInput(show?.name ?? ''),
    description: stringInput(show?.description ?? ''),
    rating: numberInput(show?.rating ?? 0),
    completed: booleanInput(show?.completed ?? false),
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
    UI.loading('Saving...', async () => {
        const updatedShow = show ?? new Show();
        const { completed, rating, ...data } = form.data();

        updatedShow.completed = completed ?? false;
        updatedShow.rating = rating ?? null;
        updatedShow.setAttributes(data);

        // TODO implement updatedShow.relatedSeasons.sync(seasons.value);
        for (const season of seasons.value) {
            updatedShow.relatedSeasons.attach(season);
        }

        await updatedShow.save();

        emit('saved', updatedShow);
    });
}

onMounted(async () => {
    seasons.value = (await show?.loadRelationIfUnloaded('seasons')) ?? [];

    await Promise.all(seasons.value.map((season) => season.loadRelationIfUnloaded('episodes')));
});
</script>
