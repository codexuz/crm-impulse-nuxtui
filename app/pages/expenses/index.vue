<template>
  <div class="container py-10 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Xarajatlar</h1>
        <p class="text-muted-foreground">
          Barcha xarajatlarni boshqarish va kuzatish
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="refreshData">
          <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" />
          Yangilash
        </Button>
        <Button @click="openCreateDialog">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          Yangi xarajat
        </Button>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Jami xarajatlar</CardTitle>
          <Icon name="lucide:receipt" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ expensesCount }}</div>
          <p class="text-xs text-muted-foreground">Umumiy xarajatlar soni</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Jami summa</CardTitle>
          <Icon name="lucide:banknote" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ formatCurrency(totalAmount) }}
          </div>
          <p class="text-xs text-muted-foreground">Umumiy xarajatlar</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Bu oy</CardTitle>
          <Icon name="lucide:calendar" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ formatCurrency(currentMonthAmount) }}
          </div>
          <p class="text-xs text-muted-foreground">Shu oylik xarajatlar</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">O'rtacha</CardTitle>
          <Icon
            name="lucide:trending-up"
            class="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ formatCurrency(averageAmount) }}
          </div>
          <p class="text-xs text-muted-foreground">O'rtacha xarajat</p>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <Input
        v-model="searchQuery"
        placeholder="Qidirish..."
        class="sm:max-w-xs"
      >
        <template #leading>
          <Icon name="lucide:search" class="h-4 w-4" />
        </template>
      </Input>
      <Select v-model="categoryFilter">
        <SelectTrigger class="sm:max-w-[200px]">
          <SelectValue placeholder="Kategoriya" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Barcha kategoriyalar</SelectItem>
          <SelectItem
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Input
        v-model="startDate"
        type="date"
        placeholder="Boshlanish sanasi"
        class="sm:max-w-[180px]"
      />
      <Input
        v-model="endDate"
        type="date"
        placeholder="Tugash sanasi"
        class="sm:max-w-[180px]"
      />
      <div class="flex flex-wrap gap-2 sm:ml-auto">
        <Button variant="outline" @click="exportToCSV">
          <Icon name="lucide:download" class="mr-2 h-4 w-4" />
          Eksport
        </Button>
      </div>
    </div>

    <!-- Expenses Table -->
    <Card>
      <CardContent class="p-0">
        <div class="p-2 border-b">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sarlavha</TableHead>
                <TableHead>Kategoriya</TableHead>
                <TableHead>Summa</TableHead>
                <TableHead>O'qituvchi</TableHead>
                <TableHead>Tavsif</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead class="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="loading">
                <TableCell colspan="7" class="text-center py-10">
                  <div class="flex justify-center items-center">
                    <Icon
                      name="lucide:loader-2"
                      class="h-8 w-8 animate-spin text-muted-foreground"
                    />
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-else-if="paginatedExpenses.length === 0">
                <TableCell colspan="7" class="text-center py-10">
                  <div class="flex justify-center">
                    <Icon
                      name="lucide:search-x"
                      class="h-8 w-8 text-muted-foreground"
                    />
                  </div>
                  <p class="text-muted-foreground mt-2">Xarajatlar topilmadi</p>
                </TableCell>
              </TableRow>
              <TableRow
                v-for="expense in paginatedExpenses"
                :key="expense.id"
                class="hover:bg-muted/50"
              >
                <TableCell>
                  <div class="font-medium">{{ expense.title }}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {{ getCategoryName(expense.category_id) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span class="font-semibold text-red-600">
                    {{ formatCurrency(expense.amount) }}
                  </span>
                </TableCell>
                <TableCell>
                  {{ expense.teacher_name || "-" }}
                </TableCell>
                <TableCell class="max-w-[200px] truncate">
                  {{ expense.description || "-" }}
                </TableCell>
                <TableCell>{{ formatDate(expense.expense_date) }}</TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      @click="viewExpense(expense)"
                      title="Ko'rish"
                    >
                      <Icon name="lucide:eye" class="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      @click="editExpense(expense)"
                      title="Tahrirlash"
                    >
                      <Icon name="lucide:pencil" class="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      @click="deleteExpense(expense)"
                      title="O'chirish"
                    >
                      <Icon
                        name="lucide:trash-2"
                        class="h-4 w-4 text-red-500"
                      />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between p-4">
          <div class="text-sm text-muted-foreground">
            Ko'rsatilmoqda
            <span class="font-medium">{{ paginationStart }}</span> dan
            <span class="font-medium">{{ paginationEnd }}</span> gacha
            <span class="font-medium">{{ filteredExpenses.length }}</span> ta
            xarajat
          </div>

          <Pagination
            v-model:page="currentPage"
            :total="filteredExpenses.length"
            :items-per-page="itemsPerPage"
            :sibling-count="1"
            @update:page="onPageChange"
          >
            <PaginationContent>
              <PaginationPrevious
                :disabled="currentPage === 1"
                @click="navigatePage(currentPage - 1)"
              />

              <PaginationItem
                v-for="pageNum in displayedPages"
                :key="pageNum"
                :value="pageNum"
                :is-active="pageNum === currentPage"
                @click="navigatePage(pageNum)"
              >
                {{ pageNum }}
              </PaginationItem>

              <PaginationEllipsis v-if="showEndEllipsis" />

              <PaginationNext
                :disabled="currentPage === totalPages"
                @click="navigatePage(currentPage + 1)"
              />
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:open="showExpenseDialog">
      <DialogContent class="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {{ isEditMode ? "Xarajatni tahrirlash" : "Yangi xarajat" }}
          </DialogTitle>
          <DialogDescription>
            {{
              isEditMode
                ? "Xarajat ma'lumotlarini tahrirlang"
                : "Yangi xarajat qo'shing"
            }}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="title" class="text-right">Sarlavha *</Label>
            <Input
              id="title"
              v-model="expenseForm.title"
              placeholder="Xarajat sarlavhasi"
              class="col-span-3"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="category" class="text-right">Kategoriya *</Label>
            <div class="col-span-3">
              <Select v-model="expenseForm.category_id">
                <SelectTrigger id="category">
                  <SelectValue placeholder="Kategoriyani tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="category in categories"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="amount" class="text-right">Summa *</Label>
            <Input
              id="amount"
              v-model="expenseForm.amount"
              type="number"
              placeholder="0"
              class="col-span-3"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="teacher" class="text-right">O'qituvchi</Label>
            <div class="col-span-3">
              <Select v-model="expenseForm.teacher_id">
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="O'qituvchini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem :value="null">Yo'q</SelectItem>
                  <SelectItem
                    v-for="teacher in teachers"
                    :key="teacher.user_id"
                    :value="teacher.user_id"
                  >
                    {{ teacher.first_name }} {{ teacher.last_name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="expense_date" class="text-right">Sana *</Label>
            <Input
              id="expense_date"
              v-model="expenseForm.expense_date"
              type="datetime-local"
              class="col-span-3"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="description" class="text-right">Tavsif</Label>
            <Textarea
              id="description"
              v-model="expenseForm.description"
              placeholder="Xarajat haqida ma'lumot"
              class="col-span-3"
              rows="3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showExpenseDialog = false">
            Bekor qilish
          </Button>
          <Button @click="saveExpense" :disabled="isSaving">
            <Icon
              v-if="isSaving"
              name="lucide:loader-2"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ isSaving ? "Saqlanmoqda..." : "Saqlash" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- View Dialog -->
    <Dialog v-model:open="showViewDialog">
      <DialogContent class="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Xarajat tafsilotlari</DialogTitle>
        </DialogHeader>
        <div v-if="selectedExpense" class="grid gap-4 py-4">
          <div class="grid grid-cols-3 items-center gap-4">
            <span class="font-semibold">Sarlavha:</span>
            <span class="col-span-2">{{ selectedExpense.title }}</span>
          </div>
          <div class="grid grid-cols-3 items-center gap-4">
            <span class="font-semibold">Kategoriya:</span>
            <span class="col-span-2">
              <Badge variant="outline">
                {{ getCategoryName(selectedExpense.category_id) }}
              </Badge>
            </span>
          </div>
          <div class="grid grid-cols-3 items-center gap-4">
            <span class="font-semibold">Summa:</span>
            <span class="col-span-2 font-semibold text-red-600">
              {{ formatCurrency(selectedExpense.amount) }}
            </span>
          </div>
          <div class="grid grid-cols-3 items-center gap-4">
            <span class="font-semibold">O'qituvchi:</span>
            <span class="col-span-2">
              {{ selectedExpense.teacher_name || "-" }}
            </span>
          </div>
          <div class="grid grid-cols-3 items-center gap-4">
            <span class="font-semibold">Tavsif:</span>
            <span class="col-span-2">
              {{ selectedExpense.description || "-" }}
            </span>
          </div>
          <div class="grid grid-cols-3 items-center gap-4">
            <span class="font-semibold">Xarajat sanasi:</span>
            <span class="col-span-2">
              {{ formatDate(selectedExpense.expense_date) }}
            </span>
          </div>
          <div class="grid grid-cols-3 items-center gap-4">
            <span class="font-semibold">Yaratilgan:</span>
            <span class="col-span-2">
              {{ formatDate(selectedExpense.created_at) }}
            </span>
          </div>
          <div class="grid grid-cols-3 items-center gap-4">
            <span class="font-semibold">Yangilangan:</span>
            <span class="col-span-2">
              {{ formatDate(selectedExpense.updated_at) }}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button @click="showViewDialog = false">Yopish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
          <AlertDialogDescription>
            Ushbu xarajatni o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            @click="confirmDelete"
            class="bg-red-600 hover:bg-red-700"
          >
            O'chirish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";

import { api } from "~/lib/api";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

definePageMeta({
  middleware: ["auth"],
});

interface Expense {
  id: string;
  title: string;
  category_id: string;
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

interface Category {
  id: string;
  name: string;
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
const showDeleteDialog = ref(false);
const selectedExpense = ref<Expense | null>(null);
const isEditMode = ref(false);
const isSaving = ref(false);

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
    0
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
    filteredExpenses.value.length
  );
});

// Pagination display helpers
const displayedPages = computed(() => {
  if (totalPages.value <= 7) {
    return Array.from({ length: totalPages.value }, (_, i) => i + 1);
  }

  const pages = [];
  pages.push(1);

  if (currentPage.value <= 3) {
    pages.push(2, 3, 4);
  } else if (currentPage.value >= totalPages.value - 2) {
    pages.push(
      totalPages.value - 3,
      totalPages.value - 2,
      totalPages.value - 1
    );
  } else {
    pages.push(currentPage.value - 1, currentPage.value, currentPage.value + 1);
  }

  if (!pages.includes(totalPages.value)) {
    pages.push(totalPages.value);
  }

  return [...new Set(pages)].sort((a, b) => a - b);
});

const showEndEllipsis = computed(() => {
  const lastDisplayedPage = Math.max(...displayedPages.value);
  return lastDisplayedPage < totalPages.value;
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

    const response = await api.get<Expense[]>(apiService.value, endpoint);
    expenses.value = response || [];
  } catch (error) {
    console.error("Failed to fetch expenses:", error);
    toast.toast({
      title: "Xatolik",
      description: "Xarajatlarni yuklashda xatolik yuz berdi",
      variant: "destructive",
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
      "/expense-categories"
    );
    categories.value = response || [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    categories.value = [];
  }
};

const fetchTeachers = async () => {
  try {
    const response = await api.get<Teacher[]>(
      apiService.value,
      "/users/teachers"
    );
    teachers.value = response || [];
  } catch (error) {
    console.error("Failed to fetch teachers:", error);
    teachers.value = [];
  }
};

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
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

const getCategoryName = (categoryId: string) => {
  const category = categories.value.find((c) => c.id === categoryId);
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

const deleteExpense = (expense: Expense) => {
  selectedExpense.value = expense;
  showDeleteDialog.value = true;
};

const saveExpense = async () => {
  // Validation
  if (
    !expenseForm.title ||
    !expenseForm.category_id ||
    !expenseForm.amount ||
    !expenseForm.expense_date
  ) {
    toast.toast({
      title: "Xatolik",
      description: "Iltimos, barcha majburiy maydonlarni to'ldiring",
      variant: "destructive",
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
        data
      );
      toast.toast({
        title: "Muvaffaqiyat",
        description: "Xarajat muvaffaqiyatli yangilandi",
      });
    } else {
      await api.post(apiService.value, "/expenses", data);
      toast.toast({
        title: "Muvaffaqiyat",
        description: "Xarajat muvaffaqiyatli qo'shildi",
      });
    }

    showExpenseDialog.value = false;
    resetForm();
    fetchExpenses();
  } catch (error) {
    console.error("Failed to save expense:", error);
    toast.toast({
      title: "Xatolik",
      description: "Xarajatni saqlashda xatolik yuz berdi",
      variant: "destructive",
    });
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = async () => {
  if (!selectedExpense.value) return;

  try {
    await api.delete(apiService.value, `/expenses/${selectedExpense.value.id}`);
    toast.toast({
      title: "Muvaffaqiyat",
      description: "Xarajat muvaffaqiyatli o'chirildi",
    });
    showDeleteDialog.value = false;
    fetchExpenses();
  } catch (error) {
    console.error("Failed to delete expense:", error);
    toast.toast({
      title: "Xatolik",
      description: "Xarajatni o'chirishda xatolik yuz berdi",
      variant: "destructive",
    });
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
    getCategoryName(expense.category_id),
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
    `xarajatlar-${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.toast({
    title: "Muvaffaqiyat",
    description: `${filteredExpenses.value.length} ta xarajat eksport qilindi`,
  });
};

// Navigation functions for pagination
const navigatePage = (newPage: number) => {
  if (newPage >= 1 && newPage <= totalPages.value) {
    currentPage.value = newPage;
    updateUrlParams();
  }
};

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

  if (route.query.category) {
    categoryFilter.value = route.query.category as string;
  }

  if (route.query.start_date) {
    startDate.value = route.query.start_date as string;
  }

  if (route.query.end_date) {
    endDate.value = route.query.end_date as string;
  }

  fetchExpenses();
  fetchCategories();
  fetchTeachers();
});

// Watch for filter changes and reset to page 1
watch([searchQuery, categoryFilter, startDate, endDate], () => {
  currentPage.value = 1;
  updateUrlParams();
  fetchExpenses();
});
</script>
