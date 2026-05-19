<template>
    <li>
        <Button variant="secondary" route="shows.show" :route-params="{ show: show.slug }" class="w-full">
            <i-lucide-eye v-if="show.watchingStatus === 'watching'" />
            <i-lucide-clock v-else-if="show.watchingStatus === 'pending'" />
            <i-lucide-check v-else-if="show.watchingStatus === 'completed'" />
            <i-lucide-eye-closed v-else-if="show.watchingStatus === 'dropped'" />
            {{ show.name }} ({{ upcomingEpisodes?.length ?? '?' }})
        </Button>
    </li>
</template>

<script setup lang="ts">
import { computedModelAttribute } from '@aerogel/plugin-solid';
import { computed } from 'vue';

import Episode from '@/models/Episode';
import type Show from '@/models/Show';

const { show } = defineProps<{ show: Show }>();
const pendingEpisodeDates = computedModelAttribute(show, 'pendingEpisodeDates');
const upcomingEpisodes = computed(() => pendingEpisodeDates.value?.filter((date) => date && Episode.isUpcoming(date)));
</script>
