<template>
    <div class="flex h-full">
        <!-- Left: Field Palette -->
        <div
            class="w-52 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto p-3">
            <h3 class="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-1">
                Maydonlar</h3>
            <draggable :list="paletteItems" :group="{ name: 'fields', pull: 'clone', put: false }" :sort="false"
                :clone="onClonePalette" item-key="type" class="space-y-1">
                <template #item="{ element: ft }">
                    <button
                        class="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-md text-gray-700 dark:text-gray-300 hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary transition-colors cursor-grab active:cursor-grabbing active:scale-[0.98]">
                        <UIcon :name="ft.icon"
                            class="size-4 text-gray-400 dark:text-gray-500 group-hover:text-primary shrink-0" />
                        <span>{{ ft.label }}</span>
                    </button>
                </template>
            </draggable>
        </div>

        <!-- Center: Canvas -->
        <div class="flex-1 flex flex-col min-w-0">
            <!-- Tabs: Builder / Preview -->
            <div class="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4">
                <button v-for="tab in tabs" :key="tab.id"
                    class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
                    :class="activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
                    @click="activeTab = tab.id">
                    <UIcon :name="tab.icon" class="size-4" />
                    {{ tab.label }}
                </button>
            </div>

            <!-- Builder Tab -->
            <div v-show="activeTab === 'builder'" class="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
                <div class="max-w-2xl mx-auto rounded-xl border-2 border-dashed transition-colors" :class="fields.length === 0
                    ? 'border-gray-300 dark:border-gray-600'
                    : 'border-transparent'">

                    <!-- Fields List (vuedraggable) -->
                    <draggable v-model="fields" :group="{ name: 'fields', put: true }" item-key="id"
                        handle=".drag-handle" ghost-class="opacity-30" animation="200" :empty-insert-threshold="500"
                        class="space-y-2 p-4 min-h-100" @change="onCanvasChange">
                        <template #header>
                            <div v-if="fields.length === 0" :key="'empty'"
                                class="flex flex-col items-center justify-center py-20 text-gray-400 pointer-events-none select-none"
                                data-sortable-ignore="true">
                                <div
                                    class="size-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                    <UIcon name="i-lucide-mouse-pointer-click" class="size-6" />
                                </div>
                                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Maydonlarni shu yerga
                                    tashlang</p>
                                <p class="text-xs mt-1 text-gray-400 dark:text-gray-500">Chap paneldan maydonlarni
                                    tortib olib tashlang</p>
                            </div>
                        </template>
                        <template #item="{ element: field, index: idx }">
                            <div class="group relative rounded-lg border bg-white dark:bg-gray-900 transition-all cursor-pointer"
                                :class="selectedFieldId === field.id
                                    ? 'border-primary ring-2 ring-primary/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                                @click="selectField(field.id)">

                                <!-- Field Header Bar -->
                                <div class="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-800"
                                    :class="selectedFieldId === field.id ? 'bg-primary/3 dark:bg-primary/6' : 'bg-gray-50/50 dark:bg-gray-800/30'">
                                    <!-- Drag Handle -->
                                    <div
                                        class="drag-handle cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 transition-colors">
                                        <UIcon name="i-lucide-grip-vertical" class="size-3.5" />
                                    </div>

                                    <!-- Field Type Icon + Label -->
                                    <UIcon :name="getFieldTypeIcon(field.type)"
                                        class="size-3.5 text-gray-400 dark:text-gray-500" />
                                    <span class="text-[13px] font-medium text-gray-700 dark:text-gray-300 truncate">
                                        {{ field.label || 'Nomsiz maydon' }}
                                    </span>
                                    <span v-if="field.required"
                                        class="text-[10px] text-red-400 font-bold leading-none">*</span>

                                    <div class="ml-auto flex items-center">
                                        <!-- Sort Controls -->
                                        <button class="p-1 rounded text-gray-300 dark:text-gray-600 transition-colors"
                                            :class="idx > 0 ? 'hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700' : 'opacity-30 cursor-not-allowed'"
                                            :disabled="idx === 0" title="Yuqoriga ko'tarish"
                                            @click.stop="moveField(idx, -1)">
                                            <UIcon name="i-lucide-chevron-up" class="size-3.5" />
                                        </button>
                                        <button class="p-1 rounded text-gray-300 dark:text-gray-600 transition-colors"
                                            :class="idx < fields.length - 1 ? 'hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700' : 'opacity-30 cursor-not-allowed'"
                                            :disabled="idx === fields.length - 1" title="Pastga tushirish"
                                            @click.stop="moveField(idx, 1)">
                                            <UIcon name="i-lucide-chevron-down" class="size-3.5" />
                                        </button>

                                        <div class="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

                                        <!-- Copy -->
                                        <button
                                            class="p-1 rounded text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            title="Nusxa olish" @click.stop="duplicateField(idx)">
                                            <UIcon name="i-lucide-copy" class="size-3.5" />
                                        </button>

                                        <!-- Delete -->
                                        <button
                                            class="p-1 rounded text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            title="O'chirish" @click.stop="removeField(idx)">
                                            <UIcon name="i-lucide-trash-2" class="size-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <!-- Field Preview -->
                                <div class="px-4 py-3">
                                    <div class="pointer-events-none">
                                        <UInput
                                            v-if="field.type === 'text' || field.type === 'email' || field.type === 'phone'"
                                            :placeholder="field.placeholder || field.label" disabled size="sm" />
                                        <UTextarea v-else-if="field.type === 'textarea'"
                                            :placeholder="field.placeholder || field.label" disabled size="sm"
                                            :rows="2" />
                                        <UInput v-else-if="field.type === 'number'" type="number"
                                            :placeholder="field.placeholder || field.label" disabled size="sm" />
                                        <UInput v-else-if="field.type === 'date'" type="date" disabled size="sm" />
                                        <UInput v-else-if="field.type === 'time'" type="time" disabled size="sm" />
                                        <USelect v-else-if="field.type === 'select'"
                                            :items="(field.options || []).map((o: { label: string; value: string }) => ({ label: o.label, value: o.value }))"
                                            placeholder="Tanlang..." disabled size="sm" />
                                        <div v-else-if="field.type === 'radio'" class="space-y-1.5">
                                            <label v-for="opt in (field.options || []).slice(0, 3)" :key="opt.value"
                                                class="flex items-center gap-2 text-sm text-gray-500">
                                                <input type="radio" disabled class="accent-primary" />
                                                {{ opt.label }}
                                            </label>
                                        </div>
                                        <div v-else-if="field.type === 'checkbox'" class="space-y-1.5">
                                            <label v-for="opt in (field.options || []).slice(0, 3)" :key="opt.value"
                                                class="flex items-center gap-2 text-sm text-gray-500">
                                                <input type="checkbox" disabled class="accent-primary" />
                                                {{ opt.label }}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </draggable>
                </div>
            </div>

            <!-- Preview Tab -->
            <div v-show="activeTab === 'preview'" class="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
                <div class="max-w-2xl mx-auto">
                    <UCard>
                        <template #header>
                            <h2 class="text-lg font-semibold">{{ previewTitle || 'Forma ko\'rinishi' }}</h2>
                        </template>
                        <FormsFormRenderer v-if="fields.length" :fields="fields" />
                        <div v-else class="text-center py-8 text-gray-400">
                            <p>Maydonlar qo'shilmagan</p>
                        </div>
                    </UCard>
                </div>
            </div>
        </div>

        <!-- Right: Properties Panel -->
        <FormsFieldPropertiesPanel v-if="activeTab === 'builder'" :field="selectedField" :field-count="fields.length"
            :field-index="selectedField ? fields.findIndex(f => f.id === selectedField!.id) : -1"
            @update="onFieldUpdate" @delete="onFieldDelete" @close="selectedFieldId = null" />
    </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import type { FormField, FormFieldType, FormSchema } from '~/types'

