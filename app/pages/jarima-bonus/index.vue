<template>
  <UDashboardPanel id="jarima-bonus">
    <template #header>
      <UDashboardNavbar title="Jarima & Bonus" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          O'qituvchilarga bonus berish va jarima yozish
        </template>

        <template #right>
          <UButton icon="i-lucide-hand-coins" label="Bonus / Jarima qo'shish" @click="openDialog()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Stats Overview -->
        <div class="grid gap-4 md:grid-cols-3">
          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Jami summa</p>
                <p class="text-2xl font-bold mt-1">{{ formatCurrency(totalAmount) }}</p>
                <p class="text-xs text-gray-500 mt-1">Tanlangan filtr bo'yicha</p>
              </div>
              <span class="i-lucide-banknote text-gray-400 text-2xl"></span>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Yozuvlar soni</p>
                <p class="text-2xl font-bold mt-1">{{ totalCount }}</p>
                <p class="text-xs text-gray-500 mt-1">Bonus va jarimalar</p>
              </div>
              <span class="i-lucide-list text-gray-400 text-2xl"></span>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Tur</p>
                <p class="text-2xl font-bold mt-1">
                  {{ typeOptions.find((t) => t.value === typeFilter)?.label || "Barchasi" }}
                </p>
                <p class="text-xs text-gray-500 mt-1">Joriy filtr</p>
              </div>
              <span class="i-lucide-filter text-gray-400 text-2xl"></span>
            </div>
          </UCard>
        </div>

        <!-- Filters Section -->
        <UDashboardToolbar>
          <template #left>
            <USelectMenu v-model="teacherFilter" :items="teacherFilterOptions" value-key="value"
              placeholder="O'qituvchi" class="w-56" />
          </template>

          <template #right>
            <USelectMenu v-model="typeFilter" :items="typeOptions" value-key="value" placeholder="Tur" class="w-36">
              <template #label>
                {{ typeOptions.find((t) => t.value === typeFilter)?.label || "Tur" }}
              </template>
            </USelectMenu>

            <UInput v-model.number="minAmount" type="number" placeholder="Min. summa" class="w-32" />

            <div class="flex items-center gap-2">
              <UInput v-model="startDate" type="date" class="w-40" />
              <UInput v-model="endDate" type="date" class="w-40" />
            </div>

            <UButton v-if="hasActiveFilters" icon="i-lucide-x" label="Tozalash" variant="ghost" @click="clearFilters" />

            <UButton icon="i-lucide-refresh-cw" label="Yangilash" variant="outline" @click="fetchRecords" />
          </template>
        </UDashboardToolbar>

        <!-- Records Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Bonus va jarimalar</h3>
          </template>

          <UTable :data="records" :columns="columns" :loading="loading" :empty="'Yozuvlar topilmadi'" />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                <span class="font-medium">{{ totalCount }}</span>
                ta yozuv
              </div>

              <UPagination :model-value="currentPage" :total="totalCount" :items-per-page="itemsPerPage" show-last
                show-first @update:page="(p: number) => (currentPage = p)" />
            </div>
          </template>
        </UCard>
      </div>

      <!-- Bonus / Jarima Modal -->
      <UModal v-model:open="showDialog" :title="form.type === 'bonus' ? 'O\'qituvchiga bonus' : 'O\'qituvchiga jarima'">
        <template #body>
          <form @submit.prevent="submit" class="space-y-4">
            <UFormField label="Tur" name="type">
              <USelectMenu v-model="form.type" :items="formTypeOptions" value-key="value" class="w-full">
                <template #label>
                  {{ form.type === "bonus" ? "Bonus" : "Jarima" }}
                </template>
              </USelectMenu>
            </UFormField>

            <UFormField label="O'qituvchi" name="teacher">
              <USelectMenu v-model="form.teacher_id" :items="teacherOptions" value-key="value"
                placeholder="O'qituvchini tanlang" class="w-full" />
            </UFormField>

            <UFormField label="Summa" name="amount">
              <UInput v-model.number="form.amount" type="number" placeholder="Summa kiriting" class="w-full" />
            </UFormField>

            <UFormField label="Izoh" name="description">
              <UTextarea v-model="form.description" placeholder="Izoh kiriting..." :rows="3" class="w-full" />
            </UFormField>

            <UFormField label="Sana" name="date">
              <UInput v-model="form.expense_date" type="date" class="w-full" />
            </UFormField>
          </form>
        </template>

        <template #footer="{ close }">
          <div class="flex justify-end gap-2">
            <UButton label="Bekor qilish" variant="outline" @click="close" />
            <UButton :label="form.type === 'bonus' ? 'Bonus berish' : 'Jarima yozish'"
              :color="form.type === 'bonus' ? 'green' : 'red'" :loading="isSubmitting" @click="submit" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const UBadge = resolveComponent("UBadge");

const { apiService, auth } = useAuth();
const { formatPhone } = usePhoneFormatter();
const toast = useToast();

definePageMeta({
  middleware: ["auth"],
});

