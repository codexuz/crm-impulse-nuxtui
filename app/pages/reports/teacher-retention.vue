<template>
    <UDashboardPanel id="teacher-retention-stats">
        <template #header>
            <UDashboardNavbar :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UNavigationMenu :items="reportsNavItems" highlight />
                </template>

                <template #description>
                    O'qituvchilar bo'yicha o'quvchilarning guruhda qolish darajasi (retention)
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
                    <USelect v-model="months" :items="monthOptions" class="w-40" />
                    <UInput v-model.number="anchorYear" type="number" min="2000" max="2100" class="w-28"
                        placeholder="Yil" />
                    <USelect v-model="anchorMonth" :items="anchorMonthOptions" class="w-40" />
                    <UButton size="xs" variant="ghost" color="neutral" @click="resetFilters">Joriy oy</UButton>
                </div>

                <!-- Loading -->
                <div v-if="isLoading" class="flex justify-center items-center py-20">
                    <span class="i-lucide-loader-2 text-5xl animate-spin text-primary"></span>
                </div>

                <template v-else-if="reports.length">
                    <!-- Summary Cards -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <UCard>
                            <div class="text-sm font-medium text-gray-600 dark:text-gray-400 pb-1">O'qituvchilar</div>
                            <div class="text-2xl font-bold text-blue-600">{{ reports.length }}</div>
                        </UCard>
                        <UCard>
                            <div class="text-sm font-medium text-gray-600 dark:text-gray-400 pb-1">O'rtacha retention
                            </div>
                            <div class="text-2xl font-bold" :class="rateTextClass(overallAverage)">
                                {{ overallAverage === null ? '—' : `${pct(overallAverage)}%` }}
                            </div>
                        </UCard>
                        <UCard>
                            <div class="text-sm font-medium text-gray-600 dark:text-gray-400 pb-1">Eng yaxshi (oxirgi oy)
                            </div>
                            <div class="text-2xl font-bold text-emerald-600">
                                {{ bestTeacher ? bestTeacher.name : '—' }}
                            </div>
                            <div v-if="bestTeacher" class="text-xs text-gray-400">{{ pct(bestTeacher.rate) }}%</div>
                        </UCard>
                        <UCard>
                            <div class="text-sm font-medium text-gray-600 dark:text-gray-400 pb-1">Davr</div>
                            <div class="text-lg font-semibold text-indigo-600">{{ periodLabel }}</div>
                        </UCard>
                    </div>

                    <!-- Retention matrix: rows = teachers, cols = months -->
                    <UCard>
                        <template #header>
                            <h3 class="text-lg font-semibold">Oylik retention darajasi</h3>
                        </template>

                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th class="px-4 py-3 sticky left-0 bg-gray-50 dark:bg-gray-800">O'qituvchi</th>
                                        <th v-for="m in monthHeaders" :key="m" class="px-3 py-3 text-center whitespace-nowrap">
                                            {{ m }}
                                        </th>
                                        <th class="px-4 py-3 text-center">O'rtacha</th>
                                        <th class="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <template v-for="r in reports" :key="r.teacherId">
                                        <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                                            @click="toggleExpand(r.teacherId)">
                                            <td class="px-4 py-3 font-medium sticky left-0 bg-white dark:bg-gray-900">
                                                {{ teacherName(r) }}
                                            </td>
                                            <td v-for="month in r.months" :key="month.month" class="px-3 py-3 text-center">
                                                <span v-if="month.retentionRate === null" class="text-gray-300">—</span>
                                                <span v-else class="inline-block min-w-12 rounded px-2 py-0.5 text-xs font-semibold"
                                                    :class="rateBadgeClass(month.retentionRate)"
                                                    :title="`${month.retainedCount}/${month.startCount} o'quvchi qoldi`">
                                                    {{ pct(month.retentionRate) }}%
                                                </span>
                                            </td>
                                            <td class="px-4 py-3 text-center font-semibold"
                                                :class="rateTextClass(r.averageRetentionRate)">
                                                {{ r.averageRetentionRate === null ? '—' : `${pct(r.averageRetentionRate)}%` }}
                                            </td>
                                            <td class="px-4 py-3 text-gray-400">
                                                <UIcon
                                                    :name="expandedTeacherId === r.teacherId ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" />
                                            </td>
                                        </tr>

                                        <!-- Expanded monthly breakdown -->
                                        <tr v-if="expandedTeacherId === r.teacherId">
                                            <td :colspan="r.months.length + 3"
                                                class="bg-gray-50 dark:bg-gray-800/30 px-6 py-4">
                                                <p class="text-xs text-gray-400 mb-2">Oylik tafsilot</p>
                                                <table class="w-full text-xs">
                                                    <thead>
                                                        <tr class="text-gray-500">
                                                            <th class="text-left py-1">Oy</th>
                                                            <th class="text-center py-1">Oy boshida</th>
                                                            <th class="text-center py-1">Qoldi</th>
                                                            <th class="text-center py-1">Ketdi</th>
                                                            <th class="text-center py-1">Retention</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr v-for="month in r.months" :key="month.month"
                                                            class="border-t border-gray-100 dark:border-gray-700">
                                                            <td class="py-1">{{ formatMonth(month.month) }}</td>
                                                            <td class="py-1 text-center">{{ month.startCount }}</td>
                                                            <td class="py-1 text-center text-emerald-600">{{ month.retainedCount }}</td>
                                                            <td class="py-1 text-center text-rose-600">{{ month.leftCount }}</td>
                                                            <td class="py-1 text-center font-medium"
                                                                :class="rateTextClass(month.retentionRate)">
                                                                {{ month.retentionRate === null ? '—' : `${pct(month.retentionRate)}%` }}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                        </div>
                    </UCard>
                </template>

                <!-- Empty state -->
                <div v-else-if="!isLoading" class="text-center py-20 text-gray-500">
                    <UIcon name="i-lucide-line-chart" class="size-12 mx-auto mb-4 text-gray-300" />
                    <p>Ma'lumotlar topilmadi</p>
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import { useReportsNav } from "~/composables/useReportsNav";
import { useRetentionStats } from "~/composables/useRetentionStats";
import type { TeacherRetentionWithTeacher } from "~/types";

