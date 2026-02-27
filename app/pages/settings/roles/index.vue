<template>
    <UDashboardPanel id="settings-roles">
        <template #header>
            <UDashboardNavbar :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UNavigationMenu :items="settingsNavItems" highlight />
                </template>

                <template #description>
                    Lavozimlarni boshqarish
                </template>

                <template #right>
                    <UButton icon="i-lucide-plus" label="Yangi lavozim" @click="openCreateDialog" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div>
                <!-- Filters -->
                <UDashboardToolbar>
                    <template #left>
                        <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="Lavozim nomini qidirish..."
                            class="w-64" />
                    </template>

                    <template #right>
                        <UButton icon="i-lucide-refresh-cw" label="Yangilash" variant="outline" @click="fetchRoles" />
                    </template>
                </UDashboardToolbar>

                <!-- Roles Table -->
                <UCard>
                    <template #header>
                        <h3 class="text-base font-semibold">Lavozimlar ro'yxati</h3>
                    </template>

                    <UTable :data="paginatedRoles" :columns="columns" :loading="loading"
                        :empty="'Lavozimlar topilmadi'" />

                    <template #footer>
                        <div class="flex items-center justify-between">
                            <div class="text-sm text-gray-500">
                                <span class="font-medium">{{ paginationStart }}</span> dan
                                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                                <span class="font-medium">{{ filteredRoles.length }}</span> ta lavozim
                            </div>

                            <UPagination v-if="filteredRoles.length > itemsPerPage" :model-value="currentPage"
                                :total="filteredRoles.length" :items-per-page="itemsPerPage" show-last show-first
                                @update:page="onPageChange" />
                        </div>
                    </template>
                </UCard>
            </div>

            <!-- Create/Edit Role Modal -->
            <UModal v-model:open="showDialog" :title="isEditMode ? 'Lavozimni tahrirlash' : 'Yangi lavozim'">
                <template #body>
                    <form @submit.prevent="saveRole" class="space-y-4">
                        <div class="space-y-2">
                            <label class="block text-sm font-medium">
                                Lavozim nomi <span class="text-red-500">*</span>
                            </label>
                            <UInput v-model="form.name" placeholder="Masalan: moderator" required class="w-full" />
                        </div>

                        <div class="space-y-2">
                            <label class="block text-sm font-medium">Ta'rif</label>
                            <UTextarea v-model="form.description" placeholder="Lavozim ta'rifi" :rows="3"
                                class="w-full" />
                        </div>

                        <div>
                            <UCheckbox v-model="form.isActive" label="Faol" />
                        </div>
                    </form>
                </template>

                <template #footer="{ close }">
                    <div class="flex justify-end gap-2">
                        <UButton color="neutral" variant="outline" label="Bekor qilish" @click="close" />
                        <UButton :label="isSaving ? 'Saqlanmoqda...' : 'Saqlash'" :loading="isSaving"
                            @click="saveRole" />
                    </div>
                </template>
            </UModal>

            <!-- Assign Role to User Modal -->
            <UModal v-model:open="showAssignDialog" title="Foydalanuvchiga lavozim biriktirish">
                <template #body>
                    <form @submit.prevent="assignRole" class="space-y-4">
                        <div class="space-y-2">
                            <label class="block text-sm font-medium">
                                Foydalanuvchi <span class="text-red-500">*</span>
                            </label>
                            <USelectMenu v-model="selectedUser" v-model:search-term="userSearchTerm"
                                :items="userOptions" :loading="isLoadingUsers" searchable ignore-filter
                                searchable-placeholder="Ism yoki telefon raqami..."
                                placeholder="Foydalanuvchini tanlang" class="w-full" />
                            <p class="text-xs text-gray-500">
                                Qidirish uchun kamida 2 ta harf kiriting
                            </p>
                        </div>

                        <div class="space-y-2">
                            <label class="block text-sm font-medium">
                                Lavozim <span class="text-red-500">*</span>
                            </label>
                            <USelectMenu v-model="assignForm.roleId" :items="roleOptions"
                                placeholder="Lavozimni tanlang" class="w-full" />
                        </div>

                        <div class="space-y-2">
                            <label class="block text-sm font-medium">Amal qilish muddati (ixtiyoriy)</label>
                            <UInput v-model="assignForm.expiresAt" type="date" class="w-full" />
                        </div>
                    </form>
                </template>

                <template #footer="{ close }">
                    <div class="flex justify-end gap-2">
                        <UButton color="neutral" variant="outline" label="Bekor qilish" @click="close" />
                        <UButton :label="isAssigning ? 'Biriktirilmoqda...' : 'Biriktirish'" :loading="isAssigning"
                            @click="assignRole" />
                    </div>
                </template>
            </UModal>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn, NavigationMenuItem } from "@nuxt/ui";
import { refDebounced } from "@vueuse/core";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import type { Role } from "~/types";

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

