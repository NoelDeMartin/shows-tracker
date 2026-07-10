<template>
    <Page>
        <div class="mb-4 flex w-full items-center justify-between">
            <h2 class="text-2xl font-bold">Shows<span id="shows-count"></span></h2>
            <Button variant="secondary" @click="view = view === 'grid' ? 'table' : 'grid'">
                <i-mdi-view-grid v-if="view === 'grid'" class="size-5" />
                <i-mdi-view-list v-else class="size-5" />
            </Button>
        </div>

        <template v-if="$catalog.shows.length > 0">
            <ShowsTable v-if="view === 'table'" :shows="$catalog.showsWithUrl" />
            <ShowsList v-else-if="view === 'grid'" :shows="$catalog.shows" />
        </template>
        <p v-else>No shows found</p>
    </Page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const view = ref<'grid' | 'table'>('grid');
</script>
