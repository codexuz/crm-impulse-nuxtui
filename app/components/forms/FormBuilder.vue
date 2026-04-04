<template>
    <div class="flex h-full">
        <!-- Left: Field Palette -->
        <div
            class="w-56 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto p-3 space-y-2">
            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Maydonlar</h3>

            <button v-for="ft in fieldTypes" :key="ft.type"
                class="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-primary/40 transition-colors cursor-grab active:cursor-grabbing"
                draggable="true" @dragstart="onPaletteDragStart($event, ft.type)">
                <UIcon :name="ft.icon" class="size-4 text-gray-500" />
                <span>{{ ft.label }}</span>
            </button>
        </div>

        <!-- Center: Canvas -->
        <div class="flex-1 flex flex-col min-w-0">
            <!-- Tabs: Builder / Preview -->
            <div class="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4">
                <button v-for="tab in tabs" :key="tab.id"
                    class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors" :class="activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
                    @click="activeTab = tab.id">
                    <UIcon :name="tab.icon" class="size-4 mr-1.5 inline-block align-text-bottom" />
                    {{ tab.label }}
                </button>
            </div>

            <!-- Builder Tab -->
            <div v-show="activeTab === 'builder'" class="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
                <div class="max-w-2xl mx-auto min-h-100 rounded-xl border-2 border-dashed transition-colors" :class="isDragOver
                    ? 'border-primary bg-primary/5'
                    : fields.length === 0
                        ? 'border-gray-300 dark:border-gray-600'
                        : 'border-transparent'" @dragover.prevent="onDragOver" @dragleave="onDragLeave"
                    @drop="onCanvasDrop">
                    <!-- Empty State -->
                    <div v-if="fields.length === 0 && !isDragOver"
                        class="flex flex-col items-center justify-center py-20 text-gray-400">
                        <UIcon name="i-lucide-mouse-pointer-click" class="size-10 mb-3" />
                        <p class="text-base font-medium">Maydonlarni shu yerga tashlang</p>
                        <p class="text-sm mt-1">Chap paneldan maydonlarni tortib olib tashlang</p>
                    </div>

                    <div v-if="isDragOver && fields.length === 0"
                        class="flex items-center justify-center py-20 text-primary">
                        <p class="text-base font-medium">Shu yerga tashlang</p>
                    </div>

                    <!-- Fields List -->
                    <div ref="sortableContainer" class="space-y-3 p-4">
                        <div v-for="(field, idx) in fields" :key="field.id"
                            class="group relative rounded-lg border bg-white dark:bg-gray-900 p-4 transition-all cursor-grab active:cursor-grabbing"
                            :class="selectedFieldId === field.id
                                ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'"
                            draggable="true" :data-field-id="field.id" @click="selectField(field.id)"
                            @dragstart="onFieldDragStart($event, idx)" @dragover.prevent="onFieldDragOver($event, idx)"
                            @drop.prevent="onFieldDrop($event, idx)" @dragend="onFieldDragEnd">
                            <!-- Drag Handle & Actions -->
                            <div
                                class="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <UIcon name="i-lucide-grip-vertical" class="size-4 text-gray-400" />
                            </div>

                            <div
                                class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <UButton variant="ghost" icon="i-lucide-copy" size="xs"
                                    @click.stop="duplicateField(idx)" />
                                <UButton variant="ghost" icon="i-lucide-trash-2" size="xs" color="error"
                                    @click.stop="removeField(idx)" />
                            </div>

                            <!-- Field Preview -->
                            <div class="pl-4">
                                <div class="flex items-center gap-1.5 mb-1.5">
                                    <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ field.label ||
                                        'Nomsiz maydon' }}</span>
                                    <span v-if="field.required" class="text-red-500 text-xs">*</span>
                                    <UBadge :label="getFieldTypeLabel(field.type)" variant="subtle" size="sm"
                                        class="ml-auto" />
                                </div>

                                <!-- Mini preview of the field -->
                                <div class="pointer-events-none">
                                    <UInput
                                        v-if="field.type === 'text' || field.type === 'email' || field.type === 'phone'"
                                        :placeholder="field.placeholder || field.label" disabled size="sm" />
                                    <UTextarea v-else-if="field.type === 'textarea'"
                                        :placeholder="field.placeholder || field.label" disabled size="sm" :rows="2" />
                                    <UInput v-else-if="field.type === 'number'" type="number"
                                        :placeholder="field.placeholder || field.label" disabled size="sm" />
                                    <UInput v-else-if="field.type === 'date'" type="date" disabled size="sm" />
                                    <USelect v-else-if="field.type === 'select'"
                                        :items="(field.options || []).map(o => ({ label: o.label, value: o.value }))"
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
                    </div>
                </div>
            </div>

            <!-- Preview Tab -->
            <div v-show="activeTab === 'preview'" class="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
                <div class="max-w-2xl mx-auto">
                    <UCard>
                        <template #header>
                            <h2 class="text-lg font-semibold">{{ previewTitle || 'Forma ko\'rinishi' }}</h2>
                        </template>
                        <FormRenderer v-if="fields.length" :fields="fields" :readonly="true" />
                        <div v-else class="text-center py-8 text-gray-400">
                            <p>Maydonlar qo'shilmagan</p>
                        </div>
                    </UCard>
                </div>
            </div>
        </div>

        <!-- Right: Properties Panel -->
        <FormsFieldPropertiesPanel v-if="activeTab === 'builder'" :field="selectedField" @update="onFieldUpdate"
            @delete="onFieldDelete" @close="selectedFieldId = null" />
    </div>
