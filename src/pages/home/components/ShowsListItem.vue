<template>
    <li>
        <Button variant="secondary" route="shows.show" :route-params="{ show: show.slug }" class="w-full">
            {{ show.name }} ({{ upcomingEpisodes?.length ?? '?' }})
        </Button>
    </li>
</template>

<script setup lang="ts">
import { computedModelAttribute } from '@aerogel/plugin-solid';
import { DAY_MILLISECONDS } from '@noeldemartin/utils';
import { computed } from 'vue';

import type Show from '@/models/Show';

const { show } = defineProps<{ show: Show }>();
const THRESHOLD = Date.now() + DAY_MILLISECONDS;
const pendingEpisodeDates = computedModelAttribute(show, 'pendingEpisodeDates');
const upcomingEpisodes = computed(() =>
    pendingEpisodeDates.value?.filter((date) => date && date.getTime() < THRESHOLD),
);
</script>
