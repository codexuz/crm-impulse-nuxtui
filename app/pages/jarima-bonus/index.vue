<template>
  <UDashboardPanel id="jarima-bonus">
    <template #header>
      <UDashboardNavbar title="" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UNavigationMenu :items="navItems" highlight />
        </template>

        <template #description>
          O'qituvchilarga bonus, jarima va referal to'lovlari
        </template>

        <template #right>
          <UButton icon="i-lucide-hand-coins" label="Bonus / Jarima qo'shish" @click="openCreate()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Stats -->
        <JarimaBonusWalletStatsCards :bonus-total="summary.bonus" :jarima-total="summary.jarima"
          :referal-total="summary.referal" :count="totalCount" />

        <!-- Filters -->
        <UDashboardToolbar>
          <template #left>
            <USelectMenu v-model="teacherFilter" :items="teacherFilterOptions" value-key="value"
              placeholder="O'qituvchi" searchable class="w-56" />
          </template>

          <template #right>
            <USelectMenu v-model="typeFilter" :items="typeFilterOptions" value-key="value" placeholder="Tur"
              class="w-36">
              <template #label>
                {{ typeFilterOptions.find((t) => t.value === typeFilter)?.label || "Tur" }}
              </template>
            </USelectMenu>

            <USelectMenu v-model="categoryFilter" :items="categoryFilterOptions" value-key="value"
              placeholder="Kategoriya" class="w-44" />

            <div class="flex items-center gap-2">
              <UInput v-model="startDate" type="date" class="w-40" />
              <UInput v-model="endDate" type="date" class="w-40" />
            </div>

            <UButton v-if="hasActiveFilters" icon="i-lucide-x" label="Tozalash" variant="ghost" @click="clearFilters" />
            <UButton icon="i-lucide-refresh-cw" label="Yangilash" variant="outline" @click="fetchRecords" />
          </template>
        </UDashboardToolbar>

        <!-- Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Bonus, jarima va referal yozuvlari</h3>
          </template>

          <UTable :data="records" :columns="columns" :loading="loading" :empty="'Yozuvlar topilmadi'" />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                <span class="font-medium">{{ totalCount }}</span> ta yozuv
              </div>
              <UPagination :model-value="currentPage" :total="totalCount" :items-per-page="itemsPerPage" show-last
                show-first @update:page="(p: number) => (currentPage = p)" />
            </div>
          </template>
        </UCard>
      </div>

      <JarimaBonusTransactionModal v-model:open="showDialog" :teachers="teachers" :categories="categories"
        :default-teacher-id="presetTeacherId" :default-type="presetType" @created="onCreated" />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn, NavigationMenuItem } from "@nuxt/ui";
import {
  useBonusPenalty,
  BONUS_PENALTY_TYPE_LABELS,
  type BonusPenaltyType,
  type BonusPenaltyTransaction,
  type BonusPenaltyCategory,
  type BonusPenaltyUserRef,
} from "~/composables/useBonusPenalty";

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UPopover = resolveComponent("UPopover");

const { formatPhone } = usePhoneFormatter();
const { hasFinancialAccess } = useFinancialAccess();
const {
  listTransactions,
  deleteTransaction,
  listCategories,
  listWallets,
  signedAmount,
  typeColor,
} = useBonusPenalty();
const toast = useToast();

definePageMeta({ middleware: ["auth"] });

const navItems: NavigationMenuItem[] = [
  { label: "Tranzaksiyalar", icon: "i-lucide-hand-coins", to: "/jarima-bonus" },
  { label: "Hamyonlar", icon: "i-lucide-wallet", to: "/jarima-bonus/wallets" },
  { label: "Kategoriyalar", icon: "i-lucide-tags", to: "/jarima-bonus/categories" },
];

// --- State ---
const records = ref<BonusPenaltyTransaction[]>([]);
const teachers = ref<BonusPenaltyUserRef[]>([]);
const categories = ref<BonusPenaltyCategory[]>([]);
const loading = ref(true);

const pad = (n: number) => String(n).padStart(2, "0");
const getMonthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
};
const getMonthEnd = () => {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`;
};

// Filters
const typeFilter = ref<"all" | BonusPenaltyType>("all");
const teacherFilter = ref<string | null>(null);
const categoryFilter = ref<string | null>(null);
const startDate = ref(getMonthStart());
const endDate = ref(getMonthEnd());

// Pagination
const currentPage = ref(1);
const itemsPerPage = 10;
const totalCount = ref(0);
const summary = reactive({ bonus: 0, jarima: 0, referal: 0 });

// Create modal
const showDialog = ref(false);
const presetTeacherId = ref<string | null>(null);
const presetType = ref<BonusPenaltyType>("bonus");

// --- Options ---
const typeFilterOptions = [
  { label: "Barchasi", value: "all" as const },
  { label: "Bonus", value: "bonus" as const },
  { label: "Jarima", value: "jarima" as const },
  { label: "Referal", value: "referal" as const },
];

const teacherOptions = computed(() =>
  teachers.value.map((t) => ({
    label: `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() || t.username || t.user_id,
    value: t.user_id,
  })),
);