const { apiService } = useAuth();
const toast = useToast();
const router = useRouter();
const route = useRoute();

// State
const roles = ref<Role[]>([]);
const users = ref<any[]>([]);
const userSearchTerm = ref("");
const userSearchDebounced = refDebounced(userSearchTerm, 300);
const isLoadingUsers = ref(false);
const selectedUser = ref<any>(null);
const loading = ref(true);
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = 10;
const showDialog = ref(false);
const showAssignDialog = ref(false);
const selectedRole = ref<Role | null>(null);
const isEditMode = ref(false);
const isSaving = ref(false);
const isAssigning = ref(false);
const isDeleting = ref(false);
const deletePopoverOpen = ref<Record<string, boolean>>({});

// Form
const form = reactive({
    name: "",
    description: "",
    isActive: true,
});

const assignForm = reactive({
    userId: "",
    roleId: null as number | null,
    expiresAt: "",
});

// Computed
const userOptions = computed(() =>
    users.value.map((u) => ({
        label: `${u.first_name} ${u.last_name} (${u.phone})`,
        value: u.user_id || u.id,
    })),
);

const roleOptions = computed(() =>
    roles.value.map((r) => ({
        label: r.name,
        value: r.id,
    })),
);

// Table columns
const columns: TableColumn<Role>[] = [
    {
        accessorKey: "name",
        header: "Nomi",
        cell: ({ row }) => {
            return h("div", {
                class: "flex items-center gap-2 cursor-pointer",
                onClick: () => router.push(`/settings/roles/${row.original.id}?name=${encodeURIComponent(row.original.name)}`),
            }, [
                h("span", { class: "i-lucide-shield text-primary h-4 w-4" }),
                h("span", { class: "font-medium capitalize text-primary hover:underline" }, row.original.name),
            ]);
        },
    },
    {
        accessorKey: "description",
        header: "Ta'rif",
        cell: ({ row }) => row.original.description || "—",
    },
    {
        accessorKey: "isActive",
        header: "Holat",
        cell: ({ row }) => {
            return h(
                UBadge,
                { variant: row.original.isActive ? "solid" : "subtle" },
                () => (row.original.isActive ? "Faol" : "Faol emas"),
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: "Yaratilgan",
        cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
        id: "actions",
        header: "Amallar",
        cell: ({ row }) => {
            const roleId = String(row.original.id);
            return h("div", { class: "flex justify-end gap-1" }, [
                h(UButton, {
                    variant: "ghost",
                    icon: "i-lucide-users",
                    size: "sm",
                    square: true,
                    title: "Foydalanuvchilarni ko'rish",
                    onClick: () => router.push(`/settings/roles/${roleId}?name=${encodeURIComponent(row.original.name)}`),
                }),
                h(UButton, {
                    variant: "ghost",
                    icon: "i-lucide-user-plus",
                    size: "sm",
                    square: true,
                    title: "Foydalanuvchiga biriktirish",
                    onClick: () => openAssignDialog(row.original),
                }),
                h(UButton, {
                    variant: "ghost",
                    icon: "i-lucide-pencil",
                    size: "sm",
                    square: true,
                    onClick: () => editRole(row.original),
                }),
                h(
                    UPopover,
                    {
                        open: deletePopoverOpen.value[roleId] || false,
                        "onUpdate:open": (value: boolean) => {
                            deletePopoverOpen.value[roleId] = value;
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
                                h("p", { class: "text-sm text-gray-600" }, "Bu lavozimni butunlay o'chiradi. Bu amalni qaytarib bo'lmaydi."),
                                h("div", { class: "flex justify-end gap-2 mt-3" }, [
                                    h(UButton, {
                                        color: "neutral",
                                        variant: "subtle",
                                        label: "Bekor qilish",
                                        size: "sm",
                                        onClick: () => {
                                            deletePopoverOpen.value[roleId] = false;
                                        },
                                    }),
                                    h(UButton, {
                                        color: "error",
                                        label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                                        loading: isDeleting.value,
                                        size: "sm",
                                        onClick: async () => {
                                            await confirmDelete(row.original);
                                            deletePopoverOpen.value[roleId] = false;
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
const filteredRoles = computed(() => {
    return roles.value.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.value.toLowerCase())),
    );
});

const totalPages = computed(() => {
    return Math.max(1, Math.ceil(filteredRoles.value.length / itemsPerPage));
});

const paginatedRoles = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredRoles.value.slice(start, start + itemsPerPage);
});

const paginationStart = computed(() => {
    return filteredRoles.value.length === 0 ? 0 : (currentPage.value - 1) * itemsPerPage + 1;
});

const paginationEnd = computed(() => {
    return Math.min(currentPage.value * itemsPerPage, filteredRoles.value.length);
});

// Helpers
const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
};

// Fetch
const fetchRoles = async () => {
    loading.value = true;
    try {
        const response = await api.get<any>(apiService.value, "/users/roles");
        roles.value = Array.isArray(response) ? response : response?.data || [];
    } catch (error) {
        console.error("Failed to fetch roles:", error);
        toast.add({
            title: "Xatolik",
            description: "Lavozimlarni yuklashda xatolik yuz berdi",
            color: "error",
        });
        roles.value = [];
    } finally {
        loading.value = false;
    }
};

const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
        users.value = [];
        return;
    }

    isLoadingUsers.value = true;
    try {
        const response = await api.get<{ data: any[]; total: number }>(
            apiService.value,
            `/users?query=${encodeURIComponent(query)}`,
        );
        users.value = response.data || [];
    } catch (error) {
        console.error("Failed to search users:", error);
        users.value = [];
    } finally {
        isLoadingUsers.value = false;
    }
};

// CRUD
const openCreateDialog = () => {
    isEditMode.value = false;
    resetForm();
    showDialog.value = true;
};

const editRole = (role: Role) => {
    isEditMode.value = true;
    selectedRole.value = role;
    form.name = role.name;
    form.description = role.description || "";
    form.isActive = role.isActive;
    showDialog.value = true;
};

const saveRole = async () => {
    if (!form.name.trim()) {
        toast.add({
            title: "Xatolik",
            description: "Iltimos, lavozim nomini kiriting",
            color: "error",
        });
        return;
    }

    isSaving.value = true;
    try {
        const data = {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            isActive: form.isActive,
        };

        if (isEditMode.value && selectedRole.value) {
            await api.patch(apiService.value, `/users/roles/${selectedRole.value.id}`, data);
            toast.add({
                title: "Muvaffaqiyat",
                description: "Lavozim muvaffaqiyatli yangilandi",
                color: "success",
            });
        } else {
            await api.post(apiService.value, "/users/roles", data);
            toast.add({
                title: "Muvaffaqiyat",
                description: "Lavozim muvaffaqiyatli qo'shildi",
                color: "success",
            });
        }

        showDialog.value = false;
        resetForm();
        fetchRoles();
    } catch (error) {
        console.error("Failed to save role:", error);
        toast.add({
            title: "Xatolik",
            description: "Lavozimni saqlashda xatolik yuz berdi",
            color: "error",
        });
    } finally {
        isSaving.value = false;
    }
};

const confirmDelete = async (role: Role) => {
    if (!role) return;

    isDeleting.value = true;
    try {
        await api.delete(apiService.value, `/users/roles/${role.id}`);
        toast.add({
            title: "Muvaffaqiyat",
            description: "Lavozim muvaffaqiyatli o'chirildi",
            color: "success",
        });
        fetchRoles();
    } catch (error) {
        console.error("Failed to delete role:", error);
        toast.add({
            title: "Xatolik",
            description: "Lavozimni o'chirishda xatolik yuz berdi",
            color: "error",
        });
    } finally {
        isDeleting.value = false;
    }
};

// Assign role
const openAssignDialog = (role: Role) => {
    assignForm.roleId = role.id;
    assignForm.userId = "";
    assignForm.expiresAt = "";
    selectedUser.value = null;
    userSearchTerm.value = "";
    users.value = [];
    showAssignDialog.value = true;
};

const assignRole = async () => {
    if (!selectedUser.value || !assignForm.roleId) {
        toast.add({
            title: "Xatolik",
            description: "Iltimos, foydalanuvchi va lavozimni tanlang",
            color: "error",
        });
        return;
    }

    isAssigning.value = true;
    const userId = typeof selectedUser.value === 'object' ? selectedUser.value.value : selectedUser.value;
    try {
        await api.post(apiService.value, `/users/${userId}/roles`, {
            roleId: typeof assignForm.roleId === 'object' ? (assignForm.roleId as any).value : assignForm.roleId,
            expiresAt: assignForm.expiresAt || null,
        });
        toast.add({
            title: "Muvaffaqiyat",
            description: "Lavozim muvaffaqiyatli biriktirildi",
            color: "success",
        });
        showAssignDialog.value = false;
        assignForm.userId = "";
        assignForm.roleId = null;
        assignForm.expiresAt = "";
        selectedUser.value = null;
        userSearchTerm.value = "";
        users.value = [];
    } catch (error) {
        console.error("Failed to assign role:", error);
        toast.add({
            title: "Xatolik",
            description: "Lavozimni biriktirishda xatolik yuz berdi",
            color: "error",
        });
    } finally {
        isAssigning.value = false;
    }
};

const resetForm = () => {
    form.name = "";
    form.description = "";
    form.isActive = true;
    selectedRole.value = null;
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
    fetchRoles();
});

watch(searchQuery, () => {
    currentPage.value = 1;
    updateUrlParams();
});

// User search watcher
watch(userSearchDebounced, (query) => {
    searchUsers(query);
});

watch(showAssignDialog, (isOpen) => {
    if (!isOpen) {
        userSearchTerm.value = "";
        users.value = [];
        selectedUser.value = null;
    }
});
</script>
