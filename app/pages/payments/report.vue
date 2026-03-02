<template>
    <UDashboardPanel id="payment-report">
        <template #header>
            <UDashboardNavbar :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UNavigationMenu :items="paymentNavItems" highlight />
                </template>

                <template #description>
                    Oylik to'lovlar statistikasi va hisoboti
                </template>

                <template #right>
                    <USelectMenu v-model="selectedYear" :items="yearOptions" class="w-32">
                        <template #label>{{ selectedYear }} yil</template>
                    </USelectMenu>
                    <UButton icon="i-lucide-refresh-cw" variant="outline" @click="fetchStats" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="space-y-6">
                <!-- Loading State -->
                <div v-if="isLoading" class="flex justify-center items-center py-20">
                    <span class="i-lucide-loader-2 text-5xl animate-spin text-primary"></span>
                </div>

                <template v-else>
                    <!-- Summary Cards -->
                    <div class="grid gap-4 md:grid-cols-4">
                        <UCard>
                            <div class="flex flex-row items-center justify-between pb-2">
                                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">Jami tushumlar</div>
                                <UIcon name="i-lucide-trending-up" class="size-4 text-green-500" />
                            </div>
                            <div class="text-2xl font-bold text-green-600">{{ formatCurrency(totalRevenue) }}</div>
                            <p class="text-xs text-gray-500 mt-1">{{ selectedYear }} yil uchun</p>
                        </UCard>

                        <UCard>
                            <div class="flex flex-row items-center justify-between pb-2">
                                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">Jami to'lovlar soni
                                </div>
                                <UIcon name="i-lucide-credit-card" class="size-4 text-blue-500" />
                            </div>
                            <div class="text-2xl font-bold text-blue-600">{{ totalPayments }}</div>
                            <p class="text-xs text-gray-500 mt-1">barcha oylar bo'yicha</p>
                        </UCard>

                        <UCard>
                            <div class="flex flex-row items-center justify-between pb-2">
                                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">O'rtacha oylik tushum
                                </div>
                                <UIcon name="i-lucide-bar-chart-2" class="size-4 text-purple-500" />
                            </div>
                            <div class="text-2xl font-bold text-purple-600">{{ formatCurrency(avgMonthlyRevenue) }}
                            </div>
                            <p class="text-xs text-gray-500 mt-1">faol oylar bo'yicha</p>
                        </UCard>

                        <UCard>
                            <div class="flex flex-row items-center justify-between pb-2">
                                <div class="text-sm font-medium text-gray-600 dark:text-gray-400">Eng yuqori oy</div>
                                <UIcon name="i-lucide-award" class="size-4 text-yellow-500" />
                            </div>
                            <div class="text-2xl font-bold text-yellow-600">{{ peakMonth }}</div>
                            <p class="text-xs text-gray-500 mt-1">{{ formatCurrency(peakRevenue) }}</p>
                        </UCard>
                    </div>

                    <!-- Bar Chart -->
                    <UCard>
                        <template #header>
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-lg font-semibold">Oylik to'lovlar dinamikasi</h3>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ selectedYear }} yil uchun
                                        oyma-oy tushum</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center gap-1.5">
                                        <div class="w-3 h-3 rounded-sm bg-primary"></div>
                                        <span class="text-sm text-gray-600">Tushum (UZS)</span>
                                    </div>
                                    <div class="flex items-center gap-1.5">
                                        <div class="w-3 h-3 rounded-sm bg-blue-400"></div>
                                        <span class="text-sm text-gray-600">To'lovlar soni</span>
                                    </div>
                                </div>
                            </div>
                        </template>
                        <div class="h-80">
                            <VChart :option="barChartOption" autoresize />
                        </div>
                    </UCard>

                    <!-- Monthly Table -->
                    <UCard>
                        <template #header>
                            <h3 class="text-base font-semibold">Oylar bo'yicha batafsil</h3>
                        </template>

                        <UTable :data="tableData" :columns="tableColumns" :empty="'Ma\'lumot topilmadi'" />
                    </UCard>
                </template>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn, NavigationMenuItem } from "@nuxt/ui";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

