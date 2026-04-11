<template>
    <UDashboardPanel id="exams">
        <template #header>
            <UDashboardNavbar title="Imtihonlar" :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>

                <template #description>
                    Imtihonlarni boshqarish va natijalarni kuzatish
                </template>
            </UDashboardNavbar>

            <UDashboardToolbar>
                <template #left>
                    <UInput v-model="search" icon="i-lucide-search" placeholder="Imtihonlarni qidirish..."
                        class="w-64" />
                </template>

                <template #right>
                    <USelectMenu v-model="filterStatus" :items="statusOptions" value-key="value" placeholder="Holat"
                        class="w-40">
                        <template #label>
                            {{statusOptions.find((s) => s.value === filterStatus)?.label || "Holat"}}
                        </template>
                    </USelectMenu>

                    <USelectMenu v-model="filterGroup" :items="groupOptions" value-key="value" placeholder="Guruh"
                        class="w-45">
                        <template #label>
                            {{groupOptions.find((g) => g.value === filterGroup)?.label || "Guruh"}}
                        </template>
                    </USelectMenu>

                    <USelectMenu v-model="filterTeacher" :items="teacherOptions" value-key="value"
                        placeholder="O'qituvchi" class="w-45">
                        <template #label>
                            {{teacherOptions.find((t) => t.value === filterTeacher)?.label || "O'qituvchi"}}
                        </template>
                    </USelectMenu>

                    <UInput v-model="filterStartDate" type="date" class="w-40" placeholder="Boshlanish" />

                    <UInput v-model="filterEndDate" type="date" class="w-40" placeholder="Tugash" />

                    <USelectMenu v-model="limit" :items="[5, 10, 20, 30, 50]" class="w-24">
                        <template #label> {{ limit }} ta </template>
                    </USelectMenu>
                </template>
            </UDashboardToolbar>
        </template>

        <template #body>
            <div class="">
                <UCard>
                    <template #header>
                        <h3 class="text-base font-semibold">Imtihonlar ro'yxati</h3>
                    </template>

                    <UTable :data="exams" :columns="columns" :loading="isLoading" :empty="'Imtihonlar topilmadi'" />

                    <template #footer>
                        <div class="flex items-center justify-between">
                            <div class="text-sm text-gray-500">
                                <span class="font-medium">{{ paginationStart }}</span> dan
                                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                                <span class="font-medium">{{ totalItems }}</span> ta imtihon
                            </div>

                            <UPagination :model-value="page" :total="totalItems" :items-per-page="limit" show-last
                                show-first @update:page="(p: number) => (page = p)" />
                        </div>
                    </template>
                </UCard>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Exam, Group, Teacher } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import { h, resolveComponent } from "vue";

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");

const { apiService } = useAuth();
const toast = useToast();
const route = useRoute();
const router = useRouter();

definePageMeta({
    layout: "default",
    middleware: "auth",
});

// Data
const exams = ref<Exam[]>([]);
const groups = ref<Group[]>([]);
const teachers = ref<Teacher[]>([]);
const isLoading = ref(true);
const page = ref(1);
const limit = ref(10);
const totalItems = ref(0);
const totalPages = ref(1);

// Filters
const search = ref("");
const filterStatus = ref("all");
const filterGroup = ref("all");
const filterTeacher = ref("all");
const filterStartDate = ref("");
const filterEndDate = ref("");

// Status config
const statusColors: Record<string, string> = {
    scheduled: "info",
    completed: "success",
    cancelled: "error",
};

const statusLabels: Record<string, string> = {
    scheduled: "Rejalashtirilgan",
    completed: "Yakunlangan",
    cancelled: "Bekor qilingan",
};

// Options
const statusOptions = computed(() => [
    { value: "all", label: "Barcha holatlar" },
    { value: "scheduled", label: "Rejalashtirilgan" },
    { value: "completed", label: "Yakunlangan" },
    { value: "cancelled", label: "Bekor qilingan" },
]);

const groupOptions = computed(() => [
    { value: "all", label: "Barcha guruhlar" },
    ...groups.value.map((g) => ({
        value: g.id,
        label: g.name,
    })),
]);

const teacherOptions = computed(() => [
    { value: "all", label: "Barcha o'qituvchilar" },
    ...teachers.value.map((t) => ({
        value: t.user_id,
        label: `${t.first_name} ${t.last_name}`,
    })),
]);

