<template>
    <div>
        <div v-if="selected.size > 0" class="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-gray-100 p-3">
            <span class="text-sm text-gray-700">{{ selected.size }} selected</span>
            <Select
                label="Status"
                label-class="sr-only"
                :options="statusOptions"
                :model-value="bulkStatus"
                :render-option="stringToStudlyCase"
                @update:modelValue="bulkStatus = $event as ShowWatchingStatus"
            />
            <Button :disabled="updating" @click="applyBulkStatus()">Apply</Button>
            <Button variant="secondary" :disabled="updating" @click="clearSelection()">Clear</Button>
        </div>

        <div class="mb-4 flex flex-wrap items-end gap-2">
            <Input
                v-model="searchQuery"
                label="Search"
                label-class="sr-only"
                placeholder="Search shows"
                class="min-w-48 flex-1"
            />
            <Select
                label="Filter by status"
                label-class="sr-only"
                :options="statusFilterOptions"
                :model-value="statusFilter"
                :render-option="renderStatusFilterOption"
                @update:modelValue="statusFilter = $event as StatusFilter"
            />
        </div>

        <ul>
            <li class="flex items-center gap-4 py-2 font-bold">
                <Checkbox
                    :model-value="allSelected"
                    label="Select all"
                    label-class="sr-only"
                    @update:modelValue="toggleAll($event as boolean)"
                />
                <button
                    type="button"
                    class="flex flex-1 items-center gap-1"
                    :aria-sort="sortAria('name')"
                    @click="toggleSort('name')"
                >
                    Name
                    <i-lucide-arrow-up v-if="sortColumn === 'name' && sortDirection === 'asc'" class="size-4" />
                    <i-lucide-arrow-down v-else-if="sortColumn === 'name' && sortDirection === 'desc'" class="size-4" />
                </button>
                <button
                    type="button"
                    class="flex w-24 items-center justify-end gap-1"
                    :aria-sort="sortAria('status')"
                    @click="toggleSort('status')"
                >
                    Status
                    <i-lucide-arrow-up v-if="sortColumn === 'status' && sortDirection === 'asc'" class="size-4" />
                    <i-lucide-arrow-down
                        v-else-if="sortColumn === 'status' && sortDirection === 'desc'"
                        class="size-4"
                    />
                </button>
            </li>
            <li v-for="show in visibleShows" :key="show.url" class="flex items-center gap-4 py-2">
                <Checkbox
                    :model-value="selected.has(show.url)"
                    :label="show.name"
                    label-class="sr-only"
                    @update:modelValue="toggleSelected(show.url, $event as boolean)"
                />
                <span class="flex-1">
                    <Link route="shows.show" :route-params="{ show: show.slug }">
                        {{ show.name }} (<ShowUpcomingEpisodes :show />)
                    </Link>
                </span>
                <span class="w-24 text-right text-gray-600">{{ show.watchingStatus }}</span>
            </li>
            <li v-if="visibleShows.length === 0" class="py-4 text-center text-gray-600">No matching shows</li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { arraySorted, stringToStudlyCase } from '@noeldemartin/utils';
import type { ModelWithUrl } from 'soukai-bis';
import { computed, ref, toRaw } from 'vue';

import type Show from '@/models/Show';
import { SHOW_WATCHING_STATUSES, type ShowWatchingStatus } from '@/models/ShowWatching';

type SortColumn = 'name' | 'status';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | ShowWatchingStatus;

const { shows } = defineProps<{ shows: ModelWithUrl<Show>[] }>();

const statusOptions = Object.keys(SHOW_WATCHING_STATUSES) as ShowWatchingStatus[];
const statusFilterOptions: StatusFilter[] = ['all', ...statusOptions];
const selected = ref(new Set<string>());
const bulkStatus = ref<ShowWatchingStatus>('watching');
const updating = ref(false);
const searchQuery = ref('');
const statusFilter = ref<StatusFilter>('all');
const sortColumn = ref<SortColumn | null>(null);
const sortDirection = ref<SortDirection | null>(null);

const filteredShows = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();

    return shows.filter((show) => {
        if (statusFilter.value !== 'all' && show.watchingStatus !== statusFilter.value) {
            return false;
        }

        if (query && !show.name.toLowerCase().includes(query)) {
            return false;
        }

        return true;
    });
});

const visibleShows = computed(() => {
    if (!sortColumn.value || !sortDirection.value) {
        return filteredShows.value;
    }

    const key = sortColumn.value === 'name' ? 'name' : 'watchingStatus';

    return arraySorted(filteredShows.value, key, sortDirection.value);
});

const allSelected = computed(
    () => visibleShows.value.length > 0 && visibleShows.value.every((show) => selected.value.has(show.url)),
);

function renderStatusFilterOption(option: StatusFilter) {
    return option === 'all' ? 'All' : stringToStudlyCase(option);
}

function toggleSort(column: SortColumn) {
    if (sortColumn.value !== column) {
        sortColumn.value = column;
        sortDirection.value = 'asc';
        return;
    }

    if (sortDirection.value === 'asc') {
        sortDirection.value = 'desc';
        return;
    }

    sortColumn.value = null;
    sortDirection.value = null;
}

function sortAria(column: SortColumn): 'ascending' | 'descending' | 'none' {
    if (sortColumn.value !== column || !sortDirection.value) {
        return 'none';
    }

    return sortDirection.value === 'asc' ? 'ascending' : 'descending';
}

function toggleAll(checked: boolean) {
    const next = new Set(selected.value);

    for (const show of visibleShows.value) {
        if (checked) {
            next.add(show.url);
        } else {
            next.delete(show.url);
        }
    }

    selected.value = next;
}

function toggleSelected(url: string, checked: boolean) {
    const next = new Set(selected.value);

    if (checked) {
        next.add(url);
    } else {
        next.delete(url);
    }

    selected.value = next;
}

function clearSelection() {
    selected.value = new Set();
}

async function applyBulkStatus() {
    const selectedShows = shows.filter((show) => selected.value.has(show.url));

    if (selectedShows.length === 0) {
        return;
    }

    updating.value = true;

    try {
        await Promise.all(selectedShows.map((show) => toRaw(show).updateWatchingStatus(bulkStatus.value)));
        clearSelection();
    } finally {
        updating.value = false;
    }
}
</script>