</template>

<script setup lang="ts">
import type { FormField, FormFieldType, FormSchema } from '~/types'

const props = defineProps<{
    initialSchema?: FormSchema
    previewTitle?: string
}>()

const emit = defineEmits<{
    'update:schema': [schema: FormSchema]
}>()

const activeTab = ref<'builder' | 'preview'>('builder')
const isDragOver = ref(false)
const selectedFieldId = ref<string | null>(null)
const dragSourceIndex = ref<number | null>(null)
const dragTargetIndex = ref<number | null>(null)

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
]

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

function getFieldTypeLabel(type: FormFieldType) {
    return fieldTypes.find((ft) => ft.type === type)?.label ?? type
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

// ─── Palette Drag ───
function onPaletteDragStart(e: DragEvent, type: FormFieldType) {
    e.dataTransfer!.effectAllowed = 'copy'
    e.dataTransfer!.setData('application/form-field-type', type)
}

// ─── Canvas Drop ───
function onDragOver(e: DragEvent) {
    isDragOver.value = true
    e.dataTransfer!.dropEffect = 'copy'
}

function onDragLeave() {
    isDragOver.value = false
}

function onCanvasDrop(e: DragEvent) {
    isDragOver.value = false
    const type = e.dataTransfer?.getData('application/form-field-type') as FormFieldType | undefined
    if (type) {
        const newField = createField(type)
        fields.value.push(newField)
        selectedFieldId.value = newField.id
    }
}

// ─── Field Reorder Drag ───
function onFieldDragStart(e: DragEvent, idx: number) {
    dragSourceIndex.value = idx
    e.dataTransfer!.effectAllowed = 'move'
    e.dataTransfer!.setData('application/form-field-move', String(idx))
}

function onFieldDragOver(e: DragEvent, idx: number) {
    const moveData = e.dataTransfer?.types.includes('application/form-field-move')
    if (moveData) {
        dragTargetIndex.value = idx
        e.dataTransfer!.dropEffect = 'move'
    } else {
        e.dataTransfer!.dropEffect = 'copy'
    }
}

function onFieldDrop(e: DragEvent, targetIdx: number) {
    // Reorder existing fields
    const moveData = e.dataTransfer?.getData('application/form-field-move')
    if (moveData !== undefined && moveData !== '') {
        const sourceIdx = Number(moveData)
        if (sourceIdx !== targetIdx) {
            const item = fields.value.splice(sourceIdx, 1)[0]
            fields.value.splice(targetIdx, 0, item)
        }
        dragSourceIndex.value = null
        dragTargetIndex.value = null
        return
    }

    // Drop new field from palette at position
    const type = e.dataTransfer?.getData('application/form-field-type') as FormFieldType | undefined
    if (type) {
        const newField = createField(type)
        fields.value.splice(targetIdx + 1, 0, newField)
        selectedFieldId.value = newField.id
    }
}

function onFieldDragEnd() {
    dragSourceIndex.value = null
    dragTargetIndex.value = null
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
    if (selectedFieldId.value === field.id) selectedFieldId.value = null
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