// Table columns
const columns: TableColumn<Exam>[] = [
    {
        accessorKey: "title",
        header: "Nomi",
        cell: ({ row }) => {
            return h("span", { class: "font-medium" }, row.original.title);
        },
    },
    {
        accessorKey: "group_id",
        header: "Guruh",
        cell: ({ row }) => {
            const group = groups.value.find((g) => g.id === row.original.group_id);
            return group
                ? h(UBadge, { color: "blue", variant: "subtle", size: "md" }, () => group.name)
                : h("span", { class: "text-gray-400 text-sm" }, "Noma'lum");
        },
    },
    {
        accessorKey: "level",
        header: "Daraja",
        cell: ({ row }) => {
            return h("span", { class: "text-sm capitalize" }, row.original.level);
        },
    },
    {
        accessorKey: "scheduled_at",
        header: "Sana",
        cell: ({ row }) => formatDate(row.original.scheduled_at),
    },
    {
        accessorKey: "is_online",
        header: "Turi",
        cell: ({ row }) => {
            return h(
                UBadge,
                {
                    variant: "subtle",
                    color: row.original.is_online ? "primary" : "neutral",
                },
                () => (row.original.is_online ? "Online" : "Offline"),
            );
        },
    },
    {
        accessorKey: "status",
        header: "Holat",
        cell: ({ row }) => {
            const status = row.original.status;
            return h(
                UBadge,
                {
                    variant: "subtle",
                    color: statusColors[status] || "neutral",
                },
                () => statusLabels[status] || status,
            );
        },
    },
    {
        id: "actions",
        header: "Amallar",
        cell: ({ row }) => {
            return h("div", { class: "flex items-center gap-1" }, [
                h(UButton, {
                    variant: "ghost",
                    icon: "i-lucide-eye",
                    size: "sm",
                    square: true,
                    onClick: () => navigateTo(`/exams/${row.original.id}`),
                }),
            ]);
        },
    },
];

// Computed
const paginationStart = computed(() => {
    return totalItems.value === 0 ? 0 : (page.value - 1) * limit.value + 1;
});

const paginationEnd = computed(() => {
    return Math.min(page.value * limit.value, totalItems.value);
});

// Methods
const loadExams = async () => {
    isLoading.value = true;
    try {
        const params = new URLSearchParams({
            page: page.value.toString(),
            limit: limit.value.toString(),
        });

        if (filterStatus.value !== "all") {
            params.append("status", filterStatus.value);
        }

        if (filterGroup.value !== "all") {
            params.append("group_id", filterGroup.value);
        }

        if (filterTeacher.value !== "all") {
            params.append("teacher_id", filterTeacher.value);
        }

        if (filterStartDate.value) {
            params.append("start_date", filterStartDate.value);
        }

        if (filterEndDate.value) {
            params.append("end_date", filterEndDate.value);
        }

        const response = await api.get<{
            data: Exam[];
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        }>(apiService.value, `/exams?${params.toString()}`);

        exams.value = response.data || [];
        totalItems.value = response.total || 0;
        totalPages.value = response.totalPages || 1;
    } catch (error) {
        console.error("Failed to load exams:", error);
        toast.add({
            title: "Xatolik",
            description: "Imtihonlarni yuklashda xatolik. Qaytadan urinib ko'ring.",
            color: "error",
        });
    } finally {
        isLoading.value = false;
    }
};

const loadGroups = async () => {
    try {
        const response = await api.get<{ data: Group[] }>(
            apiService.value,
            "/groups?limit=1000",
        );
        groups.value = response.data || [];
    } catch (error) {
        console.error("Failed to load groups:", error);
    }
};

const loadTeachers = async () => {
    try {
        const response = await api.get<{
            data: Teacher[];
        }>(apiService.value, "/users/teachers?limit=1000");
        teachers.value = response.data || [];
    } catch (error) {
        console.error("Failed to load teachers:", error);
    }
};

// Helpers
const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const updateUrlParams = () => {
    const query: Record<string, string> = {
        page: page.value.toString(),
        limit: limit.value.toString(),
    };

    if (search.value) query.query = search.value;
    if (filterStatus.value !== "all") query.status = filterStatus.value;
    if (filterGroup.value !== "all") query.group_id = filterGroup.value;
    if (filterTeacher.value !== "all") query.teacher_id = filterTeacher.value;
    if (filterStartDate.value) query.start_date = filterStartDate.value;
    if (filterEndDate.value) query.end_date = filterEndDate.value;

    router.push({ query });
};

// Watchers
let searchTimeout: NodeJS.Timeout | null = null;
watch(search, () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        page.value = 1;
        loadExams();
        updateUrlParams();
    }, 300);
});

watch([filterStatus, filterGroup, filterTeacher, filterStartDate, filterEndDate], () => {
    page.value = 1;
    loadExams();
    updateUrlParams();
});

watch(page, () => {
    loadExams();
    updateUrlParams();
});

watch(limit, () => {
    page.value = 1;
    loadExams();
    updateUrlParams();
});

// Initialize
onMounted(async () => {
    if (route.query.page) page.value = parseInt(route.query.page as string) || 1;
    if (route.query.limit) limit.value = parseInt(route.query.limit as string) || 10;
    if (route.query.query) search.value = route.query.query as string;
    if (route.query.status) filterStatus.value = route.query.status as string;
    if (route.query.group_id) filterGroup.value = route.query.group_id as string;
    if (route.query.teacher_id) filterTeacher.value = route.query.teacher_id as string;
    if (route.query.start_date) filterStartDate.value = route.query.start_date as string;
    if (route.query.end_date) filterEndDate.value = route.query.end_date as string;

    await Promise.all([loadGroups(), loadTeachers()]);
    await loadExams();
});
</script>