definePageMeta({
    middleware: ["auth"],
});

const { apiService } = useAuth();
const toast = useToast();

const paymentNavItems: NavigationMenuItem[] = [
    {
        label: "To'lovlar",
        icon: "i-lucide-credit-card",
        to: "/payments",
    },
    {
        label: "Kelayotgan to'lovlar",
        icon: "i-lucide-calendar-clock",
        to: "/payments/upcoming",
    },
    {
        label: "Qarzdorlar",
        icon: "i-lucide-alert-triangle",
        to: "/payments/debitor",
    },
    {
        label: "Hisobot",
        icon: "i-lucide-bar-chart-2",
        to: "/payments/report",
    },
];

// State
const isLoading = ref(false);
const selectedYear = ref(new Date().getFullYear());

interface MonthlyStatItem {
    month: number;
    monthName: string;
    totalAmount: number;
    count: number;
}

interface MonthlyStatsResponse {
    year: number;
    months: MonthlyStatItem[];
    grandTotal: number;
}

const monthlyStats = ref<MonthlyStatItem[]>([]);

const yearOptions = computed(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => current - i);
});

const MONTH_NAMES = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

// Build full 12-month array (fill missing months with 0)
const fullStats = computed<MonthlyStatItem[]>(() => {
    return Array.from({ length: 12 }, (_, i) => {
        const found = monthlyStats.value.find((s) => s.month === i + 1);
        return found ?? { month: i + 1, monthName: MONTH_NAMES[i]!, totalAmount: 0, count: 0 };
    });
});

// Summary computed
const totalRevenue = computed(() =>
    fullStats.value.reduce((sum, m) => sum + (m.totalAmount ?? 0), 0),
);
const totalPayments = computed(() =>
    fullStats.value.reduce((sum, m) => sum + (m.count ?? 0), 0),
);
const avgMonthlyRevenue = computed(() => {
    const active = fullStats.value.filter((m) => m.totalAmount > 0);
    return active.length ? totalRevenue.value / active.length : 0;
});
const peakMonth = computed(() => {
    const peak = fullStats.value.reduce<MonthlyStatItem | undefined>(
        (max, m) => (!max || m.totalAmount > max.totalAmount ? m : max),
        undefined,
    );
    return MONTH_NAMES[(peak?.month ?? 1) - 1] ?? "—";
});
const peakRevenue = computed(() => {
    return fullStats.value.reduce((max, m) => Math.max(max, m.totalAmount), 0);
});

// Chart option
const barChartOption = computed(() => {
    const months = MONTH_NAMES;
    const amounts = fullStats.value.map((m) => m.totalAmount);
    const counts = fullStats.value.map((m) => m.count);

    return {
        tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            formatter: (params: any[]) => {
                const month = params[0]?.name ?? "";
                const amount = params[0]?.value ?? 0;
                const count = params[1]?.value ?? 0;
                return `<strong>${month}</strong><br/>Tushum: <strong>${formatCurrency(amount)}</strong><br/>To'lovlar: <strong>${count} ta</strong>`;
            },
        },
        legend: {
            data: ["Tushum", "To'lovlar soni"],
            textStyle: { color: "#6b7280" },
        },
        grid: {
            left: "3%",
            right: "4%",
            bottom: "3%",
            top: "15%",
            containLabel: true,
        },
        xAxis: {
            type: "category",
            data: months,
            axisLine: { lineStyle: { color: "#6b7280" } },
            axisLabel: { color: "#6b7280", fontSize: 11 },
        },
        yAxis: [
            {
                type: "value",
                name: "Tushum (UZS)",
                nameTextStyle: { color: "#6b7280", fontSize: 11 },
                axisLabel: {
                    color: "#6b7280",
                    fontSize: 10,
                    formatter: (v: number) =>
                        v >= 1_000_000
                            ? `${(v / 1_000_000).toFixed(0)}M`
                            : v >= 1_000
                                ? `${(v / 1_000).toFixed(0)}K`
                                : String(v),
                },
                splitLine: { lineStyle: { color: "#e5e7eb", type: "dashed" } },
            },
            {
                type: "value",
                name: "Soni",
                nameTextStyle: { color: "#6b7280", fontSize: 11 },
                axisLabel: { color: "#6b7280", fontSize: 10 },
                splitLine: { show: false },
            },
        ],
        series: [
            {
                name: "Tushum",
                type: "bar",
                yAxisIndex: 0,
                data: amounts,
                barMaxWidth: 40,
                itemStyle: {
                    color: {
                        type: "linear",
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: "rgb(59, 130, 246)" },
                            { offset: 1, color: "rgba(59, 130, 246, 0.4)" },
                        ],
                    },
                    borderRadius: [4, 4, 0, 0],
                },
            },
            {
                name: "To'lovlar soni",
                type: "line",
                yAxisIndex: 1,
                data: counts,
                smooth: true,
                lineStyle: { width: 2, color: "#60a5fa" },
                itemStyle: { color: "#60a5fa" },
                symbol: "circle",
                symbolSize: 6,
            },
        ],
    };
});

