<template>
  <UDashboardPanel id="attendance-summary">
    <template #header>
      <UDashboardNavbar title="" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UNavigationMenu :items="staffNavItems" highlight />
        </template>

        <template #description>
          Xodimlar davomati bo'yicha umumiy hisobot
        </template>

        <template #right>
          <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" :loading="isLoading"
            @click="load">
            Yangilash
          </UButton>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput v-model="startDate" type="date" class="w-44" />
          <span class="text-muted text-sm self-center">—</span>
          <UInput v-model="endDate" type="date" class="w-44" />
          <UButton icon="i-lucide-search" :loading="isLoading" @click="() => { page = 1; load() }">Qidirish</UButton>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <!-- Summary stat cards -->
      <div v-if="summary.length" class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <UCard>
          <div class="text-center">
            <p class="text-2xl font-bold text-primary">{{ totalStats.total }}</p>
            <p class="text-sm text-muted">Jami yozuv</p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <p class="text-2xl font-bold text-green-600">{{ totalStats.on_time }}</p>
            <p class="text-sm text-muted">O'z vaqtida</p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <p class="text-2xl font-bold text-red-500">{{ totalStats.late }}</p>
            <p class="text-sm text-muted">Kechikdi</p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <p class="text-2xl font-bold text-orange-500">{{ formatMoney(totalStats.total_fine) }}</p>
            <p class="text-sm text-muted">Jami jarima</p>
          </div>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <h3 class="text-base font-semibold">Xodimlar bo'yicha breakdown</h3>
        </template>

        <div v-if="isLoading" class="flex justify-center py-16">
          <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
        </div>

        <UTable v-else :data="summary" :columns="columns" :empty="'Ma\'lumot topilmadi'" />

        <template #footer>
          <div class="flex items-center justify-between">
            <div class="text-sm text-muted">
              Jami <span class="font-medium">{{ totalItems }}</span> ta xodim
            </div>
            <UPagination :page="page" :total="totalItems" :items-per-page="limit"
              show-last show-first @update:page="(p: number) => { page = p; load() }" />
          </div>
        </template>
      </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h, resolveComponent } from "vue";
import type { NavigationMenuItem } from "@nuxt/ui";
import { useStaffAttendance } from "~/composables/useStaffAttendance";
import type { AttendanceSummaryItem } from "~/types/attendance";

definePageMeta({ layout: "default", middleware: "auth" });

const { getSummary } = useStaffAttendance();
const toast = useToast();

const UBadge = resolveComponent("UBadge");

const staffNavItems: NavigationMenuItem[] = [
  { label: "Davomat yozuvlari", icon: "i-lucide-fingerprint", to: "/staff-attendance" },
  { label: "Xodimlar", icon: "i-lucide-users", to: "/staff-attendance/staff" },
  { label: "Hisobot", icon: "i-lucide-bar-chart-2", to: "/staff-attendance/summary" },
  { label: "Ruxsatlar", icon: "i-lucide-calendar-check", to: "/staff-attendance/permissions" },
  { label: "Jarima qoidalari", icon: "i-lucide-shield-alert", to: "/staff-attendance/policies" },
];

// Default: current month
const now = new Date();
const startDate = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
const endDate = ref(now.toISOString().slice(0, 10));

const summary = ref<AttendanceSummaryItem[]>([]);
const isLoading = ref(false);
const page = usePaginationState("page", 1);
const limit = usePaginationState("limit", 20);
const totalItems = ref(0);

const totalStats = computed(() =>
  summary.value.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      on_time: acc.on_time + row.on_time,
      early: acc.early + row.early,
      late: acc.late + row.late,
      total_fine: acc.total_fine + row.total_fine,
    }),
    { total: 0, on_time: 0, early: 0, late: 0, total_fine: 0 },
  ),
);

const columns = [
  {
    accessorKey: "teacher",
    header: "Xodim",
    cell: ({ row }: any) => {
      const t = row.original.teacher;
      return h("div", { class: "flex flex-col" }, [
        h("span", { class: "font-medium" }, `${t.first_name} ${t.last_name}`),
        h("span", { class: "text-xs text-muted" }, `@${t.username}`),
      ]);
    },
  },
  {
    accessorKey: "total",
    header: "Jami",
    cell: ({ row }: any) =>
      h("span", { class: "font-medium" }, row.original.total),
  },
  {
    accessorKey: "on_time",
    header: "O'z vaqtida",
    cell: ({ row }: any) =>
      h(UBadge, { color: "success", variant: "subtle" }, () => row.original.on_time),
  },
  {
    accessorKey: "early",
    header: "Erta",
    cell: ({ row }: any) =>
      h(UBadge, { color: "info", variant: "subtle" }, () => row.original.early),
  },
  {
    accessorKey: "late",
    header: "Kechikdi",
    cell: ({ row }: any) =>
      h(UBadge, { color: row.original.late > 0 ? "error" : "neutral", variant: "subtle" },
        () => row.original.late,
      ),
  },
  {
    accessorKey: "excused",
    header: "Ruxsatli",
    cell: ({ row }: any) =>
      h(UBadge, { color: (row.original.excused || 0) > 0 ? "warning" : "neutral", variant: "subtle" },
        () => row.original.excused || 0,
      ),
  },
  {
    accessorKey: "avg_minutes_late",
    header: "O'rt. kechikish",
    cell: ({ row }: any) =>
      h("span",
        { class: row.original.avg_minutes_late > 0 ? "text-red-600 dark:text-red-400" : "text-muted" },
        row.original.avg_minutes_late > 0 ? `${row.original.avg_minutes_late} daq.` : "—",
      ),
  },
  {
    accessorKey: "attendance_rate",
    header: "Davomat %",
    cell: ({ row }: any) => {
      const rate = parseFloat(row.original.attendance_rate);
      return h("span",
        { class: rate >= 90 ? "text-green-600 font-medium" : rate >= 70 ? "text-yellow-600 font-medium" : "text-red-600 font-medium" },
        `${rate.toFixed(1)}%`,
      );
    },
  },
  {
    accessorKey: "total_fine",
    header: "Jarima",
    cell: ({ row }: any) =>
      h("span",
        { class: row.original.total_fine > 0 ? "font-semibold text-red-600 dark:text-red-400" : "text-muted" },
        row.original.total_fine > 0 ? formatMoney(row.original.total_fine) : "—",
      ),
  },
];

async function load() {
  if (!startDate.value || !endDate.value) return;
  isLoading.value = true;
  try {
    const res = await getSummary({ startDate: startDate.value, endDate: endDate.value, page: page.value, limit: limit.value });
    summary.value = res.data;
    totalItems.value = res.total;
  } catch (err: any) {
    toast.add({ title: "Xatolik", description: err.message, color: "error" });
  } finally {
    isLoading.value = false;
  }
}

const formatMoney = (n: number) => `${n.toLocaleString("uz-UZ")} so'm`;

onMounted(load);
</script>
