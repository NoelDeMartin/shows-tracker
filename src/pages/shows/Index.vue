<template>
    <Page>
        <h2 class="text-2xl font-bold">Shows</h2>

        <ShowsList v-if="$catalog.shows.length > 0" :shows="$catalog.shows" />
        <p v-else>No shows found</p>
        <Button class="mt-4" route="search">Add Show</Button>
    </Page>
</template>
