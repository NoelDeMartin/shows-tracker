<template>
    <Page>
        <h2 class="text-2xl font-bold">Shows</h2>

        <ShowsList v-if="$catalog.shows.length > 0" :shows="$catalog.shows" />
        <p v-else>No shows found</p>
        <div class="mt-4 flex flex-col gap-2">
            <Button route="shows.search">Search Shows</Button>
            <Button route="shows.import">Import Shows</Button>
        </div>
    </Page>
</template>
