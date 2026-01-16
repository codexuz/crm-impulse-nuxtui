<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="router.back()">
          <Icon name="lucide:arrow-left" class="h-5 w-5" />
        </Button>
        <div>
          <h2 class="text-3xl font-bold tracking-tight">Maoshni hisoblash</h2>
          <p class="text-muted-foreground">
            O'qituvchi hamyon va tranzaksiyalar
          </p>
        </div>
      </div>
      <Dialog v-model:open="paymentDialog">
        <DialogTrigger as-child>
          <Button>
            <Icon name="lucide:wallet" class="mr-2 h-4 w-4" />
            To'lov / Bonus
          </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>O'qituvchiga to'lov</DialogTitle>
            <DialogDescription>
              Oylik to'lovi yoki bonus berish
            </DialogDescription>
          </DialogHeader>
          <form @submit.prevent="submitPayment">
            <div class="grid gap-4 py-4">
              <div class="grid gap-2">
                <Label for="category">Tur</Label>
                <Select v-model="paymentForm.category_id" required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Tur tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="category in filteredCategories"
                      :key="category.id"
                      :value="category.id"
                    >
                      {{ category.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="grid gap-2">
                <Label for="amount">Summa</Label>
                <Input
                  id="amount"
                  v-model.number="paymentForm.amount"
                  type="number"
                  placeholder="Summa kiriting"
                  required
                />
              </div>
              <div class="grid gap-2">
                <Label for="description">Izoh</Label>
                <Textarea
                  id="description"
                  v-model="paymentForm.description"
                  placeholder="Izoh kiriting..."
                  rows="3"
                />
              </div>
              <div class="grid gap-2">
                <Label for="expense_date">Sana</Label>
                <Input
                  id="expense_date"
                  v-model="paymentForm.expense_date"
                  type="date"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                @click="paymentDialog = false"
              >
                Bekor qilish
              </Button>
              <Button type="submit" :disabled="isSubmittingPayment">
                <Icon
                  v-if="isSubmittingPayment"
                  name="lucide:loader-2"
                  class="mr-2 h-4 w-4 animate-spin"
                />
                Saqlash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <Icon
        name="lucide:loader-2"
        class="h-12 w-12 animate-spin text-primary"
      />
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Teacher Info & Wallet -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Teacher Info Card -->
        <Card>
          <CardHeader>
            <CardTitle>O'qituvchi ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="teacher" class="space-y-4">
              <div class="flex items-center gap-4">
                <Avatar class="h-16 w-16">
                  <AvatarFallback class="text-lg">
                    {{ getInitials(teacher.first_name, teacher.last_name) }}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 class="font-semibold text-lg">
                    {{ teacher.first_name }} {{ teacher.last_name }}
                  </h3>
                  <p class="text-sm text-muted-foreground">
                    {{ teacher.phone }}
                  </p>
                </div>
              </div>
              <div class="border-t pt-4 space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Username:</span>
                  <span class="font-medium">{{ teacher.username }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Holat:</span>
                  <Badge :variant="teacher.is_active ? 'default' : 'secondary'">
                    {{ teacher.is_active ? "Faol" : "Nofaol" }}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Wallet Card -->
        <Card>
          <CardHeader>
            <CardTitle>Hamyon</CardTitle>
            <CardDescription>Joriy balans va to'lovlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="wallet" class="space-y-4">
              <div class="text-center py-6">
                <p class="text-sm text-muted-foreground mb-2">
                  Jami tranzaksiyalar
                </p>
                <p class="text-5xl font-bold text-primary mb-3">
                  {{ formatCurrency(totalTransactionsAmount) }}
                </p>
                <div class="border-t pt-3 mt-3">
                  <p class="text-xs text-muted-foreground mb-1">
                    Hamyon balansi
                  </p>
                  <p class="text-2xl font-semibold text-muted-foreground">
                    {{ formatCurrency(wallet.amount) }}
                  </p>
                </div>
              </div>
              <div class="border-t pt-4 space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Hamyon ID:</span>
                  <span class="font-mono text-xs">{{ wallet.id }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Yaratilgan:</span>
                  <span>{{ formatDateTime(wallet.created_at) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Yangilangan:</span>
                  <span>{{ formatDateTime(wallet.updated_at) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <Icon
                name="lucide:wallet"
                class="h-12 w-12 text-muted-foreground mx-auto mb-3"
              />
              <p class="text-muted-foreground">Hamyon topilmadi</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Tabs -->
      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="transactions">
            <Icon name="lucide:receipt" class="mr-2 h-4 w-4" />
            Tranzaksiyalar
          </TabsTrigger>
          <TabsTrigger value="students">
            <Icon name="lucide:users" class="mr-2 h-4 w-4" />
            O'quvchilar
          </TabsTrigger>
        </TabsList>

        <!-- Transactions Tab -->
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div class="flex items-center justify-between">
                <div>
                  <CardTitle>Tranzaksiyalar</CardTitle>
                  <CardDescription
                    >To'lovlar va hisob-kitoblar tarixi</CardDescription
                  >
                </div>
                <Button @click="loadTransactions" variant="outline" size="sm">
                  <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" />
                  Yangilash
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <!-- Filters -->
              <div class="space-y-4 mb-4">
                <div class="flex items-center gap-4">
                  <Input
                    v-model="transactionSearch"
                    placeholder="Tranzaksiyalarni qidirish..."
                    class="max-w-sm"
                  />
                  <Select v-model="transactionFilter">
                    <SelectTrigger class="w-[180px]">
                      <SelectValue placeholder="Turi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barchasi</SelectItem>
                      <SelectItem value="kirim">Kirim</SelectItem>
                      <SelectItem value="oylik">Oylik</SelectItem>
                      <SelectItem value="avans">Avans</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2">
                    <Label class="text-sm whitespace-nowrap">Dan:</Label>
                    <Input v-model="dateFrom" type="date" class="w-[180px]" />
                  </div>
                  <div class="flex items-center gap-2">
                    <Label class="text-sm whitespace-nowrap">Gacha:</Label>
                    <Input v-model="dateTo" type="date" class="w-[180px]" />
                  </div>
                  <Button
                    v-if="dateFrom || dateTo"
                    variant="outline"
                    size="sm"
                    @click="clearDateFilters"
                  >
                    <Icon name="lucide:x" class="mr-2 h-4 w-4" />
                    Sanalarni tozalash
                  </Button>
                </div>
              </div>

              <!-- Transactions Table -->
              <div class="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sana</TableHead>
                      <TableHead>Tur</TableHead>
                      <TableHead class="text-right">Summa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-if="loadingTransactions">
                      <TableCell colspan="3" class="text-center py-10">
                        <div class="flex justify-center">
                          <Icon
                            name="lucide:loader-2"
                            class="h-8 w-8 animate-spin text-primary"
                          />
                        </div>
                        <p class="text-muted-foreground mt-2">
                          Tranzaksiyalar yuklanmoqda...
                        </p>
                      </TableCell>
                    </TableRow>
                    <TableRow v-else-if="filteredTransactions.length === 0">
                      <TableCell colspan="3" class="text-center py-10">
                        <div class="flex justify-center">
                          <Icon
                            name="lucide:inbox"
                            class="h-8 w-8 text-muted-foreground"
                          />
                        </div>
                        <p class="text-muted-foreground mt-2">
                          Tranzaksiyalar topilmadi
                        </p>
                      </TableCell>
                    </TableRow>
                    <TableRow
                      v-for="transaction in filteredTransactions"
                      :key="transaction.id"
                    >
                      <TableCell>
                        {{ formatDateTime(transaction.created_at) }}
                      </TableCell>
                      <TableCell>
                        <Badge
                          :variant="
                            getTransactionBadgeVariant(transaction.type)
                          "
                        >
                          <Icon
                            :name="getTransactionIcon(transaction.type)"
                            class="mr-1 h-3 w-3"
                          />
                          {{ getTransactionLabel(transaction.type) }}
                        </Badge>
                      </TableCell>
                      <TableCell class="text-right">
                        <span
                          :class="getTransactionAmountClass(transaction.type)"
                        >
                          {{ getTransactionSign(transaction.type) }}
                          {{ formatCurrency(transaction.amount) }}
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <!-- Pagination -->
              <div
                v-if="filteredTransactions.length > 0"
                class="flex items-center justify-between mt-4"
              >
                <div class="text-sm text-muted-foreground">
                  Jami {{ filteredTransactions.length }} ta tranzaksiya
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Students Tab -->
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <div class="flex items-center justify-between">
                <div>
                  <CardTitle>O'quvchilar</CardTitle>
                  <CardDescription
                    >O'qituvchining barcha o'quvchilari</CardDescription
                  >
                </div>
                <Button @click="loadStudents" variant="outline" size="sm">
                  <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" />
                  Yangilash
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <!-- Filters -->
              <div class="space-y-4 mb-4">
                <div class="flex items-center gap-4">
                  <Input
                    v-model="studentSearch"
                    placeholder="O'quvchilarni qidirish..."
                    class="max-w-sm"
                  />
                </div>
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2">
                    <Label class="text-sm whitespace-nowrap">Dan:</Label>
                    <Input
                      v-model="studentDateFrom"
                      type="date"
                      class="w-[180px]"
                    />
                  </div>
                  <div class="flex items-center gap-2">
                    <Label class="text-sm whitespace-nowrap">Gacha:</Label>
                    <Input
                      v-model="studentDateTo"
                      type="date"
                      class="w-[180px]"
                    />
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    @click="loadAllStudentsAttendance"
                  >
                    <Icon name="lucide:calendar-check" class="mr-2 h-4 w-4" />
                    Davomat yuklash
                  </Button>
                </div>
              </div>

              <!-- Students Table -->
              <div class="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead class="w-[50px]">No</TableHead>
                      <TableHead>O'quvchi</TableHead>
                      <TableHead>Guruh</TableHead>
                      <TableHead class="text-center">Davomat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-if="loadingStudents">
                      <TableCell colspan="4" class="text-center py-10">
                        <div class="flex justify-center">
                          <Icon
                            name="lucide:loader-2"
                            class="h-8 w-8 animate-spin text-primary"
                          />
                        </div>
                        <p class="text-muted-foreground mt-2">
                          O'quvchilar yuklanmoqda...
                        </p>
                      </TableCell>
                    </TableRow>
                    <TableRow v-else-if="filteredStudents.length === 0">
                      <TableCell colspan="4" class="text-center py-10">
                        <div class="flex justify-center">
                          <Icon
                            name="lucide:users-x"
                            class="h-8 w-8 text-muted-foreground"
                          />
                        </div>
                        <p class="text-muted-foreground mt-2">
                          O'quvchilar topilmadi
                        </p>
                      </TableCell>
                    </TableRow>
                    <TableRow
                      v-for="(student, index) in filteredStudents"
                      :key="student.id"
                    >
                      <TableCell class="text-muted-foreground">
                        {{ index + 1 }}
                      </TableCell>
                      <TableCell class="font-medium">
                        <div class="flex items-center">
                          <Avatar class="h-8 w-8 mr-2">
                            <AvatarFallback>{{
                              getInitials(
                                student.student.first_name,
                                student.student.last_name
                              )
                            }}</AvatarFallback>
                          </Avatar>
                          {{ student.student.first_name }}
                          {{ student.student.last_name }}
                        </div>
                      </TableCell>
                      <TableCell>{{ student.group.name }}</TableCell>
                      <TableCell class="text-center">
                        <div
                          v-if="loadingAttendance.has(student.student.user_id)"
                          class="flex justify-center"
                        >
                          <Icon
                            name="lucide:loader-2"
                            class="h-4 w-4 animate-spin"
                          />
                        </div>
                        <div
                          v-else-if="studentAttendance[student.student.user_id]"
                          class="flex justify-center gap-2"
                        >
                          <Badge variant="default">
                            <Icon name="lucide:check" class="mr-1 h-3 w-3" />
                            {{
                              studentAttendance[student.student.user_id]
                                ?.present || 0
                            }}
                          </Badge>
                          <Badge variant="secondary">
                            <Icon name="lucide:x" class="mr-1 h-3 w-3" />
                            {{
                              studentAttendance[student.student.user_id]
                                ?.absent || 0
                            }}
                          </Badge>
                        </div>
                        <div v-else class="text-muted-foreground text-sm">
                          -
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <!-- Students Count -->
              <div
                v-if="filteredStudents.length > 0"
                class="flex items-center justify-between mt-4"
              >
                <div class="text-sm text-muted-foreground">
                  Jami {{ filteredStudents.length }} ta o'quvchi
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";

import { api } from "~/lib/api";

const route = useRoute();
const router = useRouter();
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

interface Wallet {
  id: string;
  teacher_id: string;
  amount: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Transaction {
  id: string;
  teacher_id: string;
  amount: number;
  type: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Student {
  id: string;
  group_id: string;
  student_id: string;
  enrolled_at: string;
  status: string;
  student: {
    user_id: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  group: {
    id: string;
    name: string;
  };
}

interface AttendanceRecord {
  present: number;
  absent: number;
  late: number;
}

interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Helper functions for default dates
const getDefaultDateFrom = () => {
  const date = new Date();
  date.setMonth(date.getMonth());
  date.setDate(1);
  return date.toISOString().split("T")[0];
};

const getDefaultDateTo = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(1);
  return date.toISOString().split("T")[0];
};

// State
const teacherId = computed(() => route.params.id as string);
const teacher = ref<Teacher | null>(null);
const wallet = ref<Wallet | null>(null);
const transactions = ref<Transaction[]>([]);
const students = ref<Student[]>([]);
const isLoading = ref(true);
const loadingTransactions = ref(false);
const loadingStudents = ref(false);
const transactionSearch = ref("");
const transactionFilter = ref("all");
const studentSearch = ref("");
const activeTab = ref("transactions");
const studentDateFrom = ref(getDefaultDateFrom());
const studentDateTo = ref(getDefaultDateTo());
const studentAttendance = ref<Record<string, AttendanceRecord>>({});
const loadingAttendance = ref(new Set<string>());

// Payment modal state
const paymentDialog = ref(false);
const isSubmittingPayment = ref(false);
const expenseCategories = ref<ExpenseCategory[]>([]);
const paymentForm = reactive({
  category_id: "",
  amount: 0,
  description: "",
  expense_date: new Date().toISOString().split("T")[0],
});

const dateFrom = ref(getDefaultDateFrom());
const dateTo = ref(getDefaultDateTo());

// Computed
const filteredTransactions = computed(() => {
  let result = [...transactions.value];

  // Apply type filter
  if (transactionFilter.value !== "all") {
    result = result.filter((t) => t.type === transactionFilter.value);
  }

  // Apply search filter
  if (transactionSearch.value) {
    const searchLower = transactionSearch.value.toLowerCase();
    result = result.filter(
      (t) =>
        t.type?.toLowerCase().includes(searchLower) ||
        t.amount.toString().includes(transactionSearch.value)
    );
  }

  // Apply date range filter
  if (dateFrom.value) {
    const fromDate = new Date(dateFrom.value);
    fromDate.setHours(0, 0, 0, 0);
    result = result.filter((t) => {
      const transactionDate = new Date(t.created_at);
      return transactionDate >= fromDate;
    });
  }

  if (dateTo.value) {
    const toDate = new Date(dateTo.value);
    toDate.setHours(23, 59, 59, 999);
    result = result.filter((t) => {
      const transactionDate = new Date(t.created_at);
      return transactionDate <= toDate;
    });
  }

  // Sort by date descending (newest first)
  result.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return result;
});

const totalTransactionsAmount = computed(() => {
  return filteredTransactions.value.reduce((total, transaction) => {
    return total + transaction.amount;
  }, 0);
});

const filteredStudents = computed(() => {
  if (!studentSearch.value) {
    return students.value;
  }

  const searchLower = studentSearch.value.toLowerCase();
  return students.value.filter(
    (s) =>
      s.student.first_name?.toLowerCase().includes(searchLower) ||
      s.student.last_name?.toLowerCase().includes(searchLower) ||
      `${s.student.first_name} ${s.student.last_name}`
        .toLowerCase()
        .includes(searchLower) ||
      s.student.phone?.includes(studentSearch.value) ||
      s.group.name?.toLowerCase().includes(searchLower)
  );
});

const filteredCategories = computed(() => {
  return expenseCategories.value.filter(
    (category) =>
      category.name.toLowerCase() === "bonus" ||
      category.name.toLowerCase() === "oylik"
  );
});

// Methods
const loadTeacher = async () => {
  try {
    const response = await api.get<Teacher>(
      apiService.value,
      `/users/${teacherId.value}`
    );
    teacher.value = response;
  } catch (error) {
    console.error("Failed to load teacher:", error);
    toast({
      title: "Xatolik",
      description: "O'qituvchi ma'lumotlarini yuklashda xatolik.",
      variant: "destructive",
    });
  }
};

const loadWallet = async () => {
  try {
    const response = await api.get<Wallet>(
      apiService.value,
      `/teacher-wallet/teacher/${teacherId.value}`
    );
    wallet.value = response;
  } catch (error) {
    console.error("Failed to load wallet:", error);
    wallet.value = null;
    toast({
      title: "Xatolik",
      description: "Hamyon ma'lumotlarini yuklashda xatolik.",
      variant: "destructive",
    });
  }
};

const loadTransactions = async () => {
  loadingTransactions.value = true;
  try {
    const response = await api.get<Transaction[]>(
      apiService.value,
      `/teacher-transaction/teacher/${teacherId.value}`
    );
    transactions.value = response;
  } catch (error) {
    console.error("Failed to load transactions:", error);
    transactions.value = [];
    toast({
      title: "Xatolik",
      description: "Tranzaksiyalarni yuklashda xatolik.",
      variant: "destructive",
    });
  } finally {
    loadingTransactions.value = false;
  }
};

const loadStudents = async () => {
  loadingStudents.value = true;
  try {
    const response = await api.get<Student[]>(
      apiService.value,
      `/group-students/teacher/${teacherId.value}/students`
    );
    students.value = response;
  } catch (error) {
    console.error("Failed to load students:", error);
    students.value = [];
    toast({
      title: "Xatolik",
      description: "O'quvchilarni yuklashda xatolik.",
      variant: "destructive",
    });
  } finally {
    loadingStudents.value = false;
  }
};

const loadStudentAttendance = async (studentId: string) => {
  if (!studentDateFrom.value || !studentDateTo.value) {
    toast({
      title: "Xatolik",
      description: "Iltimos, sanalarni tanlang.",
      variant: "destructive",
    });
    return;
  }

  loadingAttendance.value.add(studentId);
  try {
    const response = await api.get<any[]>(
      apiService.value,
      `/attendance/student/${studentId}/daterange?startDate=${studentDateFrom.value}&endDate=${studentDateTo.value}&teacherId=${teacherId.value}`
    );

    // Calculate attendance statistics
    const stats = {
      present: response.filter((a) => a.status === "present").length,
      absent: response.filter((a) => a.status === "absent").length,
      late: response.filter((a) => a.status === "late").length,
    };

    studentAttendance.value[studentId] = stats;
  } catch (error) {
    console.error(`Failed to load attendance for student ${studentId}:`, error);
  } finally {
    loadingAttendance.value.delete(studentId);
  }
};

const loadAllStudentsAttendance = async () => {
  if (!studentDateFrom.value || !studentDateTo.value) {
    toast({
      title: "Xatolik",
      description: "Iltimos, sanalarni tanlang.",
      variant: "destructive",
    });
    return;
  }

  studentAttendance.value = {};
  const promises = students.value.map((student) =>
    loadStudentAttendance(student.student.user_id)
  );
  await Promise.all(promises);

  toast({
    title: "Muvaffaqiyat",
    description: "Davomat ma'lumotlari yuklandi.",
  });
};

const loadExpenseCategories = async () => {
  try {
    const response = await api.get<ExpenseCategory[]>(
      apiService.value,
      "/expense-categories"
    );
    expenseCategories.value = response;
  } catch (error) {
    console.error("Failed to load expense categories:", error);
    toast({
      title: "Xatolik",
      description: "Xarajat turlarini yuklashda xatolik.",
      variant: "destructive",
    });
  }
};

const submitPayment = async () => {
  if (!teacher.value) return;

  isSubmittingPayment.value = true;
  try {
    const selectedCategory = expenseCategories.value.find(
      (c) => c.id === paymentForm.category_id
    );
    const categoryName = selectedCategory?.name || "To'lov";

    const payload = {
      title: `${teacher.value.first_name} ${teacher.value.last_name} ${categoryName}`,
      category_id: paymentForm.category_id,
      description: paymentForm.description,
      amount: paymentForm.amount,
      expense_date: new Date(paymentForm.expense_date).toISOString(),
      teacher_id: teacherId.value,
      reported_by: teacherId.value,
    };

    await api.post(apiService.value, "/expenses", payload);

    toast({
      title: "Muvaffaqiyat",
      description: "To'lov muvaffaqiyatli amalga oshirildi.",
    });

    // Reset form
    paymentForm.category_id = "";
    paymentForm.amount = 0;
    paymentForm.description = "";
    paymentForm.expense_date = new Date().toISOString().split("T")[0];
    paymentDialog.value = false;

    // Reload data
    await loadTransactions();
    await loadWallet();
  } catch (error) {
    console.error("Failed to submit payment:", error);
    toast({
      title: "Xatolik",
      description: "To'lovni amalga oshirishda xatolik yuz berdi.",
      variant: "destructive",
    });
  } finally {
    isSubmittingPayment.value = false;
  }
};

const loadAllData = async () => {
  isLoading.value = true;
  try {
    await Promise.all([
      loadTeacher(),
      loadWallet(),
      loadTransactions(),
      loadStudents(),
      loadExpenseCategories(),
    ]);
  } finally {
    isLoading.value = false;
  }
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

const formatDateTime = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("uz-UZ");
};

const clearDateFilters = () => {
  dateFrom.value = getDefaultDateFrom();
  dateTo.value = getDefaultDateTo();
};

const getTransactionLabel = (type: string) => {
  const labels: Record<string, string> = {
    kirim: "Kirim",
    oylik: "Oylik",
    avans: "Avans",
    bonus: "Bonus",
  };
  return labels[type] || type;
};

const getTransactionBadgeVariant = (type: string) => {
  if (type === "kirim") return "default";
  if (type === "bonus") return "default";
  return "secondary";
};

const getTransactionIcon = (type: string) => {
  if (type === "kirim" || type === "bonus") return "lucide:arrow-down-left";
  return "lucide:arrow-up-right";
};

const getTransactionAmountClass = (type: string) => {
  if (type === "kirim" || type === "bonus")
    return "text-green-600 font-semibold";
  return "text-red-600 font-semibold";
};

const getTransactionSign = (type: string) => {
  if (type === "kirim" || type === "bonus") return "+";
  return "-";
};

// Lifecycle
onMounted(() => {
  loadAllData();
});
</script>
