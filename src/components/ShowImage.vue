<template>
    <img :src alt="" @error="onImageError">
</template>

<script setup lang="ts">
defineProps<{ src: string }>();

function onImageError(event: Event) {
    const img = event.target as HTMLImageElement;

    img.style.display = 'none';
}
</script>
