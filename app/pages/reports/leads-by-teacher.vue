<template>
    <UDashboardPanel id="leads-by-teacher-stats">
        <template #header>
            <UDashboardNavbar :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UNavigationMenu :items="reportsNavItems" highlight />
                </template>

                <template #description>
                    O'qituvchilar bo'yicha lidlar statistikasi
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
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <UCard>
                            <div class="text-sm font-medium text-gray-600 dark:text-gray-400 pb-1">Jami tayinlangan
                            </div>
                            <div class="text-2xl font-bold text-blue-600">{{ stats.summary.totalAssigned }}</div>
                        </UCard>
                        <UCard>
                            <div class="text-sm font-medium text-gray-600 dark:text-gray-400 pb-1">Keldi</div>
                            <div class="text-2xl font-bold text-green-600">{{ stats.summary.totalAttended }}</div>
                        </UCard>
                        <UCard>
                            <div class="text-sm font-medium text-gray-600 dark:text-gray-400 pb-1">Kelmadi</div>
                            <div class="text-2xl font-bold text-red-600">{{ stats.summary.totalNotAttended }}</div>
                        </UCard>
                        <UCard>
                            <div class="text-sm font-medium text-gray-600 dark:text-gray-400 pb-1">O'quvchi bo'ldi</div>
                            <div class="text-2xl font-bold text-emerald-600">{{ stats.summary.totalBecameStudent }}
                            </div>
                        </UCard>
                        <UCard>
                            <div class="text-sm font-medium text-gray-600 dark:text-gray-400 pb-1">Yo'qotildi</div>
                            <div class="text-2xl font-bold text-rose-600">{{ stats.summary.totalLost }}</div>
                        </UCard>
                        <UCard>
                            <div class="text-sm font-medium text-gray-600 dark:text-gray-400 pb-1">Jarayonda</div>
                            <div class="text-2xl font-bold text-amber-600">{{ stats.summary.totalInProgress }}</div>
                        </UCard>
                        <UCard>
                            <div class="text-sm font-medium text-gray-600 dark:text-gray-400 pb-1">Konversiya</div>
                            <div class="text-2xl font-bold text-indigo-600">{{ stats.summary.overallConversionRate }}%
                            </div>
                        </UCard>
                    </div>

                    <!-- Teacher Table -->
                    <UCard>
                        <template #header>
                            <h3 class="text-lg font-semibold">O'qituvchilar bo'yicha natijalar</h3>
                        </template>

                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th class="px-4 py-3">#</th>
                                        <th class="px-4 py-3">O'qituvchi</th>
                                        <th class="px-4 py-3 text-center">Tayinlangan</th>
                                        <th class="px-4 py-3 text-center">Keldi</th>
                                        <th class="px-4 py-3 text-center">Kelmadi</th>
                                        <th class="px-4 py-3 text-center text-emerald-600">O'quvchi bo'ldi</th>
                                        <th class="px-4 py-3 text-center text-rose-600">Yo'qotildi</th>
                                        <th class="px-4 py-3 text-center">Jarayonda</th>
                                        <th class="px-4 py-3 text-center">Konversiya</th>
                                        <th class="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <template v-for="(t, i) in stats.teachers" :key="t.teacher_id">
                                        <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                                            @click="toggleExpand(t.teacher_id)">
                                            <td class="px-4 py-3">{{ i + 1 }}</td>
                                            <td class="px-4 py-3 font-medium">{{ t.teacherName }}</td>
                                            <td class="px-4 py-3 text-center">{{ t.totalAssigned }}</td>
                                            <td class="px-4 py-3 text-center text-green-600">{{ t.attended }}</td>
                                            <td class="px-4 py-3 text-center text-red-500">{{ t.notAttended }}</td>
                                            <td class="px-4 py-3 text-center font-semibold text-emerald-600">{{
                                                t.becameStudent }}</td>
                                            <td class="px-4 py-3 text-center font-semibold text-rose-600">{{ t.lost }}
                                            </td>
                                            <td class="px-4 py-3 text-center text-amber-600">{{ t.inProgress }}</td>
                                            <td class="px-4 py-3 text-center">
                                                <div class="flex items-center justify-center gap-2">
                                                    <div
                                                        class="w-16 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div class="h-full rounded-full transition-all"
                                                            :class="t.conversionRate >= 50 ? 'bg-emerald-500' : t.conversionRate >= 25 ? 'bg-amber-400' : 'bg-rose-500'"
                                                            :style="{ width: `${t.conversionRate}%` }" />
                                                    </div>
                                                    <span class="text-xs font-medium"
                                                        :class="t.conversionRate >= 50 ? 'text-emerald-600' : t.conversionRate >= 25 ? 'text-amber-600' : 'text-rose-600'">
                                                        {{ t.conversionRate }}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td class="px-4 py-3 text-gray-400">
                                                <UIcon
                                                    :name="expandedTeacherId === t.teacher_id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" />
                                            </td>
                                        </tr>

                                        <!-- Expanded Leads -->
                                        <tr v-if="expandedTeacherId === t.teacher_id">
                                            <td colspan="10" class="bg-gray-50 dark:bg-gray-800/30 px-6 py-4">
                                                <p class="text-xs text-gray-400 mb-2">Lidlar ro'yxati ({{ t.leads.length
                                                    }})</p>
                                                <table class="w-full text-xs">
                                                    <thead>
                                                        <tr class="text-gray-500">
                                                            <th class="text-left py-1">Lid ismi</th>
                                                            <th class="text-center py-1">Sinov darsi</th>
                                                            <th class="text-center py-1">Holati</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr v-for="lead in t.leads" :key="lead.lead_id"
                                                            class="border-t border-gray-100 dark:border-gray-700">
                                                            <td class="py-1">{{ lead.leadName }}</td>
                                                            <td class="py-1 text-center">
                                                                <UBadge size="xs"
                                                                    :color="trialStatusColor(lead.trialStatus)"
                                                                    variant="subtle">
                                                                    {{ TRIAL_STATUS_LABELS[lead.trialStatus] ??
                                                                    lead.trialStatus }}
                                                                </UBadge>
                                                            </td>
                                                            <td class="py-1 text-center">
                                                                <UBadge size="xs"
                                                                    :color="leadStatusColor(lead.leadStatus)"
                                                                    variant="subtle">
                                                                    {{ lead.leadStatus || '—' }}
                                                                </UBadge>
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
                    <UIcon name="i-lucide-bar-chart-2" class="size-12 mx-auto mb-4 text-gray-300" />
                    <p>Ma'lumotlar topilmadi</p>
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import { useReportsNav } from "~/composables/useReportsNav";
import { useLeadsStatistics } from "~/composables/useLeadsStatistics";
import type { LeadsStatisticsResponse } from "~/types";