const teacherFilterOptions = computed(() => [
  { label: "Barcha xondimlar", value: null },
  ...teacherOptions.value,
]);

const categoryFilterOptions = computed(() => [
  { label: "Barcha kategoriyalar", value: null },
  ...categories.value.map((c) => ({ label: c.name, value: c.id })),
]);

const hasActiveFilters = computed(
  () =>
    typeFilter.value !== "all" ||
    teacherFilter.value !== null ||
    categoryFilter.value !== null ||
    startDate.value !== getMonthStart() ||
    endDate.value !== getMonthEnd(),
);

const paginationStart = computed(() =>
  totalCount.value === 0 ? 0 : (currentPage.value - 1) * itemsPerPage + 1,
);
const paginationEnd = computed(() =>
  Math.min(currentPage.value * itemsPerPage, totalCount.value),
);

// --- Helpers ---
const teacherName = (row: BonusPenaltyTransaction) => {
  if (row.teacher?.first_name)
    return `${row.teacher.first_name} ${row.teacher.last_name || ""}`.trim();
  const t = teachers.value.find((x) => x.user_id === row.teacher_id);
  return t ? `${t.first_name} ${t.last_name}` : "-";
};
const teacherPhone = (row: BonusPenaltyTransaction) => {
  if (row.teacher?.phone) return row.teacher.phone;
  return teachers.value.find((x) => x.user_id === row.teacher_id)?.phone || "";
};

// Referring student (only present on "referal" transactions).
const studentName = (row: BonusPenaltyTransaction) =>
  row.student
    ? `${row.student.first_name ?? ""} ${row.student.last_name ?? ""}`.trim() ||
      row.student.username ||
      "-"
    : "-";

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return `${pad(date.getUTCDate())}-${pad(date.getUTCMonth() + 1)}-${date.getUTCFullYear()}`;
};

const deletePopoverOpen = ref<Record<string, boolean>>({});
const isDeleting = ref(false);

