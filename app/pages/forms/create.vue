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
                    <UButton color="neutral" variant="subtle" label="Bekor qilish" @click="navigateTo('/forms')" />
                    <UButton :label="saving ? 'Saqlanmoqda...' : 'Saqlash'" :loading="saving" :disabled="!title.trim()"
                        @click="save" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="h-full">
                <ClientOnly>
                    <VueformBuilder ref="builder$" @save="onBuilderSave" />
                </ClientOnly>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

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
const saving = ref(false);
const builder$ = ref<any>(null);
const latestBuilderObject = ref<any>(null);

function onBuilderSave(builderObject: any) {
    latestBuilderObject.value = builderObject;
}

async function save() {
    if (!title.value.trim()) return;

    const builderObject = latestBuilderObject.value || builder$?.value?.builder;

    if (!builderObject || !builderObject.schema || Object.keys(builderObject.schema).length === 0) {
        toast.add({
            title: "Xatolik",
            description: "Forma maydonlarini qo'shing",
            color: "error",
        });
        return;
    }

    try {
        saving.value = true;
        const form = await createForm(title.value, builderObject.schema);
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