const props = defineProps<{
    initialSchema?: FormSchema
    previewTitle?: string
}>()

const emit = defineEmits<{
    'update:schema': [schema: FormSchema]
}>()

const activeTab = ref<'builder' | 'preview'>('builder')
const selectedFieldId = ref<string | null>(null)

const tabs = [
    { id: 'builder' as const, label: 'Quruvchi', icon: 'i-lucide-blocks' },
    { id: 'preview' as const, label: 'Ko\'rinish', icon: 'i-lucide-eye' },
]

const fieldTypes = [
    { type: 'text' as FormFieldType, label: 'Matn', icon: 'i-lucide-type' },
    { type: 'textarea' as FormFieldType, label: 'Katta matn', icon: 'i-lucide-align-left' },
    { type: 'number' as FormFieldType, label: 'Raqam', icon: 'i-lucide-hash' },
    { type: 'email' as FormFieldType, label: 'Email', icon: 'i-lucide-mail' },
    { type: 'phone' as FormFieldType, label: 'Telefon', icon: 'i-lucide-phone' },
    { type: 'select' as FormFieldType, label: 'Tanlash', icon: 'i-lucide-list' },
    { type: 'checkbox' as FormFieldType, label: 'Belgilash', icon: 'i-lucide-check-square' },
    { type: 'radio' as FormFieldType, label: 'Radio', icon: 'i-lucide-circle-dot' },
    { type: 'date' as FormFieldType, label: 'Sana', icon: 'i-lucide-calendar' },
    { type: 'time' as FormFieldType, label: 'Vaqt', icon: 'i-lucide-clock' },
]

