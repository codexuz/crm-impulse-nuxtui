<template>
    <UDashboardPanel id="forms">
        <template #header>
            <UDashboardNavbar :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UNavigationMenu :items="formsNavItems" highlight />
                </template>

                <template #description>
                    Formalarni yaratish va javoblarni boshqarish
                </template>

                <template #right>
                    <UButton icon="i-lucide-plus" label="Forma yaratish" @click="navigateTo('/forms/create')" />
                </template>
            </UDashboardNavbar>

            <UDashboardToolbar>
                <template #left>
                    <UInput v-model="search" icon="i-lucide-search" placeholder="Formalarni qidirish..." class="w-64" />
                </template>
            </UDashboardToolbar>
        </template>

        <template #body>
            <div>
                <UCard>
                    <template #header>
                        <h3 class="text-base font-semibold">Formalar ro'yxati</h3>
                    </template>

                    <UTable :data="filteredForms" :columns="columns" :loading="isLoading"
                        :empty="'Formalar topilmadi'" />
                </UCard>
            </div>


        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn, NavigationMenuItem } from "@nuxt/ui";
import type { Form } from "~/types";

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
]);

const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UPopover = resolveComponent("UPopover");

const toast = useToast();
const { listForms, deleteForm } = useFormsApi();

const forms = ref<Form[]>([]);
const search = ref("");
const isLoading = ref(false);
const isDeleting = ref(false);
const deletePopoverOpen = ref<Record<string, boolean>>({});

const PUBLIC_URL = "https://forms.impulselc.uz";

const filteredForms = computed(() => {
    if (!search.value.trim()) return forms.value;
    const q = search.value.toLowerCase();
    return forms.value.filter((f) => f.title.toLowerCase().includes(q));
});

function publicUrl(id: string) {
    return `${PUBLIC_URL}/${id}`;
}

function copyLink(id: string) {
    navigator.clipboard.writeText(publicUrl(id));
    toast.add({
        title: "Nusxa olindi",
        description: "Havola nusxalandi",
    });
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

const columns: TableColumn<Form>[] = [
    {
        accessorKey: "title",
        header: "Nomi",
        cell: ({ row }) => {
            return h("span", { class: "font-medium" }, row.original.title);
        },
    },
    {
        accessorKey: "createdAt",
        header: "Yaratilgan",
        cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
        id: "link",
        header: "Havola",
        cell: ({ row }) => {
            return h("div", { class: "flex items-center gap-1" }, [
                h(
                    "span",
                    { class: "text-sm text-gray-500 truncate max-w-[200px]" },
                    publicUrl(row.original.id),
                ),
                h(UButton, {
                    variant: "ghost",
                    icon: "i-lucide-copy",
                    size: "xs",
                    square: true,
                    onClick: () => copyLink(row.original.id),
                }),
            ]);
        },
    },
    {
        id: "actions",
        header: "Amallar",
        cell: ({ row }) => {
            const formId = row.original.id;
            return h("div", { class: "flex items-center gap-1" }, [
                h(UButton, {
                    variant: "ghost",
                    icon: "i-lucide-bar-chart-3",
                    size: "sm",
                    square: true,
                    onClick: () => navigateTo(`/forms/${formId}/responses`),
                }),
                h(UButton, {
                    variant: "ghost",
                    icon: "i-lucide-pencil",
                    size: "sm",
                    square: true,
                    onClick: () => navigateTo(`/forms/${formId}/edit`),
                }),
                h(
                    UPopover,
                    {
                        open: deletePopoverOpen.value[formId] || false,
                        "onUpdate:open": (value: boolean) => {
                            deletePopoverOpen.value[formId] = value;
                        },
                    },
                    {
                        default: () =>
                            h(UButton, {
                                color: "error",
                                variant: "ghost",
                                icon: "i-lucide-trash-2",
                                size: "sm",
                                square: true,
                            }),
                        content: () =>
                            h("div", { class: "p-4 max-w-sm space-y-3" }, [
                                h(
                                    "h4",
                                    { class: "font-semibold text-sm" },
                                    "Ishonchingiz komilmi?",
                                ),
                                h(
                                    "p",
                                    { class: "text-sm text-gray-600" },
                                    "Bu formani va barcha javoblarni butunlay o'chiradi.",
                                ),
                                h("div", { class: "flex justify-end gap-2 mt-3" }, [
                                    h(UButton, {
                                        color: "neutral",
                                        variant: "subtle",
                                        label: "Bekor qilish",
                                        size: "sm",
                                        onClick: () => {
                                            deletePopoverOpen.value[formId] = false;
                                        },
                                    }),
                                    h(UButton, {
                                        color: "error",
                                        label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                                        loading: isDeleting.value,
                                        size: "sm",
                                        onClick: async () => {
                                            await handleDelete(formId);
                                            deletePopoverOpen.value[formId] = false;
                                        },
                                    }),
                                ]),
                            ]),
                    },
                ),
            ]);
        },
    },
];

async function loadForms() {
    try {
        isLoading.value = true;
        forms.value = await listForms();
    } catch (error: any) {
        console.error("Failed to load forms:", error);
        toast.add({
            title: "Xatolik",
            description: "Formalarni yuklashda xatolik yuz berdi",
            color: "error",
        });
    } finally {
        isLoading.value = false;
    }
}

async function handleDelete(id: string) {
    try {
        isDeleting.value = true;
        await deleteForm(id);
        toast.add({
            title: "O'chirildi",
            description: "Forma muvaffaqiyatli o'chirildi",
        });
        await loadForms();
    } catch (error: any) {
        console.error("Failed to delete form:", error);
        toast.add({
            title: "Xatolik",
            description: "Formani o'chirishda xatolik yuz berdi",
            color: "error",
        });
    } finally {
        isDeleting.value = false;
    }
}

onMounted(() => {
    loadForms();
});
</script>