type TransactionType = "bonus" | "jarima";

interface Teacher {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_active: boolean;
}

interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// A bonus/penalty expense row. Fields beyond the basics are optional because
// the backend may nest teacher/category info or send it flat.
interface BonusPenaltyRow {
  id: string;
  teacher_id: string | null;
  teacher_name?: string;
  teacher?: { first_name?: string; last_name?: string; phone?: string };
  type?: string;
  category_id?: string;
  category?: { name?: string };
  title?: string;
  amount: number;
  description: string | null;
  expense_date: string;
  created_at?: string;
}

// State
const records = ref<BonusPenaltyRow[]>([]);
const teachers = ref<Teacher[]>([]);
const categories = ref<ExpenseCategory[]>([]);
const loading = ref(true);

// Current-month date defaults (YYYY-MM-DD, local time)
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
const typeFilter = ref<"all" | TransactionType>("all");
const teacherFilter = ref<string | null>(null);
const minAmount = ref<number | null>(null);
const startDate = ref(getMonthStart());
const endDate = ref(getMonthEnd());

// Pagination (server-side)
const currentPage = ref(1);
const itemsPerPage = 10;
const totalCount = ref(0);
const totalAmount = ref(0);

// Modal
const showDialog = ref(false);
const isSubmitting = ref(false);
const form = reactive({
  type: "bonus" as TransactionType,
  teacher_id: "" as string,
  amount: 0,
  description: "",
  expense_date: new Date().toISOString().split("T")[0],
});

// Options
const typeOptions = [
  { label: "Barchasi", value: "all" as const },
  { label: "Bonus", value: "bonus" as const },
  { label: "Jarima", value: "jarima" as const },
];

// Type options for the create modal (no "Barchasi")
const formTypeOptions = [
  { label: "Bonus", value: "bonus" as const },
  { label: "Jarima", value: "jarima" as const },
];

const teacherOptions = computed(() =>
  teachers.value.map((t) => ({
    label: `${t.first_name} ${t.last_name}`,
    value: t.user_id,
  })),
);

const teacherFilterOptions = computed(() => [
  { label: "Barcha o'qituvchilar", value: null },
  ...teacherOptions.value,
]);

const hasActiveFilters = computed(
  () =>
    typeFilter.value !== "all" ||
    teacherFilter.value !== null ||
    minAmount.value !== null ||
    startDate.value !== getMonthStart() ||
    endDate.value !== getMonthEnd(),
);

const paginationStart = computed(() =>
  totalCount.value === 0 ? 0 : (currentPage.value - 1) * itemsPerPage + 1,
);
const paginationEnd = computed(() =>
  Math.min(currentPage.value * itemsPerPage, totalCount.value),
);

// Helpers to read fields that the backend may send flat or nested
const categoryNameById = (id?: string) =>
  categories.value.find((c) => c.id === id)?.name || "";

const getType = (row: BonusPenaltyRow): TransactionType => {
  const raw = (
    row.type ||
    row.category?.name ||
    categoryNameById(row.category_id) ||
    row.title ||
    ""
  ).toLowerCase();
  return raw.includes("jarima") ? "jarima" : "bonus";
};

const getTeacherName = (row: BonusPenaltyRow) => {
  if (row.teacher_name) return row.teacher_name;
  if (row.teacher?.first_name)
    return `${row.teacher.first_name} ${row.teacher.last_name || ""}`.trim();
  const t = teachers.value.find((x) => x.user_id === row.teacher_id);
  return t ? `${t.first_name} ${t.last_name}` : "-";
};

const getTeacherPhone = (row: BonusPenaltyRow) => {
  if (row.teacher?.phone) return row.teacher.phone;
  const t = teachers.value.find((x) => x.user_id === row.teacher_id);
  return t?.phone || "";
};

