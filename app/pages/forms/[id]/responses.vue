<template>
    <UDashboardPanel id="forms-responses">
        <template #header>
            <UDashboardNavbar :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UNavigationMenu :items="formsNavItems" highlight />
                </template>

                <template #description>
                    {{ form?.title ?? 'Forma' }} — Javoblar ({{ responses?.length ?? 0 }})
                </template>

                <template #right>
                    <UButton color="neutral" variant="subtle" icon="i-lucide-copy" label="Havola nusxalash"
                        @click="copyLink" />
                    <UButton icon="i-lucide-download" label="CSV yuklash" :disabled="!filteredResponses.length"
                        @click="exportCsv" />
                </template>
            </UDashboardNavbar>

            <UDashboardToolbar>
                <template #left>
                    <UInput v-model="search" icon="i-lucide-search" placeholder="Javoblarni qidirish..." class="w-64" />
                </template>
            </UDashboardToolbar>
        </template>

        <template #body>
            <div v-if="isLoading" class="flex items-center justify-center py-16">
                <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>

            <div v-else>
                <!-- Empty State -->
                <div v-if="!responses?.length" class="text-center py-16 text-gray-400">
                    <UIcon name="i-lucide-inbox" class="size-12 mx-auto mb-4" />
                    <p class="text-lg">Hali javoblar yo'q</p>
                    <p class="mt-2 text-sm">
                        Javoblarni yig'ish uchun ushbu havolani ulashing:
                    </p>
                    <code
                        class="inline-block mt-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded text-primary text-sm select-all">
            {{ publicUrl }}
          </code>
                </div>

                <!-- Responses Table -->
                <UCard v-else>
                    <template #header>
                        <h3 class="text-base font-semibold">Javoblar</h3>
                    </template>

                    <UTable :data="filteredResponses" :columns="columns" :loading="isLoading"
                        :empty="'Javoblar topilmadi'" />
                </UCard>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn, NavigationMenuItem } from "@nuxt/ui";
import type { Form, FormResponse } from "~/types";

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
        label: "Javoblar",
        icon: "i-lucide-bar-chart-3",
        to: `/forms/${formId}/responses`,
    },
]);

const UButton = resolveComponent("UButton");
const UPopover = resolveComponent("UPopover");

const toast = useToast();
const { getForm, getFormResponses, deleteResponse } = useFormsApi();

const form = ref<Form | null>(null);
const responses = ref<FormResponse[]>([]);
const search = ref("");
const isLoading = ref(false);
const isDeleting = ref(false);
const deletePopoverOpen = ref<Record<string, boolean>>({});

const PUBLIC_URL = "https://forms.impulselc.uz";
const publicUrl = computed(() => `${PUBLIC_URL}/${formId}`);

// ─── Compute columns from answer keys ───
const answerKeys = computed(() => {
    if (!responses.value?.length) return [];
    const keys = new Set<string>();
    for (const r of responses.value) {
        if (r.answers && typeof r.answers === "object") {
            Object.keys(r.answers).forEach((k) => keys.add(k));
        }
    }
    return Array.from(keys);
});

const filteredResponses = computed(() => {
    if (!search.value.trim()) return responses.value;
    const q = search.value.toLowerCase();
    return responses.value.filter((r) =>
        JSON.stringify(r.answers).toLowerCase().includes(q),
    );
});

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("uz-UZ", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("uz-UZ", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

const columns = computed<TableColumn<FormResponse>[]>(() => [
    {
        id: "index",
        header: "#",
        cell: ({ row }) => {
            const idx = filteredResponses.value.indexOf(row.original) + 1;
            return h("span", { class: "text-gray-500" }, String(idx));
        },
    },
    ...answerKeys.value.map(
        (key): TableColumn<FormResponse> => ({
            id: key,
            header: key,
            cell: ({ row }) => {
                const val = row.original.answers?.[key];
                if (val === undefined || val === null) return "—";
                if (typeof val === "object") {
                    return h(
                        "pre",
                        { class: "text-xs bg-gray-50 dark:bg-gray-800 rounded p-1 max-w-xs overflow-auto" },
                        JSON.stringify(val, null, 2),
                    );
                }
                return String(val);
            },
        }),
    ),
    {
        accessorKey: "createdAt",
        header: "Yuborilgan",
        cell: ({ row }) => {
            return h("div", {}, [
                h("span", { class: "text-sm" }, formatDate(row.original.createdAt)),
                h("br"),
                h("span", { class: "text-xs text-gray-400" }, formatTime(row.original.createdAt)),
            ]);
        },
    },
    {
        id: "actions",
        header: "Amallar",
        cell: ({ row }) => {
            const respId = row.original.id;
            return h(
                UPopover,
                {
                    open: deletePopoverOpen.value[respId] || false,
                    "onUpdate:open": (value: boolean) => {
                        deletePopoverOpen.value[respId] = value;
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
                            h("h4", { class: "font-semibold text-sm" }, "Javobni o'chirish?"),
                            h(
                                "p",
                                { class: "text-sm text-gray-600" },
                                "Bu javobni butunlay o'chiradi.",
                            ),
                            h("div", { class: "flex justify-end gap-2 mt-3" }, [
                                h(UButton, {
                                    color: "neutral",
                                    variant: "subtle",
                                    label: "Bekor qilish",
                                    size: "sm",
                                    onClick: () => {
                                        deletePopoverOpen.value[respId] = false;
                                    },
                                }),
                                h(UButton, {
                                    color: "error",
                                    label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                                    loading: isDeleting.value,
                                    size: "sm",
                                    onClick: async () => {
                                        await handleDeleteResponse(respId);
                                        deletePopoverOpen.value[respId] = false;
                                    },
                                }),
                            ]),
                        ]),
                },
            );
        },
    },
]);

function copyLink() {
    navigator.clipboard.writeText(publicUrl.value);
    toast.add({
        title: "Nusxa olindi",
        description: "Havola nusxalandi",
    });
}

function exportCsv() {
    if (!filteredResponses.value.length) return;
    const header = ["#", "Yuborilgan", ...answerKeys.value];
    const rows = filteredResponses.value.map((r, i) => [
        i + 1,
        new Date(r.createdAt).toLocaleString(),
        ...answerKeys.value.map((col) => {
            const val = r.answers?.[col];
            return typeof val === "object" ? JSON.stringify(val) : String(val ?? "");
        }),
    ]);
    const csv = [header, ...rows]
        .map((row) =>
            row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${form.value?.title ?? "forma"}-javoblar.csv`;
    link.click();
}

async function loadData() {
    try {
        isLoading.value = true;
        const [formData, responsesData] = await Promise.all([
            getForm(formId),
            getFormResponses(formId),
        ]);
        form.value = formData;
        responses.value = responsesData;
    } catch (error: any) {
        console.error("Failed to load data:", error);
        toast.add({
            title: "Xatolik",
            description: "Ma'lumotlarni yuklashda xatolik yuz berdi",
            color: "error",
        });
    } finally {
        isLoading.value = false;
    }
}

async function handleDeleteResponse(id: string) {
    try {
        isDeleting.value = true;
        await deleteResponse(id);
        toast.add({
            title: "O'chirildi",
            description: "Javob muvaffaqiyatli o'chirildi",
        });
        responses.value = responses.value.filter((r) => r.id !== id);
    } catch (error: any) {
        console.error("Failed to delete response:", error);
        toast.add({
            title: "Xatolik",
            description: "Javobni o'chirishda xatolik yuz berdi",
            color: "error",
        });
    } finally {
        isDeleting.value = false;
    }
}

onMounted(() => {
    loadData();
});
</script>
