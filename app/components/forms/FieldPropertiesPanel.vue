<template>
    <div class="w-72 shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto">
        <!-- Empty state -->
        <div v-if="!field"
            class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 px-4">
            <div class="size-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <UIcon name="i-lucide-settings-2" class="size-5" />
            </div>
            <p class="text-sm">Maydonni tanlang</p>
        </div>

        <template v-else>
            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <h3 class="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Maydon sozlamalari</h3>
                <button
                    class="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    @click="emit('close')">
                    <UIcon name="i-lucide-x" class="size-4" />
                </button>
            </div>

            <div class="p-4 space-y-4">
                <!-- Type -->
                <div class="space-y-1.5">
                    <label
                        class="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Turi</label>
                    <USelect v-model="local.type" :items="fieldTypeOptions" class="w-full"
                        @update:model-value="emitUpdate" />
                </div>

                <!-- Label -->
                <div class="space-y-1.5">
                    <label
                        class="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sarlavha</label>
                    <UInput v-model="local.label" placeholder="Maydon nomi" @update:model-value="emitUpdate" />
                </div>

                <!-- Placeholder -->
                <div v-if="hasPlaceholder" class="space-y-1.5">
                    <label
                        class="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Placeholder</label>
                    <UInput v-model="local.placeholder" placeholder="Placeholder matni"
                        @update:model-value="emitUpdate" />
                </div>

                <!-- Required Toggle -->
                <div class="flex items-center justify-between py-1">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Majburiy</span>
                    <USwitch v-model="local.required" @update:model-value="emitUpdate" />
                </div>

                <!-- Options Section -->
                <div v-if="hasOptions" class="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div class="flex items-center justify-between">
                        <span
                            class="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Variantlar</span>
                        <button
                            class="p-1 rounded text-gray-400 hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
                            @click="addOption">
                            <UIcon name="i-lucide-plus" class="size-4" />
                        </button>
                    </div>

                    <div class="space-y-1.5">
                        <div v-for="(opt, idx) in local.options" :key="idx" class="flex items-center gap-1.5">
                            <UInput v-model="opt.label" placeholder="Variant" size="sm" class="flex-1"
                                @update:model-value="syncOptionValue(idx); emitUpdate()" />
                            <button class="p-1 rounded text-gray-300 dark:text-gray-600 transition-colors shrink-0"
                                :class="(local.options?.length ?? 0) > 1 ? 'hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'opacity-30 cursor-not-allowed'"
                                :disabled="(local.options?.length ?? 0) <= 1" @click="removeOption(idx)">
                                <UIcon name="i-lucide-trash-2" class="size-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Delete Action -->
            <div class="px-4 pb-4 mt-auto">
                <button
                    class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                    @click="emit('delete')">
                    <UIcon name="i-lucide-trash-2" class="size-4" />
                    Maydonni o'chirish
                </button>
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