// Table columns
const columns: TableColumn<BonusPenaltyRow>[] = [
  {
    accessorKey: "teacher",
    header: "O'qituvchi",
    cell: ({ row }) => {
      const phone = getTeacherPhone(row.original);
      return h("div", {}, [
        h("div", { class: "font-medium" }, getTeacherName(row.original)),
        phone
          ? h("div", { class: "text-xs text-gray-500" }, formatPhone(phone))
          : null,
      ]);
    },
  },
  {
    accessorKey: "type",
    header: "Tur",
    cell: ({ row }) => {
      const type = getType(row.original);
      return h(
        UBadge,
        { color: type === "bonus" ? "green" : "red", variant: "subtle" },
        () => [
          h("span", {
            class: `${type === "bonus" ? "i-lucide-trending-up" : "i-lucide-trending-down"} mr-1`,
          }),
          type === "bonus" ? "Bonus" : "Jarima",
        ],
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Summa",
    cell: ({ row }) => {
      const type = getType(row.original);
      return h(
        "span",
        {
          class:
            type === "bonus"
              ? "font-semibold text-green-600"
              : "font-semibold text-red-600",
        },
        `${type === "bonus" ? "+" : "-"} ${formatCurrency(row.original.amount)}`,
      );
    },
  },
  {
    accessorKey: "description",
    header: "Izoh",
    cell: ({ row }) =>
      h(
        "div",
        { class: "max-w-[220px] truncate" },
        row.original.description || "-",
      ),
  },
  {
    accessorKey: "expense_date",
    header: "Sana",
    cell: ({ row }) => formatDate(row.original.expense_date),
  },
];

// Methods
const fetchRecords = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: itemsPerPage.toString(),
    });
    if (typeFilter.value !== "all") params.append("type", typeFilter.value);
    if (teacherFilter.value) params.append("teacher_id", teacherFilter.value);
    if (minAmount.value) params.append("min_amount", String(minAmount.value));
    if (startDate.value) params.append("start_date", startDate.value);
    if (endDate.value) params.append("end_date", endDate.value);

    const response = await api.get<{
      expenses: BonusPenaltyRow[];
      total: number;
      count: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(
      apiService.value,
      `/expenses/teachers/bonus-penalty?${params.toString()}`,
    );

    records.value = response.expenses || [];
    totalCount.value = response.count || 0;
    totalAmount.value = response.total || 0;
  } catch (error) {
    console.error("Failed to fetch bonus/penalty records:", error);
    toast.add({
      title: "Xatolik",
      description: "Yozuvlarni yuklashda xatolik yuz berdi",
      color: "error",
    });
    records.value = [];
    totalCount.value = 0;
    totalAmount.value = 0;
  } finally {
    loading.value = false;
  }
};

const fetchTeachers = async () => {
  try {
    const response = await api.get<{ data: Teacher[] }>(
      apiService.value,
      "/users/teachers?limit=100",
    );
    teachers.value = response.data || [];
  } catch (error) {
    console.error("Failed to fetch teachers:", error);
    teachers.value = [];
  }
};

const fetchCategories = async () => {
  try {
    const response = await api.get<ExpenseCategory[]>(
      apiService.value,
      "/expense-categories?names=bonus,jarima",
    );
    categories.value = response || [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    categories.value = [];
  }
};

// Resolve the expense category matching the chosen type (bonus / jarima).
const findCategoryForType = (type: TransactionType) =>
  categories.value.find((c) => c.name.toLowerCase().includes(type));

const openDialog = (teacherId?: string, type: TransactionType = "bonus") => {
  form.type = type;
  form.teacher_id = teacherId || "";
  form.amount = 0;
  form.description = "";
  form.expense_date = new Date().toISOString().split("T")[0];
  showDialog.value = true;
};

const submit = async () => {
  if (!form.teacher_id) {
    toast.add({ title: "Xatolik", description: "Iltimos, o'qituvchini tanlang.", color: "error" });
    return;
  }
  if (!form.amount || form.amount <= 0) {
    toast.add({ title: "Xatolik", description: "Iltimos, to'g'ri summa kiriting.", color: "error" });
    return;
  }

  const category = findCategoryForType(form.type);
  if (!category) {
    toast.add({
      title: "Xatolik",
      description: `"${form.type === "bonus" ? "Bonus" : "Jarima"}" kategoriyasi topilmadi.`,
      color: "error",
    });
    return;
  }

  isSubmitting.value = true;
  try {
    const teacher = teachers.value.find((t) => t.user_id === form.teacher_id);
    const teacherName = teacher
      ? `${teacher.first_name} ${teacher.last_name}`
      : "";
    const typeLabel = form.type === "bonus" ? "Bonus" : "Jarima";

    const payload = {
      title: `${teacherName} ${typeLabel}`.trim(),
      category_id: category.id,
      description: form.description || null,
      amount: Number(form.amount),
      expense_date: new Date(form.expense_date).toISOString(),
      teacher_id: form.teacher_id,
      reported_by: auth.value.user?.id || null,
    };

    await api.post(apiService.value, "/expenses", payload);

    toast.add({
      title: "Muvaffaqiyat",
      description:
        form.type === "bonus"
          ? "Bonus muvaffaqiyatli berildi."
          : "Jarima muvaffaqiyatli yozildi.",
      color: "success",
    });

    showDialog.value = false;
    currentPage.value = 1;
    await fetchRecords();
  } catch (error) {
    console.error("Failed to submit:", error);
    toast.add({
      title: "Xatolik",
      description: "Amalni bajarishda xatolik yuz berdi.",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const clearFilters = () => {
  typeFilter.value = "all";
  teacherFilter.value = null;
  minAmount.value = null;
  startDate.value = getMonthStart();
  endDate.value = getMonthEnd();
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("uz-UZ", {
    style: "decimal",
    minimumFractionDigits: 0,
  }).format(amount) + " so'm";

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
};

// Refetch on filter changes (reset to first page)
watch([typeFilter, teacherFilter, minAmount, startDate, endDate], () => {
  currentPage.value = 1;
  fetchRecords();
});

// Refetch on page change
watch(currentPage, () => {
  fetchRecords();
});

onMounted(() => {
  fetchCategories();
  fetchTeachers();
  fetchRecords();
});
</script>
