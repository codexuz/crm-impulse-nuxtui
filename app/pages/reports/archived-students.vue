<template>
    <UDashboardPanel id="archived-students-stats">
        <template #header>
            <UDashboardNavbar :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UNavigationMenu :items="reportsNavItems" highlight />
                </template>

                <template #description>
                    Arxivlangan o'quvchilar statistikasi
                </template>

                <template #right>
                    <UButton icon="i-lucide-refresh-cw" variant="outline" :loading="isLoading" @click="loadStats" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="space-y-6">
                <!-- Filters -->
                <div class="flex flex-wrap items-center gap-3">
                    <UInput v-model="startDate" type="date" placeholder="Boshlanish" class="w-44" />
                    <span class="text-gray-400">—</span>
                    <UInput v-model="endDate" type="date" placeholder="Tugash" class="w-44" />

                    <div class="flex gap-1">
                        <UButton v-for="p in presets" :key="p.label" size="xs" variant="outline"
                            @click="applyPreset(p)">
                            {{ p.label }}
                        </UButton>
                    </div>

                    <UButton size="xs" variant="ghost" color="neutral" @click="clearFilters">Tozalash</UButton>
                </div>

                <!-- Loading -->
                <div v-if="isLoading" class="flex justify-center items-center py-20">
                    <span class="i-lucide-loader-2 text-5xl animate-spin text-primary"></span>
                </div>

                <template v-else-if="stats">
                    <!-- Summary Cards -->
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <UCard>
                            <div class="flex flex-row items-center justify-between pb-2">
                                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">Jami</div>
                                <UIcon name="i-lucide-archive" class="size-4 text-gray-400" />
                            </div>
                            <div class="text-2xl font-bold">{{ stats.totalArchived }}</div>
                        </UCard>

                        <UCard>
                            <div class="flex flex-row items-center justify-between pb-2">
                                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">Bugun</div>
                                <UIcon name="i-lucide-calendar" class="size-4 text-blue-400" />
                            </div>
                            <div class="text-2xl font-bold text-blue-600">{{ stats.periodStats.today }}</div>
                        </UCard>

                        <UCard>
                            <div class="flex flex-row items-center justify-between pb-2">
                                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">Bu hafta</div>
                                <UIcon name="i-lucide-calendar-days" class="size-4 text-purple-400" />
                            </div>
                            <div class="text-2xl font-bold text-purple-600">{{ stats.periodStats.thisWeek }}</div>
                        </UCard>

                        <UCard>
                            <div class="flex flex-row items-center justify-between pb-2">
                                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">Bu oy</div>
                                <UIcon name="i-lucide-calendar-range" class="size-4 text-orange-400" />
                            </div>
                            <div class="text-2xl font-bold text-orange-600">{{ stats.periodStats.thisMonth }}</div>
                        </UCard>

                        <UCard>
                            <div class="flex flex-row items-center justify-between pb-2">
                                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">O'tgan oy</div>
                                <UIcon name="i-lucide-trending-up" class="size-4"
                                    :class="stats.periodStats.monthOverMonthChange > 0 ? 'text-red-400' : 'text-green-400'" />
                            </div>
                            <div class="text-2xl font-bold">{{ stats.periodStats.lastMonth }}</div>
                            <p class="text-xs mt-1"
                                :class="stats.periodStats.monthOverMonthChange > 0 ? 'text-red-500' : 'text-green-500'">
                                {{ stats.periodStats.monthOverMonthChange > 0 ? '+' : '' }}{{
                                    stats.periodStats.monthOverMonthChange }}%
                            </p>
                        </UCard>
                    </div>

                    <!-- Reason Breakdown -->
                    <UCard>
                        <template #header>
                            <h3 class="text-lg font-semibold">Sabablar bo'yicha</h3>
                        </template>

                        <UTable :data="reasonTableData" :columns="reasonColumns" />
                    </UCard>

                    <!-- Monthly Trend -->
                    <UCard>
                        <template #header>
                            <h3 class="text-lg font-semibold">Oylik trend</h3>
                        </template>

                        <div class="flex items-end gap-2 h-48">
                            <div v-for="m in stats.monthlyTrend" :key="m.month"
                                class="flex-1 flex flex-col items-center justify-end">
                                <span class="text-xs mb-1 text-gray-600 dark:text-gray-400">{{ m.count }}</span>
                                <div class="w-full bg-primary rounded-t transition-all"
                                    :style="{ height: `${Math.max((m.count / maxMonthlyCount) * 100, 4)}%` }" />
                                <span class="text-xs mt-1 text-gray-500">{{ m.month.slice(5) }}</span>
                            </div>
                        </div>
                    </UCard>

                    <!-- Teacher & Group Tables -->
                    <div class="grid md:grid-cols-2 gap-6">
                        <!-- Top Teachers -->
                        <UCard>
                            <template #header>
                                <h3 class="text-lg font-semibold">O'qituvchilar bo'yicha (top 10)</h3>
                            </template>

                            <UTable :data="teacherTableData" :columns="teacherColumns" />
                        </UCard>

                        <!-- Top Groups -->
                        <UCard>
                            <template #header>
                                <h3 class="text-lg font-semibold">Guruhlar bo'yicha (top 10)</h3>
                            </template>

                            <UTable :data="groupTableData" :columns="groupColumns" />
                        </UCard>
                    </div>
                </template>

                <!-- Empty state -->
                <div v-else-if="!isLoading" class="text-center py-20 text-gray-500">
                    <UIcon name="i-lucide-bar-chart-2" class="size-12 mx-auto mb-4 text-gray-300" />
                    <p>Ma'lumotlar topilmadi</p>
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import { useReportsNav } from "~/composables/useReportsNav";
import { useArchivedStudentStats } from "~/composables/useArchivedStudentStats";
import type { ArchivedStudentStatistics } from "~/types";

