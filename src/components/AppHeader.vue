<template>
    <header
        class="max-w-screen-content px-edge mx-auto flex w-full flex-wrap items-center justify-between gap-2 pt-4 sm:pt-8"
    >
        <h1 class="text-primary-600 flex items-center">
            <i-mdi-television-classic class="mr-2 size-6 sm:size-7" />
            <Link route="home" class="text-xl font-semibold tracking-tight sm:text-2xl">
                {{ $t('app.title') }}
            </Link>
        </h1>
        <div class="grow" />
        <ErrorLogs />
        <Account />
    </header>
</template>