// Palette items used as draggable source (cloned, never mutated)
const paletteItems = fieldTypes

const fields = ref<FormField[]>([])

const selectedField = computed(() =>
    fields.value.find((f) => f.id === selectedFieldId.value) ?? null,
)

// Initialize from schema
watch(
    () => props.initialSchema,
    (schema) => {
        if (schema?.fields?.length) {
            fields.value = JSON.parse(JSON.stringify(schema.fields))
        }
    },
    { immediate: true },
)

// Emit schema on changes
watch(fields, () => {
    emit('update:schema', { fields: JSON.parse(JSON.stringify(toRaw(fields.value))) })
}, { deep: true })

function generateId() {
    return `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function getFieldTypeIcon(type: FormFieldType) {
    return fieldTypes.find((ft) => ft.type === type)?.icon ?? 'i-lucide-box'
}

function moveField(idx: number, direction: -1 | 1) {
    const targetIdx = idx + direction
    if (targetIdx < 0 || targetIdx >= fields.value.length) return
    const [item] = fields.value.splice(idx, 1)
    if (item) fields.value.splice(targetIdx, 0, item)
}

function createField(type: FormFieldType): FormField {
    const ft = fieldTypes.find((f) => f.type === type)
    const base: FormField = {
        id: generateId(),
        type,
        label: ft?.label ?? 'Yangi maydon',
        placeholder: '',
        required: false,
    }
    if (['select', 'checkbox', 'radio'].includes(type)) {
        base.options = [
            { label: 'Variant 1', value: 'variant_1' },
            { label: 'Variant 2', value: 'variant_2' },
        ]
    }
    return base
}

// Called when cloning from palette to canvas
function onClonePalette(paletteItem: typeof fieldTypes[number]): FormField {
    return createField(paletteItem.type)
}

// Auto-select newly added fields from palette
function onCanvasChange(evt: any) {
    if (evt.added) {
        selectedFieldId.value = evt.added.element.id
    }
}

// ─── Field Actions ───
function selectField(id: string) {
    selectedFieldId.value = id
}

function duplicateField(idx: number) {
    const copy = JSON.parse(JSON.stringify(fields.value[idx]))
    copy.id = generateId()
    copy.label = copy.label + ' (nusxa)'
    fields.value.splice(idx + 1, 0, copy)
}

function removeField(idx: number) {
    const field = fields.value[idx]
    if (field && selectedFieldId.value === field.id) selectedFieldId.value = null
    fields.value.splice(idx, 1)
}

function onFieldUpdate(updated: FormField) {
    const idx = fields.value.findIndex((f) => f.id === updated.id)
    if (idx !== -1) fields.value[idx] = updated
}

function onFieldDelete() {
    if (!selectedFieldId.value) return
    const idx = fields.value.findIndex((f) => f.id === selectedFieldId.value)
    if (idx !== -1) {
        fields.value.splice(idx, 1)
        selectedFieldId.value = null
    }
}

// ─── Public API ───
function getSchema(): FormSchema {
    return { fields: JSON.parse(JSON.stringify(toRaw(fields.value))) }
}

function loadSchema(schema: FormSchema) {
    if (schema?.fields) {
        fields.value = JSON.parse(JSON.stringify(schema.fields))
    }
}

defineExpose({ getSchema, loadSchema })
</script>
