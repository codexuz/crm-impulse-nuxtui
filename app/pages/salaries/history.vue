<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Maosh tarixi</h2>
        <p class="text-muted-foreground">
          O'qituvchilar maosh to'lovlari tarixi
        </p>
      </div>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <CardHeader>
        <CardTitle>Filtrlar</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label class="text-sm mb-2">O'qituvchi</Label>
            <Select v-model="filters.teacher_id">
              <SelectTrigger>
                <SelectValue placeholder="Barchasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
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
          <div>
            <Label class="text-sm mb-2">Boshlanish sanasi</Label>
            <Input v-model="filters.start_date" type="date" />
          </div>
          <div>
            <Label class="text-sm mb-2">Tugash sanasi</Label>
            <Input v-model="filters.end_date" type="date" />
          </div>
        </div>
        <div class="flex justify-end mt-4 gap-2">
          <Button
            v-if="hasActiveFilters"
            variant="outline"
            size="sm"
            @click="clearFilters"
          >
            <Icon name="lucide:x" class="mr-2 h-4 w-4" />
            Tozalash
          </Button>
          <Button size="sm" @click="loadSalaryHistory">
            <Icon name="lucide:search" class="mr-2 h-4 w-4" />
            Qidirish
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Salary History Table -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>Maosh to'lovlari</CardTitle>
            <CardDescription>Barcha maosh to'lovlari ro'yxati</CardDescription>
          </div>
          <Button @click="loadSalaryHistory" variant="outline" size="sm">
            <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" />
            Yangilash
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>O'qituvchi</TableHead>
                <TableHead>Sarlavha</TableHead>
                <TableHead>Kategoriya</TableHead>
                <TableHead>Summa</TableHead>
                <TableHead>Sana</TableHead>
                <TableHead>Izoh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="isLoading">
                <TableCell colspan="6" class="text-center py-10">
                  <div class="flex justify-center">
                    <Icon
                      name="lucide:loader-2"
                      class="h-8 w-8 animate-spin text-primary"
                    />
                  </div>
                  <p class="text-muted-foreground mt-2">Yuklanmoqda...</p>
                </TableCell>
              </TableRow>
              <TableRow v-else-if="salaryHistory.length === 0">
                <TableCell colspan="6" class="text-center py-10">
                  <div class="flex justify-center">
                    <Icon
                      name="lucide:inbox"
                      class="h-8 w-8 text-muted-foreground"
                    />
                  </div>
                  <p class="text-muted-foreground mt-2">Ma'lumot topilmadi</p>
                </TableCell>
              </TableRow>
              <TableRow v-for="salary in salaryHistory" :key="salary.id">
                <TableCell class="font-medium">
                  <div v-if="salary.teacher" class="flex items-center gap-2">
                    <Avatar class="h-8 w-8">
                      <AvatarFallback>
                        {{
                          getInitials(
                            salary.teacher.first_name,
                            salary.teacher.last_name
                          )
                        }}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div class="font-medium">
                        {{ salary.teacher.first_name }}
                        {{ salary.teacher.last_name }}
                      </div>
                      <div class="text-xs text-muted-foreground">
                        {{ salary.teacher.phone }}
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-muted-foreground">-</span>
                </TableCell>
                <TableCell class="font-medium">
                  {{ salary.title }}
                </TableCell>
                <TableCell>
                  <Badge v-if="salary.category" variant="outline">
                    {{ salary.category.name }}
                  </Badge>
                  <span v-else>-</span>
                </TableCell>
                <TableCell>
                  <span class="font-semibold">
                    {{ formatCurrency(salary.amount) }}
                  </span>
                </TableCell>
                <TableCell>
                  {{ formatDate(salary.expense_date) }}
                </TableCell>
                <TableCell>
                  <span class="text-sm text-muted-foreground">
                    {{ salary.description || "-" }}
                  </span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Total Summary -->
        <div
          v-if="salaryHistory.length > 0"
          class="flex items-center justify-between mt-4 pt-4 border-t"
        >
          <div class="text-sm text-muted-foreground">
            Jami {{ totalCount }} ta yozuv
          </div>
          <div class="text-lg font-semibold">
            Jami summa: {{ formatCurrency(totalAmount) }}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from "vue";
import { useAuth } from "~/composables/useAuth";

import { api } from "~/lib/api";

const { apiService } = useAuth();
const { toast } = useToast();

interface Teacher {
  user_id: string;
  username: string;
  phone: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
}

interface SalaryHistory {
  id: string;
  title: string;
  category_id: string;
  description: string | null;
  amount: number;
  expense_date: string;
  teacher_id: string;
  reported_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category: {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
  teacher?: Teacher;
}

interface SalaryHistoryResponse {
  expenses: SalaryHistory[];
  total: number;
  count: number;
}

// State
const teachers = ref<Teacher[]>([]);
const salaryHistory = ref<SalaryHistory[]>([]);
const totalAmount = ref(0);
const totalCount = ref(0);
const isLoading = ref(true);
const filters = reactive({
  teacher_id: "all",
  start_date: "",
  end_date: "",
});

// Computed
const hasActiveFilters = computed(() => {
  return (
    (filters.teacher_id !== "all" && filters.teacher_id !== "") ||
    filters.start_date !== "" ||
    filters.end_date !== ""
  );
});

// Methods
const loadTeachers = async () => {
  try {
    const response = await api.get<Teacher[]>(
      apiService.value,
      "/users/teachers"
    );
    teachers.value = response;
  } catch (error) {
    console.error("Failed to load teachers:", error);
    toast({
      title: "Xatolik",
      description: "O'qituvchilarni yuklashda xatolik.",
      variant: "destructive",
    });
  }
};

const loadSalaryHistory = async () => {
  isLoading.value = true;
  try {
    let url = "/expenses/teachers/salary-history";
    const params = new URLSearchParams();

    if (filters.teacher_id && filters.teacher_id !== "all") {
      params.append("teacher_id", filters.teacher_id);
    }
    if (filters.start_date) {
      params.append("start_date", filters.start_date);
    }
    if (filters.end_date) {
      params.append("end_date", filters.end_date);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await api.get<SalaryHistoryResponse>(
      apiService.value,
      url
    );

    // Merge teacher data with expenses
    const expensesWithTeachers = (response.expenses || []).map((expense) => {
      const teacher = teachers.value.find(
        (t) => t.user_id === expense.teacher_id
      );
      return {
        ...expense,
        teacher: teacher || undefined,
      };
    });

    salaryHistory.value = expensesWithTeachers;
    totalAmount.value = response.total || 0;
    totalCount.value = response.count || 0;
  } catch (error) {
    console.error("Failed to load salary history:", error);
    salaryHistory.value = [];
    totalAmount.value = 0;
    totalCount.value = 0;
    toast({
      title: "Xatolik",
      description: "Maosh tarixini yuklashda xatolik.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const clearFilters = () => {
  filters.teacher_id = "all";
  filters.start_date = "";
  filters.end_date = "";
  loadSalaryHistory();
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.charAt(0) || ""}${
    lastName?.charAt(0) || ""
  }`.toUpperCase();
};

const formatCurrency = (amount: number) => {
  return (
    new Intl.NumberFormat("uz-UZ", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " so'm"
  );
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("uz-UZ");
};

// Lifecycle
onMounted(async () => {
  await loadTeachers();
  await loadSalaryHistory();
});
</script>
