<template>
    <Page>
        <h2 class="text-2xl font-bold">Import</h2>

        <div v-if="!results" class="mt-4">
            <input
                type="file"
                accept=".json"
                @change="onFileChange"
                :disabled="importing"
                class="block w-full rounded border border-gray-300 p-2"
            />
            <div v-if="importing" class="mt-4 space-y-2">
                <div class="text-sm text-gray-500">Importing shows ({{ currentCount }}/{{ totalCount }})...</div>
                <ProgressBar :progress="progress" />
                <Button variant="danger" class="mt-2 w-full" :disabled="cancelling" @click="cancelImport">
                    <i-svg-spinners-180-ring-with-bg class="mr-2 size-4" v-if="cancelling" />
                    {{ cancelling ? 'Cancelling...' : 'Cancel' }}
                </Button>
            </div>
            <Button v-else class="mt-4" :disabled="!file" @click="startImport">Import Collection</Button>
        </div>

        <div v-else class="mt-4 space-y-6">
            <div>
                <h3 id="imported-heading" class="text-lg font-bold">Imported:</h3>
                <ul aria-labelledby="imported-heading" class="mt-2 list-inside list-disc space-y-1">
                    <li v-for="item in results.imported" :key="item.title">{{ item.title }}</li>
                    <li v-if="results.imported.length === 0" class="font-normal text-gray-500">None</li>
                </ul>
            </div>

            <div>
                <h3 id="skipped-heading" class="text-lg font-bold">Skipped:</h3>
                <ul aria-labelledby="skipped-heading" class="mt-2 list-inside list-disc space-y-1">
                    <li v-for="item in results.skipped" :key="item.title">
                        {{ item.title }} <span class="text-sm font-normal text-gray-500">({{ item.reason }})</span>
                    </li>
                    <li v-if="results.skipped.length === 0" class="font-normal text-gray-500">None</li>
                </ul>
            </div>

            <div>
                <h3 id="failed-heading" class="text-lg font-bold">Failed:</h3>
                <ul aria-labelledby="failed-heading" class="mt-2 list-inside list-disc space-y-1">
                    <li v-for="item in results.failed" :key="item.title">
                        {{ item.title }} <span class="text-sm font-normal text-red-500">({{ item.reason }})</span>
                    </li>
                    <li v-if="results.failed.length === 0" class="font-normal text-gray-500">None</li>
                </ul>
            </div>

            <Button route="shows.index" class="mt-4">Back to Shows</Button>
        </div>
    </Page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import Catalog from '@/services/Catalog';
import type { ImportResults } from '@/services/Catalog';

const file = ref<File | null>(null);
const importing = ref(false);
const cancelling = ref(false);
const progress = ref(0);
const currentCount = ref(0);
const totalCount = ref(0);
const results = ref<ImportResults | null>(null);
let abortController: AbortController | null = null;

function onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        file.value = input.files[0];
    } else {
        file.value = null;
    }
}

async function startImport() {
    if (!file.value) {
        return;
    }

    importing.value = true;
    progress.value = 0;
    currentCount.value = 0;
    cancelling.value = false;
    abortController = new AbortController();
    try {
        const text = await file.value.text();
        const rawData = JSON.parse(text);

        if (!Array.isArray(rawData)) {
            throw new Error('Backup file must be a JSON array');
        }

        results.value = await Catalog.import(rawData, {
            signal: abortController.signal,
            onProgress: (current, total) => {
                progress.value = total > 0 ? current / total : 0;
                currentCount.value = current;
                totalCount.value = total;
            },
        });
    } catch (error) {
        console.error(error);
        results.value = {
            imported: [],
            skipped: [],
            failed: [
                {
                    title: file.value.name,
                    reason: error instanceof Error ? error.message : 'Invalid backup file format',
                },
            ],
        };
    } finally {
        importing.value = false;
        cancelling.value = false;
        abortController = null;
    }
}

function cancelImport() {
    cancelling.value = true;
    abortController?.abort();
}
</script>
