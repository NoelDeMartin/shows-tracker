<template>
    <Page>
        <h2 class="mb-6 text-2xl font-bold">
            {{ $t('shows.create.title') }}
        </h2>
        <ShowForm @saved="$router.push({ name: 'shows.index' })" @cancel="$router.push({ name: 'shows.index' })" />
    </Page>
</template>
