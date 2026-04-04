<template>
    <UDashboardPanel id="forms-edit">
        <template #header>
            <UDashboardNavbar :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UNavigationMenu :items="formsNavItems" highlight />
                </template>

                <template #description>
                    Formani tahrirlash
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
            <div v-if="isLoading" class="flex items-center justify-center py-16">
                <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>

            <div v-else-if="!form" class="text-center py-16 text-gray-400">
                <p class="text-lg">Forma topilmadi</p>
            </div>

            <div v-else class="h-full">
                <ClientOnly>
                    <VueformBuilder ref="builder$" @save="onBuilderSave" />
                </ClientOnly>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import type { Form } from "~/types";

definePageMeta({
    layout: "default",
    middleware: "auth",
});

const route = useRoute();
const formId = route.params.id as string;

const formsNavItems = computed<NavigationMenuItem[]>(() => [
    {
        label: "Formalar",
        icon: "i-lucide-file-text",
        to: "/forms",
    },
    {
        label: "Tahrirlash",
        icon: "i-lucide-pencil",
        to: `/forms/${formId}/edit`,
    },
]);

const toast = useToast();
const { getForm, updateForm } = useFormsApi();

const form = ref<Form | null>(null);
const title = ref("");
const saving = ref(false);
const isLoading = ref(false);
const builder$ = ref<any>(null);
const latestBuilderObject = ref<any>(null);

function onBuilderSave(builderObject: any) {
    latestBuilderObject.value = builderObject;
}

async function loadForm() {
    try {
        isLoading.value = true;
        form.value = await getForm(formId);
        title.value = form.value.title;

        await nextTick();

        setTimeout(() => {
            if (builder$.value && form.value?.schema) {
                builder$.value.load({
                    schema: form.value.schema,
                });
            }
        }, 500);
    } catch (error: any) {
        console.error("Failed to load form:", error);
        toast.add({
            title: "Xatolik",
            description: "Formani yuklashda xatolik yuz berdi",
            color: "error",
        });
    } finally {
        isLoading.value = false;
    }
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
        await updateForm(formId, {
            title: title.value,
            schema: builderObject.schema,
        });
        toast.add({
            title: "Yangilandi",
            description: "Forma muvaffaqiyatli yangilandi",
        });
        navigateTo("/forms");
    } catch (error: any) {
        console.error("Failed to update form:", error);
        toast.add({
            title: "Xatolik",
            description: "Formani yangilashda xatolik yuz berdi",
            color: "error",
        });
    } finally {
        saving.value = false;
    }
}

onMounted(() => {
    loadForm();
});
</script>
