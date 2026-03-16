<template>
    <UDashboardPanel id="settings-notifications">
        <template #header>
            <UDashboardNavbar :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UNavigationMenu :items="settingsNavItems" highlight />
                </template>

                <template #description>
                    Bildirishnomalarni boshqarish
                </template>

                <template #right>
                    <UButton icon="i-lucide-smartphone" label="App yangilanishi" variant="outline"
                        @click="openAppUpdateModal" />
                    <UButton icon="i-lucide-send" label="Bildirishnoma yuborish" @click="openSendModal" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div>
                <!-- Filters -->
                <UDashboardToolbar>
                    <template #left>
                        <UInput v-model="searchQuery" icon="i-lucide-search"
                            placeholder="Sarlavha yoki xabar bo'yicha qidirish..." class="w-72" />
                    </template>

                    <template #right>
                        <UButton icon="i-lucide-refresh-cw" label="Yangilash" variant="outline"
                            @click="fetchNotifications" />
                    </template>
                </UDashboardToolbar>

                <!-- Table -->
                <UCard>
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h3 class="text-base font-semibold">Bildirishnomalar ro'yxati</h3>
                            <div v-if="selectedRowsCount > 0" class="flex items-center gap-2">
                                <span class="text-sm text-muted">{{ selectedRowsCount }} ta tanlandi</span>
                                <UButton color="error" variant="outline" icon="i-lucide-trash-2" label="O'chirish"
                                    size="sm" :loading="isBulkDeleting" @click="bulkDeleteNotifications" />
                            </div>
                        </div>
                    </template>

                    <UTable ref="table" v-model:row-selection="rowSelection" :data="notifications" :columns="columns"
                        :loading="loading" :empty="'Bildirishnomalar topilmadi'" />

                    <template #footer>
                        <div class="flex items-center justify-between">
                            <div class="text-sm text-gray-500">
                                <span class="font-medium">{{ paginationStart }}</span> dan
                                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                                <span class="font-medium">{{ total }}</span> ta bildirishnoma
                            </div>

                            <UPagination v-if="total > itemsPerPage" :model-value="currentPage" :total="total"
                                :items-per-page="itemsPerPage" show-last show-first @update:page="onPageChange" />
                        </div>
                    </template>
                </UCard>
            </div>

            <!-- Send Notification Modal -->
            <UModal v-model:open="showSendModal" title="Bildirishnoma yuborish">
                <template #body>
                    <form @submit.prevent="sendNotification" class="space-y-4">
                        <div class="space-y-2">
                            <label class="block text-sm font-medium">
                                Sarlavha <span class="text-red-500">*</span>
                            </label>
                            <UInput v-model="sendForm.title" placeholder="Bildirishnoma sarlavhasi" class="w-full" />
                        </div>

                        <div class="space-y-2">
                            <label class="block text-sm font-medium">
                                Xabar <span class="text-red-500">*</span>
                            </label>
                            <UTextarea v-model="sendForm.body" placeholder="Bildirishnoma matni" :rows="4"
                                class="w-full" />
                        </div>

                        <div class="space-y-2">
                            <label class="block text-sm font-medium">
                                Qo'shimcha ma'lumot (JSON)
                            </label>
                            <UTextarea v-model="dataJsonInput" placeholder='{"key": "value"}' :rows="3"
                                class="w-full font-mono text-sm" />
                            <p v-if="dataJsonError" class="text-xs text-red-500">{{ dataJsonError }}</p>
                        </div>
                    </form>
                </template>

                <template #footer="{ close }">
                    <div class="flex justify-end gap-2">
                        <UButton color="neutral" variant="outline" label="Bekor qilish" @click="close" />
                        <UButton icon="i-lucide-send" :label="isSending ? 'Yuborilmoqda...' : 'Yuborish'"
                            :loading="isSending" @click="sendNotification" />
                    </div>
                </template>
            </UModal>

            <!-- App Update Modal -->
            <UModal v-model:open="showAppUpdateModal" title="App yangilanish bildirishnomasi">
                <template #body>
                    <form @submit.prevent="sendAppUpdate" class="space-y-4">
                        <div class="space-y-2">
                            <label class="block text-sm font-medium">
                                Maxsus xabar
                            </label>
                            <UTextarea v-model="appUpdateForm.customMessage" placeholder="Yangi versiya haqida xabar..."
                                :rows="4" class="w-full" />
                        </div>

                        <div class="space-y-2">
                            <label class="block text-sm font-medium">
                                Play Store URL
                            </label>
                            <UInput v-model="appUpdateForm.playStoreUrl"
                                placeholder="https://play.google.com/store/apps/details?id=..." class="w-full" />
                        </div>
                    </form>
                </template>

                <template #footer="{ close }">
                    <div class="flex justify-end gap-2">
                        <UButton color="neutral" variant="outline" label="Bekor qilish" @click="close" />
                        <UButton icon="i-lucide-smartphone" :label="isSendingAppUpdate ? 'Yuborilmoqda...' : 'Yuborish'"
                            :loading="isSendingAppUpdate" @click="sendAppUpdate" />
                    </div>
                </template>
            </UModal>

            <!-- View Notification Modal -->
            <UModal v-model:open="showViewModal" title="Bildirishnoma ma'lumotlari">
                <template #body>
                    <div class="space-y-4" v-if="selectedNotification">
                        <div class="space-y-1">
                            <p class="text-xs text-gray-500 uppercase font-semibold tracking-wide">Sarlavha</p>
                            <p class="text-sm font-medium">{{ selectedNotification.title }}</p>
                        </div>
                        <div class="space-y-1">
                            <p class="text-xs text-gray-500 uppercase font-semibold tracking-wide">Xabar</p>
                            <p class="text-sm whitespace-pre-wrap">{{ selectedNotification.body }}</p>
                        </div>
                        <div v-if="selectedNotification.data && Object.keys(selectedNotification.data).length > 0"
                            class="space-y-1">
                            <p class="text-xs text-gray-500 uppercase font-semibold tracking-wide">Qo'shimcha
                                ma'lumot</p>
                            <pre
                                class="text-xs bg-gray-100 dark:bg-gray-800 rounded-md p-3 overflow-auto">{{ JSON.stringify(selectedNotification.data, null, 2) }}</pre>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <p class="text-xs text-gray-500 uppercase font-semibold tracking-wide">Yaratilgan</p>
                                <p class="text-sm">{{ formatDateTime(selectedNotification.createdAt) }}</p>
                            </div>
                            <div class="space-y-1">
                                <p class="text-xs text-gray-500 uppercase font-semibold tracking-wide">Yangilangan</p>
                                <p class="text-sm">{{ formatDateTime(selectedNotification.updatedAt) }}</p>
                            </div>
                        </div>
                    </div>
                </template>

                <template #footer="{ close }">
                    <div class="flex justify-end">
                        <UButton color="neutral" variant="outline" label="Yopish" @click="close" />
                    </div>
                </template>
            </UModal>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn, NavigationMenuItem } from "@nuxt/ui";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const UCheckbox = resolveComponent("UCheckbox");
