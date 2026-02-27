<template>
    <UDashboardPanel id="settings-branches">
        <template #header>
            <UDashboardNavbar :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UNavigationMenu :items="settingsNavItems" highlight />
                </template>

                <template #description>
                    Filiallarni boshqarish
                </template>

                <template #right>
                    <UButton icon="i-lucide-plus" label="Yangi filial" @click="openCreateDialog" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div>
                <!-- Filters -->
                <UDashboardToolbar>
                    <template #left>
                        <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="Filial nomini qidirish..."
                            class="w-64" />
                    </template>

                    <template #right>
                        <UButton icon="i-lucide-refresh-cw" label="Yangilash" variant="outline"
                            @click="fetchBranches" />
                    </template>
                </UDashboardToolbar>

                <!-- Branches Table -->
                <UCard>
                    <template #header>
                        <h3 class="text-base font-semibold">Filiallar ro'yxati</h3>
                    </template>

                    <UTable :data="paginatedBranches" :columns="columns" :loading="loading"
                        :empty="'Filiallar topilmadi'" />

                    <template #footer>
                        <div class="flex items-center justify-between">
                            <div class="text-sm text-gray-500">
                                <span class="font-medium">{{ paginationStart }}</span> dan
                                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                                <span class="font-medium">{{ filteredBranches.length }}</span> ta filial
                            </div>

                            <UPagination v-if="filteredBranches.length > itemsPerPage" :model-value="currentPage"
                                :total="filteredBranches.length" :items-per-page="itemsPerPage" show-last show-first
                                @update:page="onPageChange" />
                        </div>
                    </template>
                </UCard>
            </div>

            <!-- Create/Edit Modal -->
            <UModal v-model:open="showDialog" :title="isEditMode ? 'Filialni tahrirlash' : 'Yangi filial'">
                <template #body>
                    <form @submit.prevent="saveBranch" class="space-y-4">
                        <div class="space-y-2">
                            <label class="block text-sm font-medium">
                                Filial nomi <span class="text-red-500">*</span>
                            </label>
                            <UInput v-model="form.name" placeholder="Filial nomi" required class="w-full" />
                        </div>

                        <div class="space-y-2">
                            <label class="block text-sm font-medium">Manzil</label>
                            <UInput v-model="form.address" placeholder="Manzil" class="w-full" />
                        </div>

                        <div>
                            <UCheckbox v-model="form.status" label="Faol" />
                        </div>
                    </form>
                </template>

                <template #footer="{ close }">
                    <div class="flex justify-end gap-2">
                        <UButton color="neutral" variant="outline" label="Bekor qilish" @click="close" />
                        <UButton :label="isSaving ? 'Saqlanmoqda...' : 'Saqlash'" :loading="isSaving"
                            @click="saveBranch" />
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
import type { Branch } from "~/types";

const UBadge = resolveComponent("UBadge");
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
];

definePageMeta({
    middleware: ["auth"],
});

const { apiService, auth } = useAuth();
const toast = useToast();
const router = useRouter();
const route = useRoute();

