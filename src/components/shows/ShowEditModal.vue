<template>
    <Modal v-slot="{ close }" title="Edit Show" persistent>
        <Form :form @submit="submit()">
            <div class="space-y-4">
                <Input name="name" label="Name" disabled />
                <TextArea name="description" label="Description" />

                <div class="grid grid-cols-2 gap-4">
                    <Input name="startDate" type="date" label="Start Date" disabled />
                    <Input name="endDate" type="date" label="End Date" />
                </div>

                <Input name="imageUrl" type="url" label="Image URL" />

                <div>
                    <span class="block text-sm leading-6 font-medium text-gray-900">External URLs</span>
                    <div class="mt-2 space-y-2">
                        <div v-for="(_, index) in form.externalUrls ?? []" :key="index" class="flex gap-2">
                            <Input
                                v-model="form.externalUrls![index]"
                                type="url"
                                class="flex-1"
                                placeholder="https://example.com"
                            />
                            <Button variant="secondary" type="button" @click="removeExternalUrl(index)">
                                Remove
                            </Button>
                        </div>
                        <Button variant="secondary" type="button" class="w-full" @click="addExternalUrl()">
                            Add URL
                        </Button>
                    </div>
                </div>
            </div>

            <div class="mt-6 flex flex-row-reverse gap-2">
                <Button submit :loading="saving">Save</Button>
                <Button variant="secondary" type="button" @click="close()">Cancel</Button>
            </div>
        </Form>
    </Modal>
</template>

<script setup lang="ts">
import { useModal, useForm, stringInput, dateInput, objectInput, useLoading } from '@aerogel/core';
import { toRaw } from 'vue';

import type Show from '@/models/Show';

const props = defineProps<{ show: Show }>();
const { close } = useModal();
const { loading: saving, run: runSaving } = useLoading();
const form = useForm({
    name: stringInput(props.show.name),
    description: stringInput(props.show.description),
    startDate: dateInput(props.show.startDate),
    endDate: dateInput(props.show.endDate),
    imageUrl: stringInput(props.show.imageUrl),
    externalUrls: objectInput<string[]>([...(props.show.externalUrls ?? [])]),
});

function addExternalUrl() {
    form.externalUrls ??= [];

    form.externalUrls.push('');
}

function removeExternalUrl(index: number) {
    form.externalUrls?.splice(index, 1);
}

async function submit() {
    await runSaving(async () => {
        await toRaw(props.show).update({
            description: form.description?.trim() || undefined,
            endDate: form.endDate ?? undefined,
            imageUrl: form.imageUrl?.trim() || undefined,
            externalUrls: form.externalUrls?.map((externalUrl) => externalUrl.trim()).filter(Boolean),
        });

        close();
    });
}
</script>