const UButton = resolveComponent("UButton");
const UPopover = resolveComponent("UPopover");


const settingsNavItems: NavigationMenuItem[] = [
    {
        label: "Filiallar",
        icon: "i-lucide-building-2",
        to: "/settings",
    },
    {
        label: "Lavozimlar",
        icon: "i-lucide-shield",
        to: "/settings/roles",
    },
    {
        label: "Bildirishnomalar",
        icon: "i-lucide-bell",
        to: "/settings/notifications",
    },
];

definePageMeta({
    middleware: ["auth"],
});

const { apiService } = useAuth();
const toast = useToast();
const router = useRouter();
const route = useRoute();

interface Notification {
    id: string;
    title: string;
    body: string;
    data: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
}

// State
const notifications = ref<Notification[]>([]);
const total = ref(0);
const totalPages = ref(1);
const loading = ref(true);
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = 10;

// Modal states
const showSendModal = ref(false);
const showAppUpdateModal = ref(false);
const showViewModal = ref(false);
const selectedNotification = ref<Notification | null>(null);
const isSending = ref(false);
const isSendingAppUpdate = ref(false);
const isDeleting = ref(false);
const isBulkDeleting = ref(false);
const deletePopoverOpen = ref<Record<string, boolean>>({});
const rowSelection = ref({});
const table = useTemplateRef<{ tableApi?: any }>("table");

// Send form
const sendForm = reactive({
    title: "",
    body: "",
});
const dataJsonInput = ref("");
const dataJsonError = ref("");

