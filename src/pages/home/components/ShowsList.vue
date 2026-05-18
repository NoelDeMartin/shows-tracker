<template>
    <ul class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ShowsListItem v-for="show in $catalog.shows" :key="show.url" :show />
    </ul>
</template>
