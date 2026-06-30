<template>
    <UDashboardPanel id="exams-report">
        <template #header>
            <UDashboardNavbar :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UNavigationMenu :items="examsNavItems" highlight />
                </template>

                <template #description>
                    Unit testdan bir necha marta yiqilgan o'quvchilar
                </template>
            </UDashboardNavbar>

            <UDashboardToolbar>
                <template #left>
                    <USelectMenu v-model="filterTeacher" :items="teacherOptions" value-key="value"
                        placeholder="O'qituvchi" class="w-45">
                        <template #label>
                            {{teacherOptions.find((t) => t.value === filterTeacher)?.label || "O'qituvchi"}}
                        </template>
                    </USelectMenu>

                    <USelectMenu v-model="filterGroup" :items="groupOptions" value-key="value" placeholder="Guruh"
                        class="w-45">
                        <template #label>
                            {{groupOptions.find((g) => g.value === filterGroup)?.label || "Guruh"}}
                        </template>
                    </USelectMenu>

                    <UInput v-model.number="minFailures" type="number" min="1" class="w-32"
                        placeholder="Min yiqilish" />
                </template>
            </UDashboardToolbar>
        </template>

        <template #body>
            <div>
            <UCard>
                <template #header>
                    <h3 class="text-base font-semibold">
                        Kamida {{ minFailures }} marta unit testdan yiqilgan o'quvchilar
                    </h3>
                </template>

                <UTable :data="failures" :columns="columns" :loading="isLoading"
                    :empty="'Yiqilgan o\'quvchilar topilmadi'" />

                <template #footer>
                    <div class="text-sm text-gray-500">
                        Jami <span class="font-medium">{{ failures.length }}</span> ta o'quvchi
                    </div>
                </template>
            </UCard>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn, NavigationMenuItem } from "@nuxt/ui";
import type { Group, Teacher, UnitTestFailure } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import { h, resolveComponent } from "vue";

const UBadge = resolveComponent("UBadge");

const examsNavItems: NavigationMenuItem[] = [
    {
        label: "Imtihonlar",
        icon: "i-lucide-clipboard-list",
        to: "/exams",
    },
    {
        label: "Yiqilgan o'quvchilar",
        icon: "i-lucide-triangle-alert",
        to: "/exams/report",
    },
];

const { apiService } = useAuth();
const toast = useToast();

definePageMeta({
    layout: "default",
    middleware: "auth",
});

// Data
const failures = ref<UnitTestFailure[]>([]);
const groups = ref<Group[]>([]);
const teachers = ref<Teacher[]>([]);
const isLoading = ref(false);

// Filters
const filterGroup = ref("all");
const filterTeacher = ref("all");
const minFailures = ref(3);

// Options
// When a teacher is selected, only show that teacher's groups.
const filteredGroups = computed(() =>
    filterTeacher.value === "all"
        ? groups.value
        : groups.value.filter((g) => g.teacher_id === filterTeacher.value),
);

const groupOptions = computed(() => [
    { value: "all", label: "Barcha guruhlar" },
    ...filteredGroups.value.map((g) => ({ value: g.id, label: g.name })),
]);

const teacherOptions = computed(() => [
    { value: "all", label: "Barcha o'qituvchilar" },
    ...teachers.value.map((t) => ({
        value: t.user_id,
        label: `${t.first_name} ${t.last_name}`,
    })),
]);

// Table columns
const columns: TableColumn<UnitTestFailure>[] = [
    {
        accessorKey: "first_name",
        header: "O'quvchi",
        cell: ({ row }) =>
            h(
                "span",
                { class: "font-medium" },
                `${row.original.first_name} ${row.original.last_name}`,
            ),
    },
    {
        accessorKey: "failed_count",
        header: "Yiqilishlar",
        cell: ({ row }) =>
            h(
                UBadge,
                { variant: "subtle", color: "error", size: "md" },
                () => `${row.original.failed_count} marta`,
            ),
    },
    {
        accessorKey: "units",
        header: "Unitlar",
        cell: ({ row }) => {
            const units = row.original.units || [];
            if (units.length === 0)
                return h("span", { class: "text-gray-400 text-sm" }, "—");
            return h(
                "div",
                { class: "flex flex-wrap gap-1" },
                units.map((u) =>
                    h(
                        UBadge,
                        { variant: "subtle", color: "neutral", size: "sm" },
                        () => u.title,
                    ),
                ),
            );
        },
    },
    {
        accessorKey: "groups",
        header: "Guruhlar",
        cell: ({ row }) => {
            const grps = row.original.groups || [];
            if (grps.length === 0)
                return h("span", { class: "text-gray-400 text-sm" }, "—");
            return h(
                "div",
                { class: "flex flex-wrap gap-1" },
                grps.map((g) =>
                    h(
                        UBadge,
                        { variant: "subtle", color: "primary", size: "sm" },
                        () => g.name,
                    ),
                ),
            );
        },
    },
    {
        accessorKey: "teachers",
        header: "O'qituvchilar",
        cell: ({ row }) => {
            const tchrs = row.original.teachers || [];
            if (tchrs.length === 0)
                return h("span", { class: "text-gray-400 text-sm" }, "—");
            return h(
                "div",
                { class: "flex flex-col gap-0.5 text-sm" },
                tchrs.map((t) =>
                    h("span", {}, `${t.first_name} ${t.last_name}`),
                ),
            );
        },
    },
];

// Methods
const loadFailures = async () => {
    isLoading.value = true;
    try {
        const params = new URLSearchParams();
        if (minFailures.value && minFailures.value > 0) {
            params.append("minFailures", String(minFailures.value));
        }
        if (filterGroup.value !== "all") {
            params.append("groupId", filterGroup.value);
        }
        if (filterTeacher.value !== "all") {
            params.append("teacherId", filterTeacher.value);
        }

        const query = params.toString();
        const response = await api.get<UnitTestFailure[]>(
            apiService.value,
            `/exam-results/unit-test-failures${query ? `?${query}` : ""}`,
        );

        failures.value = Array.isArray(response) ? response : [];
    } catch (error) {
        console.error("Failed to load unit test failures:", error);
        toast.add({
            title: "Xatolik",
            description: "Hisobotni yuklashda xatolik. Qaytadan urinib ko'ring.",
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
        const response = await api.get<{ data: Teacher[] }>(
            apiService.value,
            "/users/teachers?limit=1000",
        );
        teachers.value = response.data || [];
    } catch (error) {
        console.error("Failed to load teachers:", error);
    }
};

// When the teacher changes, reset the group if it no longer belongs to them.
watch(filterTeacher, () => {
    if (
        filterGroup.value !== "all" &&
        !filteredGroups.value.some((g) => g.id === filterGroup.value)
    ) {
        filterGroup.value = "all";
    }
});

// Watchers — reload whenever a filter changes
let debounce: NodeJS.Timeout | null = null;
watch([filterGroup, filterTeacher, minFailures], () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(loadFailures, 250);
});

// Initialize
onMounted(async () => {
    await Promise.all([loadGroups(), loadTeachers()]);
    await loadFailures();
});
</script>
