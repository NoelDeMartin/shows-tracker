<template>
    <ul class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ShowsListItem v-for="show in shows" :key="show.url" :show />
    </ul>
</template>

<script setup lang="ts">
import type Show from '@/models/Show';

defineProps<{ shows: Show[] }>();
</script>
