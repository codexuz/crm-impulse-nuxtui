<template>
    <div
        class="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto p-4 space-y-4">
        <div v-if="!field" class="text-center text-sm text-gray-400 py-8">
            Maydonni tanlang
        </div>

        <template v-else>
            <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold">Maydon sozlamalari</h3>
                <UButton variant="ghost" icon="i-lucide-x" size="xs" @click="emit('close')" />
            </div>

            <UFormField label="Turi">
                <USelect v-model="local.type" :items="fieldTypeOptions" class="w-full"
                    @update:model-value="emitUpdate" />
            </UFormField>

            <UFormField label="Sarlavha">
                <UInput v-model="local.label" placeholder="Maydon nomi" @update:model-value="emitUpdate" />
            </UFormField>

            <UFormField v-if="hasPlaceholder" label="Placeholder">
                <UInput v-model="local.placeholder" placeholder="Placeholder matni" @update:model-value="emitUpdate" />
            </UFormField>

            <UFormField>
                <div class="flex items-center gap-2">
                    <USwitch v-model="local.required" @update:model-value="emitUpdate" />
                    <span class="text-sm">Majburiy</span>
                </div>
            </UFormField>

            <!-- Options for select/radio/checkbox -->
            <div v-if="hasOptions" class="space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">Variantlar</span>
                    <UButton variant="ghost" icon="i-lucide-plus" size="xs" @click="addOption" />
                </div>

                <div v-for="(opt, idx) in local.options" :key="idx" class="flex items-center gap-2">
                    <UInput v-model="opt.label" placeholder="Variant nomi" size="sm" class="flex-1"
                        @update:model-value="syncOptionValue(idx); emitUpdate()" />
                    <UButton variant="ghost" icon="i-lucide-trash-2" size="xs" color="error"
                        :disabled="(local.options?.length ?? 0) <= 1" @click="removeOption(idx)" />
                </div>
            </div>

            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                <UButton color="error" variant="soft" icon="i-lucide-trash-2" label="Maydonni o'chirish" block
                    @click="emit('delete')" />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import type { FormField, FormFieldType } from '~/types'

const props = defineProps<{
    field: FormField | null
}>()

const emit = defineEmits<{
    update: [field: FormField]
    delete: []
    close: []
}>()

const fieldTypeOptions = [
    { label: 'Matn', value: 'text' as FormFieldType },
    { label: 'Katta matn', value: 'textarea' as FormFieldType },
    { label: 'Raqam', value: 'number' as FormFieldType },
    { label: 'Email', value: 'email' as FormFieldType },
    { label: 'Telefon', value: 'phone' as FormFieldType },
    { label: 'Tanlash', value: 'select' as FormFieldType },
    { label: 'Belgilash', value: 'checkbox' as FormFieldType },
    { label: 'Radio', value: 'radio' as FormFieldType },
    { label: 'Sana', value: 'date' as FormFieldType },
]

const local = reactive<FormField>({
    id: '',
    type: 'text',
    label: '',
    placeholder: '',
    required: false,
    options: [],
})

const hasPlaceholder = computed(() =>
    ['text', 'textarea', 'number', 'email', 'phone'].includes(local.type),
)

const hasOptions = computed(() =>
    ['select', 'checkbox', 'radio'].includes(local.type),
)

watch(
    () => props.field,
    (f) => {
        if (f) {
            local.id = f.id
            local.type = f.type
            local.label = f.label
            local.placeholder = f.placeholder ?? ''
            local.required = f.required ?? false
            local.options = f.options ? JSON.parse(JSON.stringify(f.options)) : [{ label: 'Variant 1', value: 'variant_1' }]
        }
    },
    { immediate: true },
)

function emitUpdate() {
    emit('update', { ...toRaw(local), options: local.options ? JSON.parse(JSON.stringify(toRaw(local.options))) : undefined })
}

function syncOptionValue(idx: number) {
    if (local.options?.[idx]) {
        local.options[idx].value = local.options[idx].label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    }
}

function addOption() {
    if (!local.options) local.options = []
    const n = local.options.length + 1
    local.options.push({ label: `Variant ${n}`, value: `variant_${n}` })
    emitUpdate()
}

function removeOption(idx: number) {
    local.options?.splice(idx, 1)
    emitUpdate()
}
</script>
