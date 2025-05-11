<template>
    <Button
        variant="secondary"
        class="py-1.5"
        :disabled="isUpdating"
        @click="updateShows"
    >
        <i-mdi-refresh class="size-4" :class="{ 'animate-spin': isUpdating }" />
        <span class="hidden md:block">{{ $t('shows.actions.update') }}</span>
    </Button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Errors, UI, translate } from '@aerogel/core';

import Catalog from '@/services/Catalog';
import { after } from '@noeldemartin/utils';

const isUpdating = ref(false);

async function updateShows() {
    isUpdating.value = true;

    try {
        await Promise.all([Catalog.update(), after(1000)]);

        UI.toast(translate('shows.update.success'));
    } catch (error) {
        Errors.report(error);
    } finally {
        isUpdating.value = false;
    }
}
</script>