// App update form
const appUpdateForm = reactive({
    customMessage: "",
    playStoreUrl: "https://play.google.com/store/apps/details?id=edu.impulse.uz",
});

// Table columns
const columns: TableColumn<Notification>[] = [
    {
        id: "select",
        header: ({ table }: any) =>
            h(UCheckbox, {
                modelValue: table.getIsSomePageRowsSelected()
                    ? "indeterminate"
                    : table.getIsAllPageRowsSelected(),
                "onUpdate:modelValue": (value: boolean | "indeterminate") =>
                    table.toggleAllPageRowsSelected(!!value),
                "aria-label": "Select all",
            }),
        cell: ({ row }: any) =>
            h(UCheckbox, {
                modelValue: row.getIsSelected(),
                "onUpdate:modelValue": (value: boolean | "indeterminate") =>
                    row.toggleSelected(!!value),
                "aria-label": "Select row",
            }),
    },
    {
        accessorKey: "title",
        header: "Sarlavha",
        cell: ({ row }) =>
            h("span", { class: "font-medium" }, row.original.title),
    },
    {
        accessorKey: "body",
        header: "Xabar",
        cell: ({ row }) =>
            h("span", { class: "line-clamp-2 max-w-xs text-sm text-gray-600 dark:text-gray-400" }, row.original.body),
    },
    {
        accessorKey: "createdAt",
        header: "Yuborilgan sana",
        cell: ({ row }) => formatDateTime(row.original.createdAt),
    },
    {
        id: "actions",
        header: "Amallar",
        cell: ({ row }) => {
            const notifId = row.original.id;
            return h("div", { class: "flex justify-end gap-1" }, [
                h(UButton, {
                    variant: "ghost",
                    icon: "i-lucide-eye",
                    size: "sm",
                    square: true,
                    onClick: () => viewNotification(row.original),
                }),
                h(
                    UPopover,
                    {
                        open: deletePopoverOpen.value[notifId] || false,
                        "onUpdate:open": (value: boolean) => {
                            deletePopoverOpen.value[notifId] = value;
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
                                h("h4", { class: "font-semibold text-sm" }, "Ishonchingiz komilmi?"),
                                h("p", { class: "text-sm text-gray-600" }, "Bu bildirishnomani o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi."),
                                h("div", { class: "flex justify-end gap-2 mt-3" }, [
                                    h(UButton, {
                                        color: "neutral",
                                        variant: "subtle",
                                        label: "Bekor qilish",
                                        size: "sm",
                                        onClick: () => {
                                            deletePopoverOpen.value[notifId] = false;
                                        },
                                    }),
                                    h(UButton, {
                                        color: "error",
                                        label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                                        loading: isDeleting.value,
                                        size: "sm",
                                        onClick: async () => {
                                            await deleteNotification(row.original.id);
                                            deletePopoverOpen.value[notifId] = false;
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

// Computed
const selectedRowsCount = computed((): number => {
    return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0;
});

const paginationStart = computed(() =>
    total.value === 0 ? 0 : (currentPage.value - 1) * itemsPerPage + 1,
);

const paginationEnd = computed(() =>
    Math.min(currentPage.value * itemsPerPage, total.value),
);

// Helpers
const formatDateTime = (dateString: string) => {
    if (!dateString) return "—";
    return new Intl.DateTimeFormat("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(dateString));
};

// Fetch
const fetchNotifications = async (page = currentPage.value) => {
    loading.value = true;
    try {
        const params = new URLSearchParams({
            page: String(page),
            limit: String(itemsPerPage),
        });
        if (searchQuery.value.trim()) params.set("search", searchQuery.value.trim());
        const response = await api.get<{ data: Notification[]; total: number; page: number; limit: number; totalPages: number }>(
            apiService.value,
            `/notifications?${params.toString()}`,
        );
        notifications.value = Array.isArray(response) ? response : (response?.data ?? []);
        total.value = response?.total ?? notifications.value.length;
        totalPages.value = response?.totalPages ?? 1;
        currentPage.value = page;
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        toast.add({ title: "Xatolik", description: "Bildirishnomalarni yuklashda xatolik yuz berdi", color: "error" });
        notifications.value = [];
    } finally {
        loading.value = false;
    }
};

const deleteNotification = async (id: string) => {
    isDeleting.value = true;
    try {
        await api.delete(apiService.value, `/notifications/${id}`);
        toast.add({ title: "Muvaffaqiyat", description: "Bildirishnoma muvaffaqiyatli o'chirildi", color: "success" });
        fetchNotifications(currentPage.value);
    } catch (error) {
        console.error("Failed to delete notification:", error);
        toast.add({ title: "Xatolik", description: "Bildirishnomani o'chirishda xatolik yuz berdi", color: "error" });
    } finally {
        isDeleting.value = false;
    }
};

const bulkDeleteNotifications = async () => {
    const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().rows || [];
    if (selectedRows.length === 0) return;

    isBulkDeleting.value = true;
    try {
        await Promise.all(
            selectedRows.map((row: any) => api.delete(apiService.value, `/notifications/${row.original.id}`)),
        );
        toast.add({ title: "Muvaffaqiyat", description: `${selectedRows.length} ta bildirishnoma o'chirildi`, color: "success" });
        rowSelection.value = {};
        fetchNotifications(currentPage.value);
    } catch (error) {
        console.error("Failed to bulk delete notifications:", error);
        toast.add({ title: "Xatolik", description: "Bildirishnomalarni o'chirishda xatolik yuz berdi", color: "error" });
    } finally {
        isBulkDeleting.value = false;
    }
};

// Actions
const viewNotification = (notification: Notification) => {
    selectedNotification.value = notification;
    showViewModal.value = true;
};

const openSendModal = () => {
    sendForm.title = "";
    sendForm.body = "";
    dataJsonInput.value = "";
    dataJsonError.value = "";
    showSendModal.value = true;
};

const openAppUpdateModal = () => {
    appUpdateForm.customMessage = "";
    appUpdateForm.playStoreUrl = "https://play.google.com/store/apps/details?id=edu.impulse.uz";
    showAppUpdateModal.value = true;
};

const sendNotification = async () => {
    if (!sendForm.title.trim() || !sendForm.body.trim()) {
        toast.add({ title: "Xatolik", description: "Sarlavha va xabar maydoni to'ldirilishi shart", color: "error" });
        return;
    }

    let parsedData: Record<string, unknown> | undefined;
    if (dataJsonInput.value.trim()) {
        try {
            parsedData = JSON.parse(dataJsonInput.value.trim());
            dataJsonError.value = "";
        } catch {
            dataJsonError.value = "JSON format noto'g'ri";
            return;
        }
    }

    isSending.value = true;
    try {
        await api.post(apiService.value, "/notifications", {
            title: sendForm.title.trim(),
            body: sendForm.body.trim(),
            ...(parsedData !== undefined && { data: parsedData }),
        });
        toast.add({ title: "Muvaffaqiyat", description: "Bildirishnoma muvaffaqiyatli yuborildi", color: "success" });
        showSendModal.value = false;
        fetchNotifications(1);
    } catch (error) {
        console.error("Failed to send notification:", error);
        toast.add({ title: "Xatolik", description: "Bildirishnoma yuborishda xatolik yuz berdi", color: "error" });
    } finally {
        isSending.value = false;
    }
};

const sendAppUpdate = async () => {
    isSendingAppUpdate.value = true;
    try {
        await api.post(apiService.value, "/notifications/app-update", {
            ...(appUpdateForm.customMessage.trim() && { customMessage: appUpdateForm.customMessage.trim() }),
            ...(appUpdateForm.playStoreUrl.trim() && { playStoreUrl: appUpdateForm.playStoreUrl.trim() }),
        });
        toast.add({ title: "Muvaffaqiyat", description: "App yangilanish bildirishnomasi yuborildi", color: "success" });
        showAppUpdateModal.value = false;
        fetchNotifications(1);
    } catch (error) {
        console.error("Failed to send app update:", error);
        toast.add({ title: "Xatolik", description: "App yangilanish bildirishnomasi yuborishda xatolik yuz berdi", color: "error" });
    } finally {
        isSendingAppUpdate.value = false;
    }
};

// Pagination
const onPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages.value) {
        fetchNotifications(newPage);
    }
};

// Init
onMounted(() => {
    fetchNotifications(1);
});

watch(searchQuery, () => {
    fetchNotifications(1);
});
</script>
