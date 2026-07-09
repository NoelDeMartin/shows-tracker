<template>
    <li>
        <Button variant="secondary" route="shows.show" :route-params="{ show: show.slug }" class="w-full">
            <i-lucide-eye v-if="show.watchingStatus === 'watching'" />
            <i-lucide-clock v-else-if="show.watchingStatus === 'pending'" />
            <i-lucide-check v-else-if="show.watchingStatus === 'completed'" />
            <i-lucide-eye-closed v-else-if="show.watchingStatus === 'dropped'" />
            {{ show.name }} (<ShowUpcomingEpisodes :show />)
        </Button>
    </li>
</template>

<script setup lang="ts">
import type Show from '@/models/Show';

const { show } = defineProps<{ show: Show }>();
</script>
