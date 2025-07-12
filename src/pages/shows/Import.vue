<template>
    <Page>
        <div class="mb-6">
            <h2 class="text-2xl font-bold">
                {{ $t('shows.import.title') }}
            </h2>
            <p class="mt-2 text-gray-600">
                {{ $t('shows.import.description') }}
            </p>
        </div>

        <div class="mb-4">
            <Button route="shows.index" variant="secondary" class="py-1.5">
                <i-mdi-arrow-left class="size-4" />
                {{ $t('shows.actions.back') }}
            </Button>
        </div>

        <div class="rounded-lg border bg-white p-6 shadow-sm">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">
                        {{ $t('shows.import.select_file') }}
                    </label>
                    <input
                        type="file"
                        accept=".json"
                        class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                        @change="onFileSelected"
                    >
                </div>

                <button
                    :disabled="!selectedFile || isImporting"
                    class="flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    @click="importCollection"
                >
                    <svg
                        v-if="isImporting"
                        class="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                        />
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    {{ isImporting ? $t('shows.import.importing') : $t('shows.import.start_import') }}
                </button>
            </div>
        </div>

        <!-- Import Results -->
        <div v-if="importResult" class="mt-6 rounded-lg border bg-white p-6 shadow-sm">
            <h3 class="mb-4 text-lg font-semibold">
                {{ $t('shows.import.results_title') }}
            </h3>

            <div class="grid gap-4 sm:grid-cols-3">
                <div class="rounded-lg bg-green-50 p-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fill-rule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-green-800">
                                {{ $t('shows.import.imported_count', { count: importResult.imported.length }) }}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="rounded-lg bg-yellow-50 p-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fill-rule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-yellow-800">
                                {{ $t('shows.import.skipped_count', { count: importResult.skipped.length }) }}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="rounded-lg bg-red-50 p-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fill-rule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-red-800">
                                {{ $t('shows.import.failed_count', { count: importResult.failed.length }) }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Detailed Results -->
            <div v-if="importResult.imported.length > 0" class="mt-4">
                <h4 class="mb-2 text-lg font-medium text-green-900">
                    {{ $t('shows.import.imported_shows') }} ({{ importResult.imported.length }})
                </h4>
                <div class="mt-2 max-h-32 overflow-y-auto rounded border bg-green-50 p-3">
                    <ul class="space-y-1 text-sm text-green-600">
                        <li v-for="show in importResult.imported" :key="show.title">
                            <strong>{{ show.title }}</strong>
                        </li>
                    </ul>
                </div>
            </div>

            <div v-if="importResult.skipped.length > 0" class="mt-4">
                <h4 class="mb-2 text-lg font-medium text-gray-900">
                    {{ $t('shows.import.skipped_shows') }} ({{ importResult.skipped.length }})
                </h4>
                <div class="mt-2 max-h-32 overflow-y-auto rounded border bg-gray-50 p-3">
                    <ul class="space-y-1 text-sm text-gray-600">
                        <li v-for="show in importResult.skipped" :key="show.title">
                            <strong>{{ show.title }}</strong> - {{ show.reason }}
                        </li>
                    </ul>
                </div>
            </div>

            <div v-if="importResult.failed.length > 0" class="mt-4">
                <h4 class="mb-2 text-lg font-medium text-red-900">
                    {{ $t('shows.import.failed_shows') }} ({{ importResult.failed.length }})
                </h4>
                <div class="mt-2 max-h-32 overflow-y-auto rounded border bg-gray-50 p-3">
                    <ul class="space-y-1 text-sm text-red-600">
                        <li v-for="show in importResult.failed" :key="show.title">
                            <strong>{{ show.title }}</strong> - {{ show.reason }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </Page>
</template>

<script setup lang="ts">
import Catalog from '@/services/Catalog';
import { ref } from 'vue';
import { UI, translate } from '@aerogel/core';
import type { ImportResult, TVISOShow } from '@/services/Catalog';

const selectedFile = ref<File | null>(null);
const isImporting = ref(false);
const importResult = ref<ImportResult | null>(null);

function onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        selectedFile.value = target.files[0];
        importResult.value = null;
    }
}

async function importCollection() {
    if (!selectedFile.value) return;

    isImporting.value = true;
    importResult.value = null;

    try {
        const fileContent = await selectedFile.value.text();
        const jsonData = JSON.parse(fileContent) as TVISOShow[];

        const result = await Catalog.importFromTViso(jsonData);
        importResult.value = result;

        if (result.imported.length > 0 && result.failed.length === 0) {
            UI.toast(translate('shows.import.success', { count: result.imported.length }));
        } else if (result.imported.length === 0) {
            UI.toast(translate('shows.import.no_shows'));
        } else if (result.imported.length > 0 && result.failed.length > 0) {
            UI.toast(translate('shows.import.partial_success', { count: result.imported.length }));
        }
    } catch (error) {
        UI.toast(translate('shows.import.error'));
    } finally {
        isImporting.value = false;
    }
}
</script>