definePageMeta({ middleware: "auth" });

const { reportsNavItems } = useReportsNav();
const { fetchAllTeachersRetention } = useRetentionStats();
const toast = useToast();

const now = new Date();
const months = ref(6);
const anchorYear = ref(now.getFullYear());
const anchorMonth = ref(now.getMonth() + 1);
const isLoading = ref(false);
const reports = ref<TeacherRetentionWithTeacher[]>([]);
const expandedTeacherId = ref<string | null>(null);

const MONTH_NAMES = [
    "Yan", "Fev", "Mar", "Apr", "May", "Iyn",
    "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek",
];

const monthOptions = [
    { label: "3 oy", value: 3 },
    { label: "6 oy", value: 6 },
    { label: "12 oy", value: 12 },
];

const anchorMonthOptions = MONTH_NAMES.map((name, i) => ({
    label: name,
    value: i + 1,
}));

/** Column headers come from the first teacher's month list (all teachers share the window). */
const monthHeaders = computed(() =>
    (reports.value[0]?.months ?? []).map((m) => `${MONTH_NAMES[m.monthNumber - 1]} ${m.year}`),
);

const periodLabel = computed(() => {
    const hdrs = monthHeaders.value;
    if (!hdrs.length) return "—";
    return `${hdrs[0]} – ${hdrs[hdrs.length - 1]}`;
});

const overallAverage = computed(() => {
    const rates = reports.value
        .map((r) => r.averageRetentionRate)
        .filter((r): r is number => r !== null);
    if (!rates.length) return null;
    return rates.reduce((a, b) => a + b, 0) / rates.length;
});

const bestTeacher = computed(() => {
    let best: { name: string; rate: number } | null = null;
    for (const r of reports.value) {
        const last = r.months[r.months.length - 1];
        if (!last || last.retentionRate === null) continue;
        if (!best || last.retentionRate > best.rate) {
            best = { name: teacherName(r), rate: last.retentionRate };
        }
    }
    return best;
});

function teacherName(r: TeacherRetentionWithTeacher): string {
    const t = r.teacher;
    if (!t) return r.teacherId.slice(0, 8);
    const full = [t.first_name, t.last_name].filter(Boolean).join(" ").trim();
    return full || t.username || r.teacherId.slice(0, 8);
}

function pct(rate: number): number {
    return Math.round(rate * 100);
}

function rateBadgeClass(rate: number): string {
    if (rate >= 0.8) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
    if (rate >= 0.6) return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300";
}

function rateTextClass(rate: number | null): string {
    if (rate === null) return "text-gray-400";
    if (rate >= 0.8) return "text-emerald-600";
    if (rate >= 0.6) return "text-amber-600";
    return "text-rose-600";
}

function formatMonth(iso: string): string {
    const [y, m] = iso.split("-");
    return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
}

function toggleExpand(id: string) {
    expandedTeacherId.value = expandedTeacherId.value === id ? null : id;
}

function resetFilters() {
    months.value = 6;
    anchorYear.value = now.getFullYear();
    anchorMonth.value = now.getMonth() + 1;
}

const loadStats = async () => {
    isLoading.value = true;
    try {
        reports.value = await fetchAllTeachersRetention({
            months: months.value,
            year: anchorYear.value,
            month: anchorMonth.value,
        });
    } catch (error: any) {
        console.error("Error loading retention statistics:", error);
        toast.add({
            title: "Xatolik",
            description: error?.message || "Statistikani yuklashda xatolik yuz berdi",
            color: "error",
        });
    } finally {
        isLoading.value = false;
    }
};

watch([months, anchorYear, anchorMonth], () => {
    loadStats();
});

onMounted(() => {
    loadStats();
});
</script>
