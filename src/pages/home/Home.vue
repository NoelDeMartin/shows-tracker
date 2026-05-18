<template>
    <Page>
        <ShowsList v-if="$catalog.shows.length > 0" />
        <p v-else>No shows found</p>
        <Button class="mt-4" route="search">Add Show</Button>
    </Page>
</template>
