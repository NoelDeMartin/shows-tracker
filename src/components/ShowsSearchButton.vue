<template>
    <Button variant="secondary" class="py-1.5" @click="$ui.modal(SearchShowModal)">
        <i-mdi-magnify class="size-4" />
        <span class="hidden md:block">{{ $t('shows.actions.search') }}</span>
    </Button>
</template>

<script setup lang="ts">
import SearchShowModal from '@/components/modals/SearchShowModal.vue';
</script>
