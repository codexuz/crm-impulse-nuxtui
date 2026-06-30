<template>
    <UDashboardPanel id="forms-create">
        <template #header>
            <UDashboardNavbar :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UNavigationMenu :items="formsNavItems" highlight />
                </template>

                <template #description>
                    Yangi forma yaratish
                </template>

                <template #right>
                    <UFormField label="Forma nomi" class="min-w-64">
                        <UInput v-model="title" placeholder="Forma nomi" size="sm" />
                    </UFormField>
                    <UFormField label="SMS tasdiqlash">
                        <USwitch v-model="smsVerification" size="sm" />
                    </UFormField>
                    <UButton color="neutral" variant="subtle" label="Bekor qilish" @click="navigateTo('/forms')" />
                    <UButton :label="saving ? 'Saqlanmoqda...' : 'Saqlash'" :loading="saving" :disabled="!title.trim()"
                        @click="save" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="h-full">
                <FormsFormBuilder ref="builder$" :preview-title="title" @update:schema="onSchemaUpdate" />
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import type { FormSchema } from "~/types";

definePageMeta({
    layout: "default",
    middleware: "auth",
});

const formsNavItems = computed<NavigationMenuItem[]>(() => [
    {
        label: "Formalar",
        icon: "i-lucide-file-text",
        to: "/forms",
    },
    {
        label: "Yaratish",
        icon: "i-lucide-plus",
        to: "/forms/create",
    },
]);

const toast = useToast();
const { createForm } = useFormsApi();

const title = ref("");
const smsVerification = ref(false);
const saving = ref(false);
const builder$ = ref<any>(null);
const currentSchema = ref<FormSchema | null>(null);

function onSchemaUpdate(schema: FormSchema) {
    currentSchema.value = schema;
}

async function save() {
    if (!title.value.trim()) return;

    const schema = currentSchema.value || builder$?.value?.getSchema();

    if (!schema || !schema.fields || schema.fields.length === 0) {
        toast.add({
            title: "Xatolik",
            description: "Forma maydonlarini qo'shing",
            color: "error",
        });
        return;
    }

    try {
        saving.value = true;
        const form = await createForm(title.value, schema, smsVerification.value);
        toast.add({
            title: "Yaratildi",
            description: "Forma muvaffaqiyatli yaratildi",
        });
        navigateTo(`/forms/${form.id}/responses`);
    } catch (error: any) {
        console.error("Failed to create form:", error);
        toast.add({
            title: "Xatolik",
            description: "Formani yaratishda xatolik yuz berdi",
            color: "error",
        });
    } finally {
        saving.value = false;
    }
}
</script>