definePageMeta({ middleware: "auth" });

const { reportsNavItems } = useReportsNav();
const { fetchStatistics } = useArchivedStudentStats();
const toast = useToast();

const startDate = ref("");
const endDate = ref("");
const isLoading = ref(false);
const stats = ref<ArchivedStudentStatistics | null>(null);

const REASON_LABELS: Record<string, string> = {
    'Narxning qimmatligi': 'Narx qimmat',
    "Dars o'tilish usuli yoqmaganligi": "Dars usuli yoqmadi",
    "Guruhdagi muhit (guruh o'quvchilari)": 'Guruh muhiti',
    "Guruh darajasi to'g'ri kelmaganligi": 'Daraja mos emas',
    "Ustozning tashqi ko'rishni va munosabati": 'Ustoz munosabati',
    'Markazning joylashuvi noqulayligi': 'Joylashuv noqulay',
    "O'quvchining shaxsiy muammolari tufayli (sog'ligi yoki boshqa)": 'Shaxsiy sabab',
    'Kursni muvaffaqiyatli tugatdi': 'Kursni tugatdi ✅',
    'Boshqa': 'Boshqa',
};

const presets = [
    {
        label: 'Bu oy',
        start: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
        end: () => '',
    },
    {
        label: "O'tgan oy",
        start: () => new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 10),
        end: () => new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().slice(0, 10),
    },
    {
        label: 'Oxirgi 3 oy',
        start: () => { const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().slice(0, 10); },
        end: () => '',
    },
    {
        label: 'Bu yil',
        start: () => `${new Date().getFullYear()}-01-01`,
        end: () => '',
    },
];

function applyPreset(p: typeof presets[number]) {
    startDate.value = p.start();
    endDate.value = p.end();
}

function clearFilters() {
    startDate.value = '';
    endDate.value = '';
}

const maxMonthlyCount = computed(() => {
    if (!stats.value?.monthlyTrend.length) return 1;
    return Math.max(...stats.value.monthlyTrend.map(t => t.count), 1);
});

// Table data
const reasonColumns = [
    { key: 'reason', label: 'Sabab' },
    { key: 'count', label: 'Soni' },
    { key: 'percentage', label: 'Ulushi' },
];

const reasonTableData = computed(() =>
    (stats.value?.byReason ?? []).map(r => ({
        reason: REASON_LABELS[r.reason] ?? r.reason,
        count: r.count,
        percentage: stats.value!.totalArchived > 0
            ? `${Math.round((r.count / stats.value!.totalArchived) * 100)}%`
            : '0%',
    }))
);

const teacherColumns = [
    { key: 'index', label: '#' },
    { key: 'name', label: "O'qituvchi" },
    { key: 'count', label: 'Soni' },
];

const teacherTableData = computed(() =>
    (stats.value?.byTeacher ?? []).map((t, i) => ({
        index: i + 1,
        name: `${t.teacher.first_name} ${t.teacher.last_name}`,
        count: t.count,
    }))
);

const groupColumns = [
    { key: 'index', label: '#' },
    { key: 'name', label: 'Guruh' },
    { key: 'count', label: 'Soni' },
];

const groupTableData = computed(() =>
    (stats.value?.byGroup ?? []).map((g, i) => ({
        index: i + 1,
        name: g.group.name,
        count: g.count,
    }))
);

const loadStats = async () => {
    isLoading.value = true;
    try {
        const query: Record<string, string> = {};
        if (startDate.value) query.startDate = startDate.value;
        if (endDate.value) query.endDate = endDate.value;

        stats.value = await fetchStatistics(query);
    } catch (error: any) {
        console.error("Error loading archived student statistics:", error);
        toast.add({
            title: "Xatolik",
            description: error?.message || "Statistikani yuklashda xatolik yuz berdi",
            color: "error",
        });
    } finally {
        isLoading.value = false;
    }
};

watch([startDate, endDate], () => {
    loadStats();
});

onMounted(() => {
    loadStats();
});
</script>
