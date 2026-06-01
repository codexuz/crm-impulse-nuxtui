<template>
  <UDashboardPanel id="staff-attendance">
    <template #header>
      <UDashboardNavbar title="Xodimlar davomati" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          Barcha xodimlar (o'qituvchi va adminlar) ish davomatini kuzatish
        </template>

        <template #right>
          <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" :loading="pending"
            @click="loadAttendance">
            Yangilash
          </UButton>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput v-model="filters.query" icon="i-lucide-search" placeholder="Xodim ismi bo'yicha qidirish..."
            class="w-64" />
        </template>

        <template #right>
          <USelectMenu v-model="filters.status" :items="statusFilterOptions" value-key="value" placeholder="Holat"
            class="w-40">
            <template #label>
              {{ statusFilterOptions.find((s) => s.value === filters.status)?.label || "Holat" }}
            </template>
          </USelectMenu>

          <USelectMenu v-model="filters.type" :items="typeFilterOptions" value-key="value" placeholder="Turi"
            class="w-36">
            <template #label>
              {{ typeFilterOptions.find((t) => t.value === filters.type)?.label || "Turi" }}
            </template>
          </USelectMenu>

          <UInput v-model="filters.startDate" type="date" class="w-44" />
          <UInput v-model="filters.endDate" type="date" class="w-44" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold">Davomat yozuvlari</h3>
        </template>

        <UTable :data="records" :columns="columns" :loading="pending" :empty="'Davomat yozuvlari topilmadi'" />

        <template #footer>
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-500">
              <span class="font-medium">{{ paginationStart }}</span> dan
              <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
              <span class="font-medium">{{ totalRecords }}</span> ta yozuv
            </div>

            <UPagination :model-value="currentPage" :total="totalRecords" :items-per-page="limit" show-last show-first
              @update:page="(p: number) => (currentPage = p)" />
          </div>
        </template>
      </UCard>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, h, resolveComponent } from "vue";
import { useStaffAttendance } from "~/composables/useStaffAttendance";
import type {
  StaffAttendanceRecord,
  StaffAttendanceStatus,
} from "~/types/attendance";

definePageMeta({
  middleware: ["auth"],
});

const UIcon = resolveComponent("UIcon");
const UAvatar = resolveComponent("UAvatar");
const UBadge = resolveComponent("UBadge");

const { getAllAttendances } = useStaffAttendance();
const toast = useToast();

const records = ref<StaffAttendanceRecord[]>([]);
const totalRecords = ref(0);
const currentPage = ref(1);
const limit = ref(10);
const pending = ref(false);

const filters = ref({
  query: "",
  status: "all",
  type: "all",
  startDate: "",
  endDate: "",
});

const statusFilterOptions = [
  { value: "all", label: "Barcha holatlar" },
  { value: "early", label: "Erta" },
  { value: "on_time", label: "O'z vaqtida" },
  { value: "late", label: "Kech" },
];

const typeFilterOptions = [
  { value: "all", label: "Barchasi" },
  { value: "in", label: "Kirish" },
  { value: "out", label: "Chiqish" },
];

const paginationStart = computed(() =>
  totalRecords.value === 0 ? 0 : (currentPage.value - 1) * limit.value + 1,
);
const paginationEnd = computed(() =>
  Math.min(currentPage.value * limit.value, totalRecords.value),
);

const columns = [
  {
    accessorKey: "date",
    header: "Sana",
    cell: ({ row }: any) =>
      h("div", { class: "flex items-center gap-2" }, [
        h(UIcon, {
          name: "i-heroicons-calendar-days",
          class: "w-4 h-4 text-gray-400",
        }),
        h("span", { class: "font-medium" }, formatDate(row.original.date)),
      ]),
  },
  {
    accessorKey: "teacher",
    header: "Xodim",
    cell: ({ row }: any) => {
      const t = row.original.teacher;
      const name = `${t?.first_name || ""} ${t?.last_name || ""}`.trim() || "Noma'lum";
      return h("div", { class: "flex items-center gap-3" }, [
        h(UAvatar, { src: t?.avatar_url || undefined, alt: name, size: "sm" }),
        h("span", { class: "font-medium" }, name),
      ]);
    },
  },
  {
    accessorKey: "group",
    header: "Guruh",
    cell: ({ row }: any) =>
      h(
        UBadge,
        { color: row.original.group ? "primary" : "neutral", variant: "subtle" },
        () => row.original.group?.name || "—",
      ),
  },
  {
    accessorKey: "type",
    header: "Turi",
    cell: ({ row }: any) =>
      h(
        UBadge,
        {
          color: row.original.type === "in" ? "info" : "neutral",
          variant: "subtle",
        },
        () => (row.original.type === "in" ? "Kirish" : "Chiqish"),
      ),
  },
  {
    accessorKey: "status",
    header: "Holat",
    cell: ({ row }: any) =>
      h(
        UBadge,
        { color: getStatusColor(row.original.status), variant: "subtle" },
        () => getStatusLabel(row.original.status),
      ),
  },
  {
    accessorKey: "minutes_late",
    header: "Kechikish",
    cell: ({ row }: any) =>
      h(
        "span",
        { class: row.original.minutes_late > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400" },
        row.original.minutes_late > 0 ? `${row.original.minutes_late} daq.` : "—",
      ),
  },
  {
    accessorKey: "fine_amount",
    header: "Jarima",
    cell: ({ row }: any) =>
      h(
        "span",
        {
          class: row.original.fine_amount > 0
            ? "font-medium text-red-600 dark:text-red-400"
            : "text-gray-400",
        },
        row.original.fine_amount > 0 ? formatMoney(row.original.fine_amount) : "—",
      ),
  },
  {
    accessorKey: "description",
    header: "Izoh",
    cell: ({ row }: any) =>
      h(
        "div",
        { class: "max-w-xs truncate", title: row.original.description || "" },
        row.original.description || "—",
      ),
  },
];

const loadAttendance = async () => {
  pending.value = true;
  try {
    const response = await getAllAttendances({
      page: currentPage.value,
      limit: limit.value,
      query: filters.value.query || undefined,
      status:
        filters.value.status !== "all"
          ? (filters.value.status as StaffAttendanceStatus)
          : undefined,
      type:
        filters.value.type !== "all"
          ? (filters.value.type as "in" | "out")
          : undefined,
      startDate: filters.value.startDate || undefined,
      endDate: filters.value.endDate || undefined,
    });

    records.value = response.data || [];
    totalRecords.value = response.total || 0;
  } catch (err: any) {
    toast.add({
      title: "Xatolik",
      description: err.message || "Ma'lumotlarni yuklashda xatolik",
      color: "error",
    });
  } finally {
    pending.value = false;
  }
};

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatMoney = (amount: number): string =>
  `${amount.toLocaleString("uz-UZ")} so'm`;

const getStatusColor = (status: StaffAttendanceStatus) => {
  const colors: Record<string, string> = {
    early: "info",
    on_time: "success",
    late: "error",
  };
  return colors[status] || "neutral";
};

const getStatusLabel = (status: StaffAttendanceStatus) => {
  const labels: Record<string, string> = {
    early: "Erta",
    on_time: "O'z vaqtida",
    late: "Kech",
  };
  return labels[status] || status;
};

watch(currentPage, loadAttendance);

watch(
  [
    () => filters.value.query,
    () => filters.value.status,
    () => filters.value.type,
    () => filters.value.startDate,
    () => filters.value.endDate,
  ],
  () => {
    currentPage.value = 1;
    loadAttendance();
  },
);

onMounted(loadAttendance);
</script>
