<template>
    <form v-if="fields.length" class="space-y-5" @submit.prevent="onSubmit">
        <div v-for="field in fields" :key="field.id" class="space-y-1.5">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ field.label }}
                <span v-if="field.required" class="text-red-500">*</span>
            </label>

            <!-- Text -->
            <UInput v-if="field.type === 'text'" v-model="formData[field.id]"
                :placeholder="field.placeholder || field.label" :disabled="readonly" :required="field.required" />

            <!-- Email -->
            <UInput v-else-if="field.type === 'email'" v-model="formData[field.id]" type="email"
                :placeholder="field.placeholder || field.label" :disabled="readonly" :required="field.required" />

            <!-- Phone -->
            <UInput v-else-if="field.type === 'phone'" v-model="formData[field.id]" type="tel"
                :placeholder="field.placeholder || field.label" :disabled="readonly" :required="field.required" />

            <!-- Number -->
            <UInput v-else-if="field.type === 'number'" v-model="formData[field.id]" type="number"
                :placeholder="field.placeholder || field.label" :disabled="readonly" :required="field.required" />

            <!-- Textarea -->
            <UTextarea v-else-if="field.type === 'textarea'" v-model="formData[field.id]"
                :placeholder="field.placeholder || field.label" :disabled="readonly" :required="field.required"
                :rows="3" />

            <!-- Date -->
            <UInput v-else-if="field.type === 'date'" v-model="formData[field.id]" type="date" :disabled="readonly"
                :required="field.required" />

            <!-- Select -->
            <USelect v-else-if="field.type === 'select'" v-model="formData[field.id]"
                :items="(field.options || []).map(o => ({ label: o.label, value: o.value }))" placeholder="Tanlang..."
                :disabled="readonly" :required="field.required" />

            <!-- Radio -->
            <div v-else-if="field.type === 'radio'" class="space-y-2">
                <label v-for="opt in field.options" :key="opt.value" class="flex items-center gap-2.5 cursor-pointer">
                    <input v-model="formData[field.id]" type="radio" :name="field.id" :value="opt.value"
                        :disabled="readonly" :required="field.required" class="accent-primary size-4" />
                    <span class="text-sm">{{ opt.label }}</span>
                </label>
            </div>

            <!-- Checkbox -->
            <div v-else-if="field.type === 'checkbox'" class="space-y-2">
                <label v-for="opt in field.options" :key="opt.value" class="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" :value="opt.value"
                        :checked="(formData[field.id] as string[] || []).includes(opt.value)" :disabled="readonly"
                        class="accent-primary size-4" @change="toggleCheckbox(field.id, opt.value)" />
                    <span class="text-sm">{{ opt.label }}</span>
                </label>
            </div>
        </div>

        <div v-if="!readonly" class="pt-2">
            <UButton type="submit" :label="submitLabel" :loading="loading" block />
        </div>
    </form>
</template>

<script setup lang="ts">
import type { FormField } from '~/types'

const props = withDefaults(defineProps<{
    fields: FormField[]
    readonly?: boolean
    loading?: boolean
    submitLabel?: string
}>(), {
    readonly: false,
    loading: false,
    submitLabel: 'Yuborish',
})

const emit = defineEmits<{
    submit: [data: Record<string, any>]
}>()

const formData = reactive<Record<string, any>>({})

// Initialize fields
watch(
    () => props.fields,
    (newFields) => {
        for (const f of newFields) {
            if (!(f.id in formData)) {
                formData[f.id] = f.type === 'checkbox' ? [] : ''
            }
        }
    },
    { immediate: true, deep: true },
)

function toggleCheckbox(fieldId: string, value: string) {
    if (!Array.isArray(formData[fieldId])) formData[fieldId] = []
    const arr = formData[fieldId] as string[]
    const idx = arr.indexOf(value)
    if (idx >= 0) arr.splice(idx, 1)
    else arr.push(value)
}

function onSubmit() {
    // Build answers keyed by field label for human-readable responses
    const answers: Record<string, any> = {}
    for (const field of props.fields) {
        answers[field.label] = formData[field.id]
    }
    emit('submit', answers)
}
</script>