// --- Columns ---
const baseColumns: TableColumn<BonusPenaltyTransaction>[] = [
  {
    accessorKey: "teacher",
    header: "Xodimlar",
    cell: ({ row }) => {
      const phone = teacherPhone(row.original);
      return h("div", {}, [
        h("div", { class: "font-medium" }, teacherName(row.original)),
        phone ? h("div", { class: "text-xs text-gray-500" }, formatPhone(phone)) : null,
      ]);
    },
  },
  {
    accessorKey: "type",
    header: "Tur",
    cell: ({ row }) => {
      const type = row.original.type;
      return h(
        UBadge,
        { color: typeColor(type), variant: "subtle" },
        () => BONUS_PENALTY_TYPE_LABELS[type] || type,
      );
    },
  },
  {
    accessorKey: "student",
    header: "Taklif qilgan o'quvchi",
    cell: ({ row }) => {
      const t = row.original;
      if (t.type !== "referal" || (!t.student && !t.lead)) {
        return h("span", { class: "text-gray-400" }, "-");
      }
      const phone = t.student?.phone;
      const leadName = t.lead
        ? `${t.lead.first_name ?? ""} ${t.lead.last_name ?? ""}`.trim()
        : "";
      return h("div", {}, [
        h("div", { class: "font-medium" }, t.student ? studentName(t) : "-"),
        phone ? h("div", { class: "text-xs text-gray-500" }, formatPhone(phone)) : null,
        leadName
          ? h(
              "button",
              {
                type: "button",
                class: "text-xs text-blue-600 hover:underline cursor-pointer",
                onClick: () =>
                  navigateTo(
                    `/leads?page=1&limit=10&search=${encodeURIComponent(t.lead!.first_name)}`,
                  ),
              },
              `→ Lead: ${leadName}`,
            )
          : null,
      ]);
    },
  },
  {
    accessorKey: "category",
    header: "Kategoriya",
    cell: ({ row }) => row.original.category?.name || "-",
  },
  {
    accessorKey: "amount",
    header: "Summa",
    cell: ({ row }) =>
      h(
        "span",
        {
          class:
            row.original.type === "jarima"
              ? "font-semibold text-red-600"
              : "font-semibold text-green-600",
        },
        signedAmount(row.original),
      ),
  },
  {
    accessorKey: "description",
    header: "Izoh",
    cell: ({ row }) =>
      h("div", { class: "max-w-[220px] truncate" }, row.original.description || "-"),
  },
  {
    accessorKey: "created_at",
    header: "Sana",
    cell: ({ row }) => formatDate(row.original.created_at),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const id = row.original.id;
      return h("div", { class: "flex justify-end" }, [
        h(
          UPopover,
          {
            open: deletePopoverOpen.value[id] || false,
            "onUpdate:open": (v: boolean) => (deletePopoverOpen.value[id] = v),
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
                h("p", { class: "text-sm text-gray-600" },
                  "Yozuvni o'chirish hamyon balansini tiklaydi. Davom etilsinmi?"),
                h("div", { class: "flex justify-end gap-2" }, [
                  h(UButton, {
                    color: "neutral",
                    variant: "subtle",
                    label: "Bekor",
                    size: "sm",
                    onClick: () => (deletePopoverOpen.value[id] = false),
                  }),
                  h(UButton, {
                    color: "error",
                    label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                    loading: isDeleting.value,
                    size: "sm",
                    onClick: async () => {
                      await confirmDelete(id);
                      deletePopoverOpen.value[id] = false;
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

// Delete (actions) column is only visible to owner/manager — hidden for admins.
const columns = computed<TableColumn<BonusPenaltyTransaction>[]>(() =>
  hasFinancialAccess.value
    ? baseColumns
    : baseColumns.filter((c) => "id" in c && c.id !== "actions"),
);

// --- Data ---
const queryBase = () => ({
  teacher_id: teacherFilter.value || undefined,
  category_id: categoryFilter.value || undefined,
  start_date: startDate.value || undefined,
  end_date: endDate.value || undefined,
});

const fetchRecords = async () => {
  loading.value = true;
  try {
    const response = await listTransactions({
      page: currentPage.value,
      limit: itemsPerPage,
      type: typeFilter.value === "all" ? undefined : typeFilter.value,
      ...queryBase(),
    });
    records.value = response.data || [];
    totalCount.value = response.pagination?.total || 0;
  } catch (error) {
    console.error("Failed to fetch records:", error);
    toast.add({ title: "Xatolik", description: "Yozuvlarni yuklashda xatolik", color: "error" });
    records.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
};

// Per-type totals for the stat cards (one light call each, limit 1).
const fetchSummary = async () => {
  try {
    const [bonus, jarima, referal] = await Promise.all([
      listTransactions({ ...queryBase(), type: "bonus", limit: 1 }),
      listTransactions({ ...queryBase(), type: "jarima", limit: 1 }),
      listTransactions({ ...queryBase(), type: "referal", limit: 1 }),
    ]);
    summary.bonus = bonus.totalAmount || 0;
    summary.jarima = jarima.totalAmount || 0;
    summary.referal = referal.totalAmount || 0;
  } catch (error) {
    console.error("Failed to fetch summary:", error);
  }
};

// Recipients come from the wallets' embedded staff data (every eligible
// admin/teacher/support_teacher has a wallet) — no /users/* call needed.
const fetchTeachers = async () => {
  try {
    const wallets = await listWallets();
    const map = new Map<string, BonusPenaltyUserRef>();
    for (const w of wallets) {
      if (w.teacher?.user_id) map.set(w.teacher.user_id, w.teacher);
    }
    teachers.value = Array.from(map.values());
  } catch {
    teachers.value = [];
  }
};

const fetchCategories = async () => {
  try {
    categories.value = await listCategories();
  } catch {
    categories.value = [];
  }
};

const confirmDelete = async (id: string) => {
  isDeleting.value = true;
  try {
    await deleteTransaction(id);
    toast.add({ title: "Muvaffaqiyat", description: "Yozuv o'chirildi", color: "success" });
    await Promise.all([fetchRecords(), fetchSummary()]);
  } catch (error) {
    console.error("Failed to delete:", error);
    toast.add({ title: "Xatolik", description: "O'chirishda xatolik", color: "error" });
  } finally {
    isDeleting.value = false;
  }
};

const openCreate = (teacherId?: string, type: BonusPenaltyType = "bonus") => {
  presetTeacherId.value = teacherId || null;
  presetType.value = type;
  showDialog.value = true;
};

const onCreated = async () => {
  currentPage.value = 1;
  await Promise.all([fetchRecords(), fetchSummary()]);
};

const clearFilters = () => {
  typeFilter.value = "all";
  teacherFilter.value = null;
  categoryFilter.value = null;
  startDate.value = getMonthStart();
  endDate.value = getMonthEnd();
};

watch([typeFilter, teacherFilter, categoryFilter, startDate, endDate], () => {
  currentPage.value = 1;
  fetchRecords();
  fetchSummary();
});

watch(currentPage, fetchRecords);

onMounted(() => {
  fetchCategories();
  fetchTeachers();
  fetchRecords();
  fetchSummary();
});
</script>
