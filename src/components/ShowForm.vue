<template>
    <div class="relative rounded-lg bg-white p-4 shadow-sm sm:p-6">
        <Form class="space-y-3" :form @submit="save">
            <Select
                name="status"
                :label="$t('shows.form.status')"
                :options="watchStatuses"
                :render-option="(status) => $t(`shows.status.${status}`)"
            />

            <Input name="name" :label="$t('shows.form.name')" />
            <TextArea name="description" :label="$t('shows.form.description')" rows="3" />
            <Input name="imageUrl" :label="$t('shows.form.image_url')" />

            <!-- External URLs section -->
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <h3 class="text-base font-medium">
                        {{ $t('shows.form.external_urls') }}
                    </h3>
                </div>

                <div class="space-y-2">
                    <div v-for="(url, index) in externalUrls" :key="index" class="flex items-center gap-2">
                        <Input
                            v-model="externalUrls[index]"
                            class="flex-1"
                            :placeholder="$t('shows.form.url_placeholder')"
                        />
                        <button
                            type="button"
                            class="shrink-0 text-red-500 hover:text-red-700"
                            @click="removeExternalUrl(index)"
                        >
                            <i-mdi-close class="size-4" />
                        </button>
                    </div>

                    <button
                        type="button"
                        class="inline-flex items-center rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        @click="addExternalUrl"
                    >
                        <i-mdi-plus class="mr-1 size-3.5" />
                        {{ $t('shows.form.add_url') }}
                    </button>
                </div>
            </div>

            <!-- Seasons section -->
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <h3 class="text-base font-medium">
                        {{ $t('shows.form.seasons') }}
                    </h3>
                    <button
                        type="button"
                        class="inline-flex items-center rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        @click="addSeason"
                    >
                        <i-mdi-plus class="mr-1 size-3.5" />
                        {{ $t('shows.form.add_season') }}
                    </button>
                </div>

                <details
                    v-for="(season, seasonKey) in seasons"
                    :key="seasonKey"
                    class="group rounded border border-gray-200"
                >
                    <summary
                        class="flex cursor-pointer items-center justify-between p-2 transition-colors hover:bg-gray-50 sm:p-3"
                    >
                        <h4 class="flex items-center text-sm font-medium">
                            <i-mdi-chevron-right
                                class="mr-1.5 size-4 transform transition-transform group-open:rotate-90"
                            />
                            {{ $t('shows.form.season') }} {{ season.number }}
                            <span class="ml-1.5 text-xs text-gray-500">
                                ({{ season.episodes?.length || 0 }} {{ $t('shows.show.episodes') }})
                            </span>
                        </h4>
                        <div class="flex items-center">
                            <button
                                type="button"
                                class="shrink-0 text-red-500 hover:text-red-700"
                                @click.prevent="removeSeason(season)"
                            >
                                <i-mdi-delete class="size-4" />
                            </button>
                        </div>
                    </summary>

                    <div class="border-t border-gray-200 p-2 sm:p-3">
                        <div class="space-y-2">
                            <div
                                v-for="(episode, episodeKey) in season.episodes"
                                :key="episodeKey"
                                class="mb-2 space-y-2 border-b border-gray-100 pb-2 last:mb-0 last:border-0 last:pb-0"
                            >
                                <div class="flex items-center gap-1.5">
                                    <span class="text-xs text-gray-500">{{ episode.number }}.</span>
                                    <input
                                        v-model="episode.name"
                                        class="flex-1 rounded border-gray-300 text-xs focus:border-[#ff4081] focus:ring-[#ff4081]"
                                        :placeholder="$t('shows.form.episode_name')"
                                    >
                                    <button
                                        type="button"
                                        class="shrink-0 text-red-500 hover:text-red-700"
                                        @click="removeEpisode(season, episode)"
                                    >
                                        <i-mdi-close class="size-4" />
                                    </button>
                                </div>

                                <div class="space-y-2 pl-5">
                                    <textarea
                                        v-model="episode.description"
                                        class="w-full rounded border-gray-300 text-xs focus:border-[#ff4081] focus:ring-[#ff4081]"
                                        :placeholder="$t('shows.form.episode_description')"
                                        rows="2"
                                    />

                                    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <input
                                            v-model="episode.duration"
                                            class="rounded border-gray-300 text-xs focus:border-[#ff4081] focus:ring-[#ff4081]"
                                            :placeholder="$t('shows.form.episode_duration')"
                                        >

                                        <input
                                            v-model="episode.publishedAt"
                                            type="date"
                                            class="rounded border-gray-300 text-xs focus:border-[#ff4081] focus:ring-[#ff4081]"
                                        >
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                class="inline-flex items-center text-xs text-[#ff4081] hover:text-[#d81b60]"
                                @click="addEpisode(season)"
                            >
                                <i-mdi-plus class="mr-1 size-3.5" />
                                {{ $t('shows.form.add_episode') }}
                            </button>
                        </div>
                    </div>
                </details>
            </div>

            <div class="flex flex-wrap justify-end gap-3 pt-1">
                <Button variant="secondary" class="py-1.5" @click="$emit('cancel')">
                    {{ $t('shows.form.cancel') }}
                </Button>
                <Button submit class="py-1.5">
                    {{ show ? $t('shows.form.update') : $t('shows.form.create') }}
                </Button>
            </div>
        </Form>

        <div class="absolute -right-2 -bottom-2 rotate-15 transform text-3xl">
            📺
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, shallowRef } from 'vue';
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
    imageUrl: stringInput(show?.imageUrl ?? ''),
    status: enumInput(watchStatuses, show?.status ?? 'pending'),
});
const seasons = shallowRef<Season[]>(show?.seasons ?? []);
const externalUrls = ref<string[]>(show?.externalUrls ?? []);

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

    seasons.value = seasons.value.slice(0);
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
    seasons.value = seasons.value.slice(0);
}

function addExternalUrl() {
    externalUrls.value.push('');
}

function removeExternalUrl(index: number) {
    externalUrls.value.splice(index, 1);
}

async function save() {
    UI.loading(translate('shows.form.saving'), async () => {
        const updatedShow = show ?? new Show();
        const { status, ...attributes } = form.data();

        updatedShow.setAttributes({
            ...attributes,
            imageUrl: attributes.imageUrl || null,
        });

        // Set external URLs
        updatedShow.externalUrls = externalUrls.value.filter((url) => url.trim() !== '');

        // Create or update the WatchAction
        const watchAction = updatedShow.watchAction ?? updatedShow.relatedWatchAction.attach();

        watchAction.status = status ?? undefined;

        // Handle seasons
        for (const season of seasons.value) {
            updatedShow.relatedSeasons.attach(season);
        }

        if (!updatedShow.exists()) {
            updatedShow.mintUrl();
        }

        await Promise.all(updatedShow.episodes?.map((episode) => episode.save()) ?? []);
        await updatedShow.save();

        emit('saved', updatedShow);
    });
}
</script>
