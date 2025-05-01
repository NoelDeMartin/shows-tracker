<template>
    <Page>
        <h2 class="mb-6 text-2xl font-bold">
            {{ $t('shows.edit.title') }}
        </h2>
        <ShowForm
            :show
            @saved="$router.push({ name: 'shows.show', params: { show: show.slug } })"
            @cancel="$router.push({ name: 'shows.show', params: { show: show.slug } })"
        />
    </Page>
</template>

<script setup lang="ts">
import type Show from '@/models/Show';

defineProps<{ show: Show }>();
</script>