// State
const branches = ref<Branch[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = 10;
const showDialog = ref(false);
const selectedBranch = ref<Branch | null>(null);
const isEditMode = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const deletePopoverOpen = ref<Record<string, boolean>>({});

// Form
const form = reactive({
    name: "",
    address: "",
    status: true,
});

// Table columns
const columns: TableColumn<Branch>[] = [
    {
        accessorKey: "name",
        header: "Filial nomi",
        cell: ({ row }) => {
            return h("div", { class: "flex items-center gap-2" }, [
                h("span", { class: "i-lucide-building-2 text-primary h-4 w-4" }),
                h("span", { class: "font-medium" }, row.original.name),
            ]);
        },
    },
    {
        accessorKey: "address",
        header: "Manzil",
        cell: ({ row }) => row.original.address || "—",
    },
    {
        accessorKey: "status",
        header: "Holat",
        cell: ({ row }) => {
            return h(
                UBadge,
                { variant: row.original.status ? "solid" : "subtle" },
                () => (row.original.status ? "Faol" : "Faol emas"),
            );
        },
    },
    {
        accessorKey: "created_at",
        header: "Yaratilgan",
        cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
        id: "actions",
        header: "Amallar",
        cell: ({ row }) => {
            const branchId = row.original.id;
            return h("div", { class: "flex justify-end gap-1" }, [
                h(UButton, {
                    variant: "ghost",
                    icon: "i-lucide-pencil",
                    size: "sm",
                    square: true,
                    onClick: () => editBranch(row.original),
                }),
                h(
                    UPopover,
                    {
                        open: deletePopoverOpen.value[branchId] || false,
                        "onUpdate:open": (value: boolean) => {
                            deletePopoverOpen.value[branchId] = value;
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
                                h("p", { class: "text-sm text-gray-600" }, "Bu filialni butunlay o'chiradi. Bu amalni qaytarib bo'lmaydi."),
                                h("div", { class: "flex justify-end gap-2 mt-3" }, [
                                    h(UButton, {
                                        color: "neutral",
                                        variant: "subtle",
                                        label: "Bekor qilish",
                                        size: "sm",
                                        onClick: () => {
                                            deletePopoverOpen.value[branchId] = false;
                                        },
                                    }),
                                    h(UButton, {
                                        color: "error",
                                        label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                                        loading: isDeleting.value,
                                        size: "sm",
                                        onClick: async () => {
                                            await confirmDelete(row.original);
                                            deletePopoverOpen.value[branchId] = false;
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
const filteredBranches = computed(() => {
    return branches.value.filter((b) =>
        b.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
    );
});

const totalPages = computed(() => {
    return Math.max(1, Math.ceil(filteredBranches.value.length / itemsPerPage));
});

const paginatedBranches = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredBranches.value.slice(start, start + itemsPerPage);
});

const paginationStart = computed(() => {
    return filteredBranches.value.length === 0 ? 0 : (currentPage.value - 1) * itemsPerPage + 1;
});

const paginationEnd = computed(() => {
    return Math.min(currentPage.value * itemsPerPage, filteredBranches.value.length);
});

// Helpers
const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
};

// Fetch
const fetchBranches = async () => {
    loading.value = true;
    try {
        const ownerId = auth.value?.user?.id;
        const response = await api.get<any>(apiService.value, `/branches/`);
        branches.value = Array.isArray(response) ? response : response?.data || [];
    } catch (error) {
        console.error("Failed to fetch branches:", error);
        toast.add({
            title: "Xatolik",
            description: "Filiallarni yuklashda xatolik yuz berdi",
            color: "error",
        });
        branches.value = [];
    } finally {
        loading.value = false;
    }
};

// CRUD
const openCreateDialog = () => {
    isEditMode.value = false;
    resetForm();
    showDialog.value = true;
};

const editBranch = (branch: Branch) => {
    isEditMode.value = true;
    selectedBranch.value = branch;
    form.name = branch.name;
    form.address = branch.address || "";
    form.status = branch.status;
    showDialog.value = true;
};

const saveBranch = async () => {
    if (!form.name.trim()) {
        toast.add({
            title: "Xatolik",
            description: "Iltimos, filial nomini kiriting",
            color: "error",
        });
        return;
    }

    isSaving.value = true;
    try {
        const data = {
            name: form.name.trim(),
            address: form.address.trim() || undefined,
            status: form.status,
        };

        if (isEditMode.value && selectedBranch.value) {
            await api.patch(apiService.value, `/branches/${selectedBranch.value.id}`, data);
            toast.add({
                title: "Muvaffaqiyat",
                description: "Filial muvaffaqiyatli yangilandi",
                color: "success",
            });
        } else {
            await api.post(apiService.value, "/branches", data);
            toast.add({
                title: "Muvaffaqiyat",
                description: "Filial muvaffaqiyatli qo'shildi",
                color: "success",
            });
        }

        showDialog.value = false;
        resetForm();
        fetchBranches();
    } catch (error) {
        console.error("Failed to save branch:", error);
        toast.add({
            title: "Xatolik",
            description: "Filialni saqlashda xatolik yuz berdi",
            color: "error",
        });
    } finally {
        isSaving.value = false;
    }
};

const confirmDelete = async (branch: Branch) => {
    if (!branch) return;

    isDeleting.value = true;
    try {
        await api.delete(apiService.value, `/branches/${branch.id}`);
        toast.add({
            title: "Muvaffaqiyat",
            description: "Filial muvaffaqiyatli o'chirildi",
            color: "success",
        });
        fetchBranches();
    } catch (error) {
        console.error("Failed to delete branch:", error);
        toast.add({
            title: "Xatolik",
            description: "Filialni o'chirishda xatolik yuz berdi",
            color: "error",
        });
    } finally {
        isDeleting.value = false;
    }
};

const resetForm = () => {
    form.name = "";
    form.address = "";
    form.status = true;
    selectedBranch.value = null;
};

// Pagination
const onPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages.value) {
        currentPage.value = newPage;
        updateUrlParams();
    }
};

const updateUrlParams = () => {
    const query: Record<string, string> = { page: currentPage.value.toString() };
    if (searchQuery.value) query.search = searchQuery.value;
    router.push({ query });
};

// Init
onMounted(() => {
    if (route.query.page) currentPage.value = parseInt(route.query.page as string, 10);
    if (route.query.search) searchQuery.value = route.query.search as string;
    fetchBranches();
});

watch(searchQuery, () => {
    currentPage.value = 1;
    updateUrlParams();
});
</script>
