<template>
  <UDashboardPanel id="expenses">
    <template #header>
      <UDashboardNavbar title="Xarajatlar" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          Barcha xarajatlarni boshqarish va kuzatish
        </template>

        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="Yangi xarajat"
            @click="openCreateDialog"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Stats Overview -->
        <div class="grid gap-4 md:grid-cols-4">
          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Jami xarajatlar</p>
                <p class="text-2xl font-bold mt-1">{{ expensesCount }}</p>
                <p class="text-xs text-gray-500 mt-1">Umumiy xarajatlar soni</p>
              </div>
              <span class="i-lucide-receipt text-gray-400 text-2xl"></span>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Jami summa</p>
                <p class="text-2xl font-bold mt-1">
                  {{ formatCurrency(totalAmount) }}
                </p>
                <p class="text-xs text-gray-500 mt-1">Umumiy xarajatlar</p>
              </div>
              <span class="i-lucide-banknote text-gray-400 text-2xl"></span>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Bu oy</p>
                <p class="text-2xl font-bold mt-1">
                  {{ formatCurrency(currentMonthAmount) }}
                </p>
                <p class="text-xs text-gray-500 mt-1">Shu oylik xarajatlar</p>
              </div>
              <span class="i-lucide-calendar text-gray-400 text-2xl"></span>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">O'rtacha</p>
                <p class="text-2xl font-bold mt-1">
                  {{ formatCurrency(averageAmount) }}
                </p>
                <p class="text-xs text-gray-500 mt-1">O'rtacha xarajat</p>
              </div>
              <span class="i-lucide-trending-up text-gray-400 text-2xl"></span>
            </div>
          </UCard>
        </div>

        <!-- Filters Section -->
        <UDashboardToolbar>
          <template #left>
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Qidirish..."
              class="w-64"
            />
          </template>

          <template #right>
            <USelectMenu
              v-model="categoryFilter"
              :items="categoryOptions"
              value-key="value"
              placeholder="Kategoriya"
              class="w-48"
            >
              <template #label>
                {{
                  categoryOptions.find((c) => c.value === categoryFilter)
                    ?.label || "Kategoriya"
                }}
              </template>
            </USelectMenu>

            <UPopover :popper="{ placement: 'bottom-end' }">
              <UButton
                icon="i-lucide-calendar-range"
                label="Sana oralig'i"
                variant="outline"
                trailing
              />

              <template #content>
                <div class="p-4 space-y-3 w-80">
                  <div class="space-y-2">
                    <label class="text-sm font-medium">Boshlanish</label>
                    <UInput
                      v-model="startDate"
                      type="date"
                      placeholder="Boshlanish sanasi"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-medium">Tugash</label>
                    <UInput
                      v-model="endDate"
                      type="date"
                      placeholder="Tugash sanasi"
                    />
                  </div>
                </div>
              </template>
            </UPopover>

            <UButton
              icon="i-lucide-download"
              label="Eksport"
              variant="outline"
              @click="exportToCSV"
            />

            <UButton
              icon="i-lucide-refresh-cw"
              label="Yangilash"
              variant="outline"
              @click="refreshData"
            />
          </template>
        </UDashboardToolbar>

        <!-- Expenses Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Xarajatlar ro'yxati</h3>
          </template>

          <UTable
            :data="paginatedExpenses"
            :columns="columns"
            :loading="loading"
            :empty="'Xarajatlar topilmadi'"
          />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                <span class="font-medium">{{ filteredExpenses.length }}</span>
                ta xarajat
              </div>

              <UPagination
                :model-value="currentPage"
                :total="filteredExpenses.length"
                :items-per-page="itemsPerPage"
                show-last
                show-first
                @update:page="onPageChange"
              />
            </div>
          </template>
        </UCard>
      </div>

      <!-- Create/Edit Modal -->
      <UModal
        v-model:open="showExpenseDialog"
        :title="isEditMode ? 'Xarajatni tahrirlash' : 'Yangi xarajat'"
      >
        <template #body>
          <form @submit.prevent="saveExpense" class="space-y-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium">
                Sarlavha
                <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="expenseForm.title"
                placeholder="Xarajat sarlavhasi"
                required
                class="w-full"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">
                Kategoriya
                <span class="text-red-500">*</span>
              </label>
              <USelectMenu
                v-model="expenseForm.category_id"
                :items="categorySelectOptions"
                value-key="value"
                placeholder="Kategoriyani tanlang"
                class="w-full"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">
                Summa
                <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="expenseForm.amount"
                type="number"
                placeholder="0"
                required
                class="w-full"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">O'qituvchi</label>
              <USelectMenu
                v-model="expenseForm.teacher_id"
                :items="teacherOptions"
                value-key="value"
                placeholder="O'qituvchini tanlang"
                class="w-full"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">
                Sana
                <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="expenseForm.expense_date"
                type="datetime-local"
                required
                class="w-full"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">Tavsif</label>
              <UTextarea
                v-model="expenseForm.description"
                placeholder="Xarajat haqida ma'lumot"
                rows="3"
                class="w-full"
              />
            </div>
          </form>
        </template>

        <template #footer="{ close }">
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="outline"
              label="Bekor qilish"
              @click="close"
            />
            <UButton
              :label="isSaving ? 'Saqlanmoqda...' : 'Saqlash'"
              :loading="isSaving"
              @click="saveExpense"
            />
          </div>
        </template>
      </UModal>

      <!-- View Modal -->
      <UModal v-model:open="showViewDialog" title="Xarajat tafsilotlari">
        <template #body>
          <div v-if="selectedExpense" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">Sarlavha</h4>
                <p class="font-medium">{{ selectedExpense.title }}</p>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">
                  Kategoriya
                </h4>
                <UBadge variant="outline">
                  {{ getCategoryName(selectedExpense) }}
                </UBadge>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">Summa</h4>
                <p class="font-semibold text-red-600">
                  {{ formatCurrency(selectedExpense.amount) }}
                </p>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">
                  O'qituvchi
                </h4>
                <p>{{ selectedExpense.teacher_name || "-" }}</p>
              </div>
            </div>

            <div>
              <h4 class="text-sm font-medium text-gray-500 mb-1">Tavsif</h4>
              <p class="text-sm">{{ selectedExpense.description || "-" }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">
                  Xarajat sanasi
                </h4>
                <p class="text-sm">
                  {{ formatDate(selectedExpense.expense_date) }}
                </p>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">
                  Yaratilgan
                </h4>
                <p class="text-sm">
                  {{ formatDate(selectedExpense.created_at) }}
                </p>
              </div>
            </div>
          </div>
        </template>

        <template #footer="{ close }">
          <div class="flex justify-end">
            <UButton label="Yopish" @click="close" />
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
const UButton = resolveComponent("UButton");
const UPopover = resolveComponent("UPopover");

definePageMeta({
  middleware: ["auth"],
});

interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Expense {
  id: string;
  title: string;
  category_id: string;
  category?: Category;
  description: string | null;
  amount: number;
  expense_date: string;
  teacher_id: string | null;
  teacher_name?: string;
  reported_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Teacher {
  user_id: string;
  username: string;
  phone: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
}

const { apiService, auth } = useAuth();
const toast = useToast();
const router = useRouter();
const route = useRoute();

// State variables
const expenses = ref<Expense[]>([]);
const categories = ref<Category[]>([]);
const teachers = ref<Teacher[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const categoryFilter = ref("all");
const startDate = ref("");
const endDate = ref("");
const currentPage = ref(1);
const itemsPerPage = 10;
const showExpenseDialog = ref(false);
const showViewDialog = ref(false);
const selectedExpense = ref<Expense | null>(null);
const isEditMode = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const deletePopoverOpen = ref<Record<string, boolean>>({});

// Form data
const expenseForm = reactive({
  title: "",
  category_id: "",
  amount: 0,
  expense_date: "",
  teacher_id: null as string | null,
  reported_by: "",
  description: "",
});

// Table columns
const columns: TableColumn<Expense>[] = [
  {
    accessorKey: "title",
    header: "Sarlavha",
    cell: ({ row }) => {
      return h("div", { class: "font-medium" }, row.original.title);
    },
  },
  {
    accessorKey: "category_id",
    header: "Kategoriya",
    cell: ({ row }) => {
      return h(
        UBadge,
        {
          variant: "outline",
        },
        () => getCategoryName(row.original),
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Summa",
    cell: ({ row }) => {
      return h(
        "span",
        { class: "font-semibold text-red-600" },
        formatCurrency(row.original.amount),
      );
    },
  },
  {
    accessorKey: "teacher_name",
    header: "O'qituvchi",
    cell: ({ row }) => row.original.teacher_name || "-",
  },
  {
    accessorKey: "description",
    header: "Tavsif",
    cell: ({ row }) => {
      return h(
        "div",
        { class: "max-w-[200px] truncate" },
        row.original.description || "-",
      );
    },
  },
  {
    accessorKey: "expense_date",
    header: "Sana",
    cell: ({ row }) => formatDate(row.original.expense_date),
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      const expenseId = row.original.id;
      return h("div", { class: "flex justify-end gap-1" }, [
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-eye",
          size: "sm",
          square: true,
          onClick: () => viewExpense(row.original),
        }),
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-pencil",
          size: "sm",
          square: true,
          onClick: () => editExpense(row.original),
        }),
        h(
          UPopover,
          {
            open: deletePopoverOpen.value[expenseId] || false,
            "onUpdate:open": (value: boolean) => {
              deletePopoverOpen.value[expenseId] = value;
            },
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
                h(
                  "h4",
                  { class: "font-semibold text-sm" },
                  "Ishonchingiz komilmi?",
                ),
                h(
                  "p",
                  { class: "text-sm text-gray-600" },
                  "Bu xarajatni butunlay o'chiradi. Bu amalni qaytarib bo'lmaydi.",
                ),
                h("div", { class: "flex justify-end gap-2 mt-3" }, [
                  h(UButton, {
                    color: "neutral",
                    variant: "subtle",
                    label: "Bekor qilish",
                    size: "sm",
                    onClick: () => {
                      deletePopoverOpen.value[expenseId] = false;
                    },
                  }),
                  h(UButton, {
                    color: "red",
                    label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                    loading: isDeleting.value,
                    size: "sm",
                    onClick: async () => {
                      await confirmDelete(row.original);
                      deletePopoverOpen.value[expenseId] = false;
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

// Options
const categoryOptions = computed(() => [
  { label: "Barcha kategoriyalar", value: "all" },
  ...categories.value.map((cat) => ({
    label: cat.name,
    value: cat.id,
  })),
]);

const categorySelectOptions = computed(() =>
  categories.value.map((cat) => ({
    label: cat.name,
    value: cat.id,
  })),
);

const teacherOptions = computed(() => [
  { label: "Yo'q", value: null },
  ...teachers.value.map((teacher) => ({
    label: `${teacher.first_name} ${teacher.last_name}`,
    value: teacher.user_id,
  })),
]);

// Computed properties
const filteredExpenses = computed(() => {
  return expenses.value.filter((expense) => {
    // Filter by search query
    const searchMatch =
      expense.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      expense.description
        ?.toLowerCase()
        .includes(searchQuery.value.toLowerCase());

    // Filter by category
    const categoryMatch =
      categoryFilter.value === "all" ||
      expense.category_id === categoryFilter.value;

    return searchMatch && categoryMatch;
  });
});

const expensesCount = computed(() => filteredExpenses.value.length);

const totalAmount = computed(() => {
  return filteredExpenses.value.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
});

const currentMonthAmount = computed(() => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return filteredExpenses.value
    .filter((expense) => {
      const expenseDate = new Date(expense.expense_date);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
});

const averageAmount = computed(() => {
  if (filteredExpenses.value.length === 0) return 0;
  return Math.round(totalAmount.value / filteredExpenses.value.length);
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredExpenses.value.length / itemsPerPage));
});

const paginatedExpenses = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredExpenses.value.slice(startIndex, endIndex);
});

const paginationStart = computed(() => {
  return filteredExpenses.value.length === 0
    ? 0
    : (currentPage.value - 1) * itemsPerPage + 1;
});

const paginationEnd = computed(() => {
  return Math.min(
    currentPage.value * itemsPerPage,
    filteredExpenses.value.length,
  );
});

// Fetch data
const fetchExpenses = async () => {
  loading.value = true;
  try {
    let endpoint = "/expenses";

    // Use date range endpoint if both dates are provided
    if (startDate.value && endDate.value) {
      const params = new URLSearchParams({
        start_date: startDate.value,
        end_date: endDate.value,
      });
      endpoint = `/expenses/reports/date-range?${params.toString()}`;
    }

    const response = await api.get<{
      data: Expense[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, endpoint);

    // Map expenses to include teacher names from teachers array
    const expensesWithTeachers = (response.data || []).map((expense) => {
      if (expense.teacher_id) {
        const teacher = teachers.value.find(
          (t) => t.user_id === expense.teacher_id,
        );
        if (teacher) {
          return {
            ...expense,
            teacher_name: `${teacher.first_name} ${teacher.last_name}`,
          };
        }
      }
      return expense;
    });

    expenses.value = expensesWithTeachers;
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    toast.add({
      title: "Xatolik",
      description: "Xarajatlarni yuklashda xatolik yuz berdi",
      color: "error",
    });
    expenses.value = [];
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const response = await api.get<Category[]>(
      apiService.value,
      "/expense-categories",
    );
    categories.value = response || [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    categories.value = [];
  }
};

const fetchTeachers = async () => {
  try {
    const response = await api.get<{
      data: Teacher[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, "/users/teachers?limit=100");
    teachers.value = response.data || [];
  } catch (error) {
    console.error("Failed to fetch teachers:", error);
    teachers.value = [];
  }
};

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const formatCurrency = (amount: number) => {
  return (
    new Intl.NumberFormat("uz-UZ", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " so'm"
  );
};

const formatDateForInput = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  // Format for datetime-local input: YYYY-MM-DDTHH:mm
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getCategoryName = (expense: Expense) => {
  // First try to get from nested category object
  if (expense.category?.name) {
    return expense.category.name;
  }
  // Fallback to looking up in categories array
  const category = categories.value.find((c) => c.id === expense.category_id);
  return category?.name || "Noma'lum";
};

// Action handlers
const refreshData = () => {
  fetchExpenses();
};

const openCreateDialog = () => {
  isEditMode.value = false;
  resetForm();
  showExpenseDialog.value = true;
};

const viewExpense = (expense: Expense) => {
  selectedExpense.value = expense;
  showViewDialog.value = true;
};

const editExpense = (expense: Expense) => {
  isEditMode.value = true;
  selectedExpense.value = expense;
  expenseForm.title = expense.title;
  expenseForm.category_id = expense.category_id;
  expenseForm.amount = expense.amount;
  expenseForm.expense_date = formatDateForInput(expense.expense_date);
  expenseForm.teacher_id = expense.teacher_id || null;
  expenseForm.description = expense.description || "";
  showExpenseDialog.value = true;
};

const saveExpense = async () => {
  // Validation
  if (
    !expenseForm.title ||
    !expenseForm.category_id ||
    !expenseForm.amount ||
    !expenseForm.expense_date
  ) {
    toast.add({
      title: "Xatolik",
      description: "Iltimos, barcha majburiy maydonlarni to'ldiring",
      color: "error",
    });
    return;
  }

  isSaving.value = true;
  try {
    const userId = auth.value.user?.id;
    const data = {
      title: expenseForm.title,
      category_id: expenseForm.category_id,
      amount: Number(expenseForm.amount),
      expense_date: new Date(expenseForm.expense_date).toISOString(),
      teacher_id: expenseForm.teacher_id,
      reported_by: userId || null,
      description: expenseForm.description || null,
    };

    if (isEditMode.value && selectedExpense.value) {
      await api.patch(
        apiService.value,
        `/expenses/${selectedExpense.value.id}`,
        data,
      );
      toast.add({
        title: "Muvaffaqiyat",
        description: "Xarajat muvaffaqiyatli yangilandi",
        color: "success",
      });
    } else {
      await api.post(apiService.value, "/expenses", data);
      toast.add({
        title: "Muvaffaqiyat",
        description: "Xarajat muvaffaqiyatli qo'shildi",
        color: "success",
      });
    }

    showExpenseDialog.value = false;
    resetForm();
    fetchExpenses();
  } catch (error) {
    console.error("Failed to save expense:", error);
    toast.add({
      title: "Xatolik",
      description: "Xarajatni saqlashda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = async (expense: Expense) => {
  if (!expense) return;

  isDeleting.value = true;
  try {
    await api.delete(apiService.value, `/expenses/${expense.id}`);
    toast.add({
      title: "Muvaffaqiyat",
      description: "Xarajat muvaffaqiyatli o'chirildi",
      color: "success",
    });
    fetchExpenses();
  } catch (error) {
    console.error("Failed to delete expense:", error);
    toast.add({
      title: "Xatolik",
      description: "Xarajatni o'chirishda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
};

const resetForm = () => {
  expenseForm.title = "";
  expenseForm.category_id = "";
  expenseForm.amount = 0;
  expenseForm.expense_date = "";
  expenseForm.teacher_id = null;
  expenseForm.description = "";
  selectedExpense.value = null;
};

const exportToCSV = () => {
  const headers = [
    "Sarlavha",
    "Kategoriya",
    "Summa",
    "O'qituvchi",
    "Tavsif",
    "Sana",
  ];
  const rows = filteredExpenses.value.map((expense) => [
    expense.title,
    getCategoryName(expense),
    expense.amount,
    expense.teacher_name || "-",
    expense.description || "-",
    formatDate(expense.expense_date),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `xarajatlar-${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.add({
    title: "Muvaffaqiyat",
    description: `${filteredExpenses.value.length} ta xarajat eksport qilindi`,
    color: "success",
  });
};

// Navigation functions for pagination
const onPageChange = (newPage: number) => {
  if (newPage >= 1 && newPage <= totalPages.value) {
    currentPage.value = newPage;
    updateUrlParams();
  }
};

const updateUrlParams = () => {
  const query: Record<string, string> = {
    page: currentPage.value.toString(),
  };

  if (searchQuery.value) {
    query.search = searchQuery.value;
  }

  if (categoryFilter.value !== "all") {
    query.category = categoryFilter.value;
  }

  if (startDate.value) {
    query.start_date = startDate.value;
  }

  if (endDate.value) {
    query.end_date = endDate.value;
  }

  router.push({ query });
};

// Initialize data on component mount
onMounted(() => {
  if (route.query.page) {
    currentPage.value = parseInt(route.query.page as string, 10);
  }

  if (route.query.search) {
    searchQuery.value = route.query.search as string;
  }

  if (route.query.category_id) {
    categoryFilter.value = route.query.category_id as string;
  }

  if (route.query.start_date) {
    startDate.value = route.query.start_date as string;
  }

  if (route.query.end_date) {
    endDate.value = route.query.end_date as string;
  }

  // Fetch teachers first, then expenses
  fetchCategories();
  Promise.all([fetchTeachers()]).then(() => {
    fetchExpenses();
  });
});

// Watch for filter changes and reset to page 1
watch([searchQuery, categoryFilter, startDate, endDate], () => {
  currentPage.value = 1;
  updateUrlParams();
  fetchExpenses();
});
</script>