definePageMeta({ middleware: "auth" });

const { reportsNavItems } = useReportsNav();
const { fetchLeadsStatistics } = useLeadsStatistics();
const toast = useToast();

const startDate = ref("");
const endDate = ref("");
const isLoading = ref(false);
const stats = ref<LeadsStatisticsResponse | null>(null);
const expandedTeacherId = ref<string | null>(null);

const TRIAL_STATUS_LABELS: Record<string, string> = {
    belgilangan: 'Belgilangan',
    keldi: 'Keldi',
    kelmadi: 'Kelmadi',
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

function toggleExpand(id: string) {
    expandedTeacherId.value = expandedTeacherId.value === id ? null : id;
}

function trialStatusColor(status: string): "info" | "success" | "error" {
    const map: Record<string, "info" | "success" | "error"> = {
        belgilangan: 'info',
        keldi: 'success',
        kelmadi: 'error',
    };
    return map[status] ?? 'info';
}

function leadStatusColor(status: string): "success" | "error" | "info" | "warning" {
    if (status === "O'qishga yozildi") return 'success';
    if (status === "Yo'qotildi") return 'error';
    if (status === 'Yangi') return 'info';
    return 'warning';
}

const loadStats = async () => {
    isLoading.value = true;
    try {
        const query: Record<string, string> = {};
        if (startDate.value) query.startDate = startDate.value;
        if (endDate.value) query.endDate = endDate.value;

        stats.value = await fetchLeadsStatistics(query);
    } catch (error: any) {
        console.error("Error loading leads statistics:", error);
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
