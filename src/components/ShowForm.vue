<template>
    <div class="relative rounded-2xl bg-white p-8 shadow-lg">
        <Form class="space-y-4" :form @submit="save">
            <Input name="name" :label="$t('shows.form.name')" />
            <TextArea name="description" :label="$t('shows.form.description')" rows="4" />

            <div class="grid grid-cols-2 gap-4">
                <Input name="seasons" min="0" :label="$t('shows.form.seasons')" />
                <Input
                    name="episodes"
                    min="0"
                    required
                    :label="$t('shows.form.episodes')"
                />
            </div>

            <Input
                name="rating"
                min="0"
                max="5"
                step="0.5"
                :label="$t('shows.form.rating')"
            />

            <Checkbox name="completed" :label="$t('shows.form.completed')" />

            <div class="flex justify-end gap-4">
                <Button variant="secondary" @click="$emit('cancel')">
                    {{ $t('shows.form.cancel') }}
                </Button>
                <Button submit>
                    {{ show ? $t('shows.form.update') : $t('shows.form.create') }}
                </Button>
            </div>
        </Form>

        <div class="absolute -right-4 -bottom-4 rotate-15 transform text-4xl">
            📺
        </div>
    </div>
</template>

<script setup lang="ts">
import { UI, booleanInput, numberInput, requiredStringInput, stringInput, useForm } from '@aerogel/core';

import Show from '@/models/Show';

const { show } = defineProps<{ show?: Show }>();
const emit = defineEmits<{
    saved: [show: Show];
    cancel: [];
}>();

const form = useForm({
    name: requiredStringInput(show?.name ?? ''),
    description: stringInput(show?.description ?? ''),
    seasons: numberInput(show?.seasons ?? 0),
    episodes: numberInput(show?.episodes ?? 0),
    rating: numberInput(show?.rating ?? 0),
    completed: booleanInput(show?.completed ?? false),
});

async function save() {
    UI.loading('Saving...', async () => {
        const updatedShow = show ?? new Show();
        const { completed, rating, ...data } = form.data();

        updatedShow.completed = completed ?? false;
        updatedShow.rating = rating ?? null;
        updatedShow.setAttributes(data);

        await updatedShow.save();

        emit('saved', updatedShow);
    });
}
</script>
