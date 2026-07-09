<template>
    {{ upcomingEpisodes?.length ?? '?' }}
</template>

<script setup lang="ts">
import { computedModelAttribute } from '@aerogel/plugin-solid';
import { computed } from 'vue';

import Episode from '@/models/Episode';
import type Show from '@/models/Show';

const { show } = defineProps<{ show: Show }>();
const pendingEpisodeDates = computedModelAttribute(() => show, 'pendingEpisodeDates');
const upcomingEpisodes = computed(() => pendingEpisodeDates.value?.filter((date) => date && Episode.isUpcoming(date)));
</script>