// Table
interface TableRow {
    month: string;
    totalAmount: number;
    paymentCount: number;
    avgPayment: number;
    share: number;
}

const tableData = computed<TableRow[]>(() =>
    fullStats.value.map((m) => ({
        month: MONTH_NAMES[m.month - 1]!,
        totalAmount: m.totalAmount,
        paymentCount: m.count,
        avgPayment: m.count > 0 ? Math.round(m.totalAmount / m.count) : 0,
        share: totalRevenue.value > 0 ? (m.totalAmount / totalRevenue.value) * 100 : 0,
    })),
);

const UBadge = resolveComponent("UBadge");

const tableColumns: TableColumn<TableRow>[] = [
    {
        accessorKey: "month",
        header: "Oy",
        cell: ({ row }) =>
            h("span", { class: "font-medium" }, row.original.month),
    },
    {
        accessorKey: "totalAmount",
        header: "Jami tushum",
        cell: ({ row }) =>
            h(
                "span",
                { class: row.original.totalAmount > 0 ? "font-semibold text-green-600" : "text-gray-400" },
                formatCurrency(row.original.totalAmount),
            ),
    },
    {
        accessorKey: "paymentCount",
        header: "To'lovlar soni",
        cell: ({ row }) =>
            h("span", { class: row.original.paymentCount > 0 ? "font-medium" : "text-gray-400" },
                `${row.original.paymentCount} ta`),
    },
    {
        accessorKey: "avgPayment",
        header: "O'rtacha to'lov",
        cell: ({ row }) =>
            h("span", { class: "text-gray-700 dark:text-gray-300" },
                row.original.avgPayment > 0 ? formatCurrency(row.original.avgPayment) : "—"),
    },
    {
        accessorKey: "share",
        header: "Ulushi",
        cell: ({ row }) => {
            const pct = row.original.share;
            return h("div", { class: "flex items-center gap-2" }, [
                h("div", { class: "w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2" }, [
                    h("div", {
                        class: "h-2 rounded-full bg-primary transition-all",
                        style: { width: `${pct.toFixed(1)}%` },
                    }),
                ]),
                h("span", { class: "text-sm w-12 text-right" }, `${pct.toFixed(1)}%`),
            ]);
        },
    },
];

// API call
async function fetchStats() {
    try {
        isLoading.value = true;
        const data = await api.get<MonthlyStatsResponse>(
            apiService.value,
            `/student-payments/statistics/monthly?year=${selectedYear.value}`,
        );
        monthlyStats.value = Array.isArray(data.months) ? data.months : [];
    } catch (error: any) {
        console.error("Failed to fetch monthly stats:", error);
        toast.add({
            title: "Xatolik",
            description: "Statistikani yuklashda xatolik yuz berdi",
            color: "error",
        });
    } finally {
        isLoading.value = false;
    }
}

// Refetch when year changes
watch(selectedYear, () => fetchStats());

onMounted(() => fetchStats());

// Helpers
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("uz-UZ", {
        style: "currency",
        currency: "UZS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
</script>
