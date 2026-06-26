<template>
  <UDashboardPanel id="teacher-salary">
    <template #header>
      <UDashboardNavbar title="Maoshni hisoblash" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UNavigationMenu :items="teacherNavItems" highlight />
        </template>

        <template #description> O'qituvchi hamyon va tranzaksiyalar </template>

        <template #right>
          <UButton icon="i-lucide-wallet" label="To'lov / Bonus" @click="paymentDialog = true" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-20">
        <span class="i-lucide-loader-2 text-5xl animate-spin text-primary"></span>
      </div>

      <!-- Content -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left Sidebar: Profile Card -->
        <aside class="lg:col-span-3 space-y-6">
          <!-- Teacher Profile Card -->
          <UCard class="overflow-hidden">
            <!-- Profile Header -->
            <div class="relative">
              <div class="h-24 bg-linear-to-r from-primary to-blue-400"></div>
              <div class="px-6 pb-6 -mt-12 flex flex-col items-center text-center">
                <UAvatar size="2xl" :alt="teacher?.first_name + ' ' + teacher?.last_name"
                  class="ring-4 ring-white dark:ring-gray-900 mb-4">
                  <template #fallback>
                    <span class="text-xl">
                      {{
                        teacher
                          ? getInitials(teacher.first_name, teacher.last_name)
                          : ""
                      }}
                    </span>
                  </template>
                </UAvatar>

                <UBadge :color="teacher?.is_active ? 'green' : 'gray'" class="mb-2">
                  {{ teacher?.is_active ? "FAOL" : "NOFAOL" }}
                </UBadge>

                <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ teacher?.first_name }} {{ teacher?.last_name }}
                </h3>
                <p class="text-sm text-gray-500 mb-4">
                  {{ teacher?.username }}
                </p>

                <!-- Wallet Balance Highlight -->
                <div class="w-full pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div class="flex flex-col items-center mb-6">
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Hamyon balansi
                    </span>
                    <span class="text-3xl font-black text-primary">
                      {{ wallet ? formatCurrency(wallet.amount) : "0 so'm" }}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p class="text-[10px] font-bold text-gray-500 uppercase">
                        Telefon
                      </p>
                      <p class="text-sm font-bold">{{ teacher?.phone ? formatPhone(teacher.phone) : '' }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] font-bold text-gray-500 uppercase">
                        Username
                      </p>
                      <p class="text-sm font-bold">{{ teacher?.username }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Bonus-Penalty Wallet Card -->
          <UCard>
            <template #header>
              <h4 class="text-sm font-bold flex items-center gap-2">
                <span class="i-lucide-badge-percent text-amber-500 text-lg"></span>
                Bonus & Jarima hamyoni
              </h4>
            </template>

            <div class="flex flex-col items-center py-2 mb-3 border-b">
              <span class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Balans</span>
              <span :class="['text-2xl font-black', (bonusWallet?.amount ?? 0) >= 0 ? 'text-green-600' : 'text-red-600']">
                {{ bonusWallet ? formatCurrency(bonusWallet.amount) : "0 so'm" }}
              </span>
            </div>

            <ul class="space-y-2 text-sm mb-4">
              <li class="flex justify-between">
                <span class="text-gray-500">Jami tranzaksiyalar</span>
                <span class="font-medium">{{ totalBonusTransactions }} ta</span>
              </li>
            </ul>

            <UButton
              icon="i-lucide-rotate-ccw"
              label="Hamyonni nollash"
              color="red"
              variant="soft"
              size="sm"
              block
              :disabled="!bonusWallet || bonusWallet.amount === 0"
              @click="settleConfirmDialog = true"
            />
          </UCard>
        </aside>

        <!-- Right Column: Tabs and Content -->
        <div class="lg:col-span-9 space-y-6">
          <!-- Quick Stats Summary -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <UCard>
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-bold text-gray-500 uppercase">
                  Jami tranzaksiyalar
                </span>
                <span class="i-lucide-trending-up text-primary text-xl"></span>
              </div>
              <div class="text-2xl font-black text-gray-900 dark:text-white">
                {{ formatCurrency(totalTransactionsAmount) }}
              </div>
              <div class="text-[10px] text-gray-500 font-bold mt-1">
                {{ totalTransactions }} ta tranzaksiya
              </div>
            </UCard>

            <UCard>
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-bold text-gray-500 uppercase">
                  O'quvchilar
                </span>
                <span class="i-lucide-users text-blue-500 text-xl"></span>
              </div>
              <div class="text-2xl font-black text-gray-900 dark:text-white">
                {{ students.length }}
              </div>
              <div class="text-[10px] text-gray-500 font-bold mt-1">
                Aktiv o'quvchilar
              </div>
            </UCard>

            <UCard>
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-bold text-gray-500 uppercase">
                  Oxirgi tranzaksiya
                </span>
                <span class="i-lucide-calendar text-gray-500 text-xl"></span>
              </div>
              <div class="text-2xl font-black text-gray-900 dark:text-white">
                {{
                  transactions.length > 0
                    ? formatCurrency(transactions[0]?.amount || 0)
                    : "0 so'm"
                }}
              </div>
              <div class="text-[10px] text-gray-500 font-bold mt-1">
                {{
                  transactions.length > 0 && transactions[0]?.created_at
                    ? formatDate(transactions[0].created_at)
                    : "Ma'lumot yo'q"
                }}
              </div>
            </UCard>

            <UCard>
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-bold text-gray-500 uppercase">
                  Bonus & Jarima
                </span>
                <span class="i-lucide-badge-percent text-amber-500 text-xl"></span>
              </div>
              <div :class="['text-2xl font-black', (bonusWallet?.amount ?? 0) >= 0 ? 'text-green-600' : 'text-red-600']">
                {{ bonusWallet ? formatCurrency(bonusWallet.amount) : "0 so'm" }}
              </div>
              <div class="text-[10px] text-gray-500 font-bold mt-1">
                {{ totalBonusTransactions }} ta tranzaksiya
              </div>
            </UCard>
          </div>

          <!-- Tabs Card -->
          <UCard>
            <UTabs :items="tabItems">
              <!-- Transactions Tab -->
              <template #transactions>
                <div class="space-y-4">
                  <!-- Filters -->
                  <UDashboardToolbar>
                    <template #left>
                      <UInput v-model="transactionSearch" icon="i-lucide-search"
                        placeholder="Tranzaksiyalarni qidirish..." class="w-64" />
                    </template>

                    <template #right>
                      <USelectMenu v-model="transactionFilter" :items="transactionTypeOptions" value-key="value"
                        placeholder="Turi" class="w-40">
                        <template #label>
                          {{
                            transactionTypeOptions.find(
                              (t) => t.value === transactionFilter,
                            )?.label || "Turi"
                          }}
                        </template>
                      </USelectMenu>

                      <div class="flex items-center gap-2">
                        <UInput v-model="dateFrom" type="date" placeholder="Dan" class="w-40" />
                        <UInput v-model="dateTo" type="date" placeholder="Gacha" class="w-40" />
                      </div>

                      <UButton v-if="dateFrom || dateTo" icon="i-lucide-x" label="Tozalash" variant="ghost"
                        @click="clearDateFilters" />

                      <UButton icon="i-lucide-refresh-cw" label="Yangilash" variant="outline"
                        @click="loadTransactions" />
                    </template>
                  </UDashboardToolbar>

                  <!-- Transactions Table -->
                  <UTable :data="filteredTransactions" :columns="transactionColumns" :loading="loadingTransactions"
                    :empty="'Tranzaksiyalar topilmadi'" />

                  <!-- Pagination -->
                  <div v-if="totalTransactions > 0"
                    class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div class="text-sm text-gray-500">
                      <span class="font-medium">{{ paginationStart }}</span> dan
                      <span class="font-medium">{{ paginationEnd }}</span>
                      gacha, jami
                      <span class="font-medium">{{ totalTransactions }}</span>
                      ta tranzaksiya
                    </div>

                    <UPagination :page="currentPage" :total="totalTransactions"
                      :items-per-page="transactionsPerPage" show-last show-first
                      @update:page="(p: number) => (currentPage = p)" />
                  </div>
                </div>
              </template>

              <!-- Attendance Tab -->
              <template #attendance>
                <div class="space-y-4">
                  <!-- Filters -->
                  <UDashboardToolbar>
                    <template #left>
                      <UInput v-model="studentSearch" icon="i-lucide-search" placeholder="O'quvchilarni qidirish..."
                        class="w-64" />
                    </template>

                    <template #right>
                      <div class="flex items-center gap-2">
                        <UInput v-model="studentDateFrom" type="date" placeholder="Dan" class="w-40" />
                        <UInput v-model="studentDateTo" type="date" placeholder="Gacha" class="w-40" />
                      </div>

                      <UButton icon="i-lucide-calendar-check" label="Davomat yuklash"
                        @click="loadAllStudentsAttendance" />

                      <UButton icon="i-lucide-refresh-cw" label="Yangilash" variant="outline" @click="loadStudents" />
                    </template>
                  </UDashboardToolbar>

                  <!-- Students Table -->
                  <UTable :data="filteredStudents" :columns="studentColumns" :loading="loadingStudents"
                    :empty="'O\'quvchilar topilmadi'" />

                  <div v-if="filteredStudents.length > 0" class="flex justify-end text-sm text-gray-500">
                    Jami {{ filteredStudents.length }} ta o'quvchi
                  </div>
                </div>
              </template>

              <!-- Compensated Lessons Tab -->
              <template #compensated-lessons>
                <div class="space-y-4">
                  <!-- Toolbar -->
                  <UDashboardToolbar>
                    <template #left>
                      <div class="text-sm text-gray-500">
                        Jami
                        <span class="font-medium">{{
                          totalCompensatedLessons
                        }}</span>
                        ta qoldirilgan dars
                      </div>
                    </template>

                    <template #right>
                      <UButton icon="i-lucide-refresh-cw" label="Yangilash" variant="outline"
                        @click="loadCompensatedLessons" />
                    </template>
                  </UDashboardToolbar>

                  <!-- Compensated Lessons Table -->
                  <UTable :data="compensatedLessons" :columns="compensatedLessonsColumns"
                    :loading="loadingCompensatedLessons" :empty="'Qoldirilgan darslar topilmadi'" />

                  <!-- Pagination -->
                  <div v-if="totalCompensatedLessons > 0"
                    class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div class="text-sm text-gray-500">
                      <span class="font-medium">{{
                        (compensatedLessonsPage - 1) *
                        compensatedLessonsPerPage +
                        1
                      }}</span>
                      dan
                      <span class="font-medium">{{
                        Math.min(
                          compensatedLessonsPage * compensatedLessonsPerPage,
                          totalCompensatedLessons,
                        )
                      }}</span>
                      gacha, jami
                      <span class="font-medium">{{
                        totalCompensatedLessons
                      }}</span>
                      ta dars
                    </div>

                    <UPagination :page="compensatedLessonsPage" :total="totalCompensatedLessons"
                      :items-per-page="compensatedLessonsPerPage" show-last show-first
                      @update:page="(p: number) => (compensatedLessonsPage = p)" />
                  </div>
                </div>
              </template>
              <!-- Bonus-Penalty Tab -->
              <template #bonus-penalty>
                <div class="space-y-4">
                  <UDashboardToolbar>
                    <template #left>
                      <USelectMenu v-model="bonusTransactionFilter" :items="bonusTypeOptions" value-key="value"
                        placeholder="Turi" class="w-40">
                        <template #label>
                          {{ bonusTypeOptions.find((t) => t.value === bonusTransactionFilter)?.label || "Turi" }}
                        </template>
                      </USelectMenu>
                    </template>

                    <template #right>
                      <div class="flex items-center gap-2">
                        <UInput v-model="bonusDateFrom" type="date" placeholder="Dan" class="w-40" />
                        <UInput v-model="bonusDateTo" type="date" placeholder="Gacha" class="w-40" />
                      </div>
                      <UButton icon="i-lucide-refresh-cw" label="Yangilash" variant="outline"
                        @click="loadBonusTransactions" />
                      <UButton
                        icon="i-lucide-rotate-ccw"
                        label="Nollash"
                        color="red"
                        variant="soft"
                        :disabled="!bonusWallet || bonusWallet.amount === 0"
                        @click="settleConfirmDialog = true"
                      />
                    </template>
                  </UDashboardToolbar>

                  <UTable :data="bonusTransactions" :columns="bonusTransactionColumns"
                    :loading="loadingBonusTransactions" :empty="'Tranzaksiyalar topilmadi'" />

                  <div v-if="totalBonusTransactions > 0"
                    class="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div class="text-sm text-gray-500">
                      <span class="font-medium">{{ bonusPaginationStart }}</span> dan
                      <span class="font-medium">{{ bonusPaginationEnd }}</span> gacha, jami
                      <span class="font-medium">{{ totalBonusTransactions }}</span> ta
                      &nbsp;|&nbsp; Jami summa:
                      <span class="font-semibold text-gray-800 dark:text-gray-200">{{ formatCurrency(totalBonusAmount) }}</span>
                    </div>
                    <UPagination :page="bonusPage" :total="totalBonusTransactions" :items-per-page="bonusPerPage"
                      show-last show-first @update:page="(p: number) => (bonusPage = p)" />
                  </div>
                </div>
              </template>
            </UTabs>
          </UCard>
        </div>
      </div>

      <!-- Payment Modal -->
      <UModal v-model:open="paymentDialog" title="O'qituvchiga to'lov">
        <template #body>
          <form @submit.prevent="submitPayment" class="space-y-4">
            <UFormField label="Tur" name="category">
              <USelectMenu v-model="paymentForm.category_id" :items="formattedExpenseCategories" value-key="value"
                placeholder="Tur tanlang" required class="w-full" />
            </UFormField>

            <UFormField label="Summa" name="amount">
              <UInput v-model.number="paymentForm.amount" type="number" placeholder="Summa kiriting" required
                class="w-full" />
            </UFormField>

            <UFormField label="Izoh" name="description">
              <UTextarea v-model="paymentForm.description" placeholder="Izoh kiriting..." :rows="3" class="w-full" />
            </UFormField>

            <UFormField label="Sana" name="date">
              <UInput v-model="paymentForm.expense_date" type="date" required class="w-full" />
            </UFormField>
          </form>
        </template>

        <template #footer="{ close }">
          <div class="flex justify-end gap-2">
            <UButton label="Bekor qilish" variant="outline" @click="close" />
            <UButton label="Saqlash" :loading="isSubmittingPayment" @click="submitPayment" />
          </div>
        </template>
      </UModal>

      <!-- Settle Confirm Modal -->
      <UModal v-model:open="settleConfirmDialog" title="Hamyonni nollash">
        <template #body>
          <div class="space-y-3">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Joriy balans (<span :class="(bonusWallet?.amount ?? 0) >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'">
                {{ bonusWallet ? formatCurrency(bonusWallet.amount) : "0 so'm" }}
              </span>) nolga tushiriladi. Bu amalni bekor qilib bo'lmaydi.
            </p>
            <p class="text-sm text-gray-500">Davom etishni xohlaysizmi?</p>
          </div>
        </template>

        <template #footer="{ close }">
          <div class="flex justify-end gap-2">
            <UButton label="Bekor qilish" variant="outline" @click="close" />
            <UButton label="Ha, nollash" color="red" :loading="isSettling" @click="settleBonusWallet" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn, NavigationMenuItem } from "@nuxt/ui";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import { useFinancialAccess } from "~/composables/useFinancialAccess";

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UAvatar = resolveComponent("UAvatar");

const { hasFinancialAccess } = useFinancialAccess();

const teacherNavItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'O\'qituvchilar',
    icon: 'i-lucide-users',
    to: '/teachers'
  },
  ...(hasFinancialAccess.value
    ? [
      {
        label: 'Profillar',
        icon: 'i-lucide-user-cog',
        to: '/teachers/profile'
      },
      {
        label: 'Oyliklar',
        icon: 'i-lucide-wallet',
        to: '/salaries'
      }
    ]
    : []),
]);

definePageMeta({
  middleware: ["auth"],
});

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
  student?: {
    user_id: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
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

interface CompensatedLesson {
  id: string;
  teacher_id: string;
  compensate_lesson_id: string;
  amount: string;
  created_at: string;
  paid_at: string | null;
  isPaid: boolean;
  compensateLesson?: {
    id: string;
    attendance_id: string;
    teacher_id: string;
    student_id: string;
    compensated: boolean;
    compensated_by: string;
    valid_until: string;
    attendance?: {
      id: string;
      group_id: string;
      student_id: string;
      teacher_id: string;
      status: string;
      note: string;
      date: string;
      student?: {
        user_id: string;
        first_name: string;
        last_name: string;
        phone: string;
        username: string;
      };
    };
  };
}

interface BonusPenaltyWallet {
  id: string;
  teacher_id: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

interface BonusPenaltyTransaction {
  id: string;
  teacher_id: string;
  student_id?: string | null;
  lead_id?: string | null;
  category_id?: string | null;
  amount: number;
  type: "bonus" | "jarima" | "referal";
  description?: string | null;
  created_at: string;
  student?: { user_id: string; first_name: string; last_name: string; phone: string } | null;
  lead?: { id: string; first_name: string; last_name: string; phone: string } | null;
  category?: { id: string; name: string; type: string } | null;
}

const route = useRoute();
const router = useRouter();
const { apiService } = useAuth();
const toast = useToast();
const { formatPhone } = usePhoneFormatter();

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

// Pagination state
const currentPage = usePaginationState("page", 1);
const totalPages = ref(1);
const totalTransactions = ref(0);
const transactionsPerPage = ref(10);
const totalTransactionsAmount = ref(0);

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

// Compensated lessons state
const compensatedLessons = ref<CompensatedLesson[]>([]);
const loadingCompensatedLessons = ref(false);
const compensatedLessonsPage = ref(1);
const compensatedLessonsPerPage = ref(10);
const totalCompensatedLessons = ref(0);

// Bonus-penalty state
const bonusWallet = ref<BonusPenaltyWallet | null>(null);
const bonusTransactions = ref<BonusPenaltyTransaction[]>([]);
const loadingBonusTransactions = ref(false);
const bonusTransactionFilter = ref("all");
const bonusPage = ref(1);
const bonusPerPage = ref(10);
const totalBonusTransactions = ref(0);
const totalBonusAmount = ref(0);
const bonusDateFrom = ref(getDefaultDateFrom());
const bonusDateTo = ref(getDefaultDateTo());
const settleConfirmDialog = ref(false);
const isSettling = ref(false);

// Tab items
const tabItems = [
  {
    label: "Tranzaksiyalar",
    icon: "i-lucide-receipt",
    slot: "transactions",
  },
  {
    label: "Davomat",
    icon: "i-lucide-calendar-check",
    slot: "attendance",
  },
  {
    label: "Qoldirilgan darslar",
    icon: "i-lucide-calendar-x",
    slot: "compensated-lessons",
  },
  {
    label: "Bonus & Jarima",
    icon: "i-lucide-badge-percent",
    slot: "bonus-penalty",
  },
];

// Transaction type options
const transactionTypeOptions = [
  { label: "Barchasi", value: "all" },
  { label: "Kirim", value: "kirim" },
  { label: "Oylik", value: "oylik" },
  { label: "Avans", value: "avans" },
  { label: "Bonus", value: "bonus" },
  { label: "Hamyon", value: "hamyon" },
  { label: "Jarima", value: "jarima" },
];

// Table columns for transactions
const transactionColumns: TableColumn<Transaction>[] = [
  {
    accessorKey: "created_at",
    header: "Sana",
    cell: ({ row }) => formatDateTime(row.original.created_at),
  },
  {
    accessorKey: "type",
    header: "Tur",
    cell: ({ row }) => {
      return h(
        UBadge,
        {
          color: getTransactionBadgeColor(row.original.type),
        },
        () => [
          h("span", {
            class: `${getTransactionIcon(row.original.type)} mr-1`,
          }),
          getTransactionLabel(row.original.type),
        ],
      );
    },
  },
  {
    accessorKey: "student",
    header: "O'quvchi",
    cell: ({ row }) => {
      const student = row.original.student;
      if (student) {
        return h("div", { class: "flex flex-col" }, [
          h(
            "span",
            { class: "font-medium" },
            `${student.first_name} ${student.last_name}`,
          ),
          h("span", { class: "text-xs text-gray-500" }, formatPhone(student.phone)),
        ]);
      }
      return h("span", { class: "text-gray-400 text-sm" }, "-");
    },
  },
  {
    accessorKey: "amount",
    header: "Summa",
    cell: ({ row }) => {
      return h(
        "span",
        { class: getTransactionAmountClass(row.original.type) },
        `${getTransactionSign(row.original.type)} ${formatCurrency(row.original.amount)}`,
      );
    },
  },
];

// Table columns for students
const studentColumns: TableColumn<Student>[] = [
  {
    id: "index",
    header: "No",
    cell: ({ row, table }) => {
      const index = table.getRowModel().rows.indexOf(row);
      return h("span", { class: "text-gray-500" }, (index + 1).toString());
    },
  },
  {
    accessorKey: "student",
    header: "O'quvchi",
    cell: ({ row }) => {
      return h("div", { class: "flex items-center" }, [
        h(
          UAvatar,
          {
            size: "sm",
            alt: `${row.original.student.first_name} ${row.original.student.last_name}`,
          },
          {
            fallback: () =>
              h(
                "span",
                {},
                getInitials(
                  row.original.student.first_name,
                  row.original.student.last_name,
                ),
              ),
          },
        ),
        h(
          "span",
          { class: "ml-2 font-medium" },
          `${row.original.student.first_name} ${row.original.student.last_name}`,
        ),
      ]);
    },
  },
  {
    accessorKey: "group",
    header: "Guruh",
    cell: ({ row }) => row.original.group.name,
  },
  {
    id: "attendance",
    header: "Davomat",
    cell: ({ row }) => {
      const studentId = row.original.student.user_id;
      const isLoading = loadingAttendance.value.has(studentId);
      const attendance = studentAttendance.value[studentId];

      if (isLoading) {
        return h("div", { class: "flex justify-center" }, [
          h("span", { class: "i-lucide-loader-2 animate-spin" }),
        ]);
      }

      if (attendance) {
        return h("div", { class: "flex justify-center gap-2" }, [
          h(UBadge, { color: "green" }, () => [
            h("span", { class: "i-lucide-check mr-1" }),
            attendance.present || 0,
          ]),
          h(UBadge, { color: "gray" }, () => [
            h("span", { class: "i-lucide-x mr-1" }),
            attendance.absent || 0,
          ]),
        ]);
      }

      return h("span", { class: "text-gray-500 text-sm" }, "-");
    },
  },
];

// Table columns for compensated lessons
const compensatedLessonsColumns: TableColumn<CompensatedLesson>[] = [
  {
    id: "index",
    header: "No",
    cell: ({ row, table }) => {
      const index = table.getRowModel().rows.indexOf(row);
      return h(
        "span",
        { class: "text-gray-500" },
        (
          index +
          1 +
          (compensatedLessonsPage.value - 1) * compensatedLessonsPerPage.value
        ).toString(),
      );
    },
  },
  {
    accessorKey: "compensateLesson.attendance.date",
    header: "Dars sanasi",
    cell: ({ row }) => {
      const date = row.original.compensateLesson?.attendance?.date;
      return date
        ? formatDate(date)
        : h("span", { class: "text-gray-400 text-sm" }, "-");
    },
  },
  {
    accessorKey: "compensateLesson.attendance.student",
    header: "O'quvchi",
    cell: ({ row }) => {
      const student = row.original.compensateLesson?.attendance?.student;
      if (student) {
        return h("div", { class: "flex flex-col" }, [
          h(
            "span",
            { class: "font-medium" },
            `${student.first_name} ${student.last_name}`,
          ),
          h("span", { class: "text-xs text-gray-500" }, formatPhone(student.phone)),
        ]);
      }
      return h("span", { class: "text-gray-400 text-sm" }, "-");
    },
  },
  {
    accessorKey: "amount",
    header: "Summa",
    cell: ({ row }) => {
      return h(
        "span",
        { class: "font-semibold text-gray-900 dark:text-white" },
        formatCurrency(parseFloat(row.original.amount)),
      );
    },
  },
  {
    accessorKey: "compensateLesson.valid_until",
    header: "Amal qilish muddati",
    cell: ({ row }) => {
      const validUntil = row.original.compensateLesson?.valid_until;
      return validUntil
        ? formatDate(validUntil)
        : h("span", { class: "text-gray-400 text-sm" }, "-");
    },
  },
  {
    accessorKey: "isPaid",
    header: "Status",
    cell: ({ row }) => {
      return h(UBadge, { color: row.original.isPaid ? "green" : "gray" }, () =>
        row.original.isPaid ? "To'langan" : "Kutilmoqda",
      );
    },
  },
  {
    accessorKey: "paid_at",
    header: "To'langan sana",
    cell: ({ row }) => {
      return row.original.paid_at
        ? formatDateTime(row.original.paid_at)
        : h("span", { class: "text-gray-400 text-sm" }, "-");
    },
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      if (row.original.isPaid) {
        return h("span", { class: "text-gray-400 text-sm" }, "-");
      }
      return h(
        UButton,
        {
          icon: "i-lucide-check-circle",
          label: "To'lash",
          size: "xs",
          color: "green",
          onClick: () => markLessonAsPaid(row.original.id),
        },
      );
    },
  },
];

const bonusTypeOptions = [
  { label: "Barchasi", value: "all" },
  { label: "Bonus", value: "bonus" },
  { label: "Jarima", value: "jarima" },
  { label: "Referal", value: "referal" },
];

const bonusTransactionColumns: TableColumn<BonusPenaltyTransaction>[] = [
  {
    accessorKey: "created_at",
    header: "Sana",
    cell: ({ row }) => formatDateTime(row.original.created_at),
  },
  {
    accessorKey: "type",
    header: "Tur",
    cell: ({ row }) => {
      const colors: Record<string, string> = { bonus: "green", jarima: "red", referal: "blue" };
      const labels: Record<string, string> = { bonus: "Bonus", jarima: "Jarima", referal: "Referal" };
      return h(UBadge, { color: colors[row.original.type] || "gray" }, () => labels[row.original.type] || row.original.type);
    },
  },
  {
    accessorKey: "category",
    header: "Kategoriya",
    cell: ({ row }) =>
      row.original.category
        ? h("span", { class: "text-sm" }, row.original.category.name)
        : h("span", { class: "text-gray-400 text-sm" }, "—"),
  },
  {
    accessorKey: "student",
    header: "O'quvchi / Lead",
    cell: ({ row }) => {
      const s = row.original.student;
      const l = row.original.lead;
      if (s) return h("span", { class: "text-sm font-medium" }, `${s.first_name} ${s.last_name}`);
      if (l) return h("span", { class: "text-sm" }, `${l.first_name} ${l.last_name}`);
      return h("span", { class: "text-gray-400 text-sm" }, "—");
    },
  },
  {
    accessorKey: "description",
    header: "Izoh",
    cell: ({ row }) =>
      h("span", { class: "text-sm text-gray-500 max-w-48 truncate block" }, row.original.description || "—"),
  },
  {
    accessorKey: "amount",
    header: "Summa",
    cell: ({ row }) => {
      const isDebit = row.original.type === "jarima";
      return h(
        "span",
        { class: isDebit ? "text-red-600 font-semibold" : "text-green-600 font-semibold" },
        `${isDebit ? "−" : "+"} ${formatCurrency(row.original.amount)}`,
      );
    },
  },
];

// Computed
const filteredTransactions = computed(() => {
  // Return transactions as-is, filtering is done server-side
  return transactions.value;
});

const paginationStart = computed(
  () => (currentPage.value - 1) * transactionsPerPage.value + 1,
);
const paginationEnd = computed(() =>
  Math.min(
    currentPage.value * transactionsPerPage.value,
    totalTransactions.value,
  ),
);

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
      s.group.name?.toLowerCase().includes(searchLower),
  );
});

const formattedExpenseCategories = computed(() => {
  return expenseCategories.value.map((category) => ({
    label: category.name,
    value: category.id,
  }));
});

const bonusPaginationStart = computed(() => (bonusPage.value - 1) * bonusPerPage.value + 1);
const bonusPaginationEnd = computed(() => Math.min(bonusPage.value * bonusPerPage.value, totalBonusTransactions.value));

// Methods
const loadTeacher = async () => {
  try {
    const response = await api.get<Teacher>(
      apiService.value,
      `/users/${teacherId.value}`,
    );
    teacher.value = response;
  } catch (error) {
    console.error("Failed to load teacher:", error);
    toast.add({
      title: "Xatolik",
      description: "O'qituvchi ma'lumotlarini yuklashda xatolik.",
      color: "error",
    });
  }
};

const loadWallet = async () => {
  try {
    const response = await api.get<Wallet>(
      apiService.value,
      `/teacher-wallet/teacher/${teacherId.value}`,
    );
    wallet.value = response;
  } catch (error) {
    console.error("Failed to load wallet:", error);
    wallet.value = null;
    toast.add({
      title: "Xatolik",
      description: "Hamyon ma'lumotlarini yuklashda xatolik.",
      color: "error",
    });
  }
};

const loadTransactions = async () => {
  loadingTransactions.value = true;
  try {
    // Build query parameters
    const params = new URLSearchParams({
      teacher_id: teacherId.value,
      page: currentPage.value.toString(),
      limit: transactionsPerPage.value.toString(),
    });

    // Add type filter if not "all"
    if (transactionFilter.value && transactionFilter.value !== "all") {
      params.append("type", transactionFilter.value);
    }

    // Add date range filters
    if (dateFrom.value) {
      params.append("start_date", new Date(dateFrom.value!).toISOString());
    }
    if (dateTo.value) {
      params.append("end_date", new Date(dateTo.value!).toISOString());
    }

    // Add search filter
    if (transactionSearch.value) {
      params.append("search", transactionSearch.value);
    }

    const response = await api.get<{
      data: Transaction[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
      totalAmount: number;
    }>(apiService.value, `/teacher-transaction?${params.toString()}`);

    // Handle response with pagination
    if (response?.data && Array.isArray(response.data)) {
      transactions.value = response.data;
      currentPage.value = response.pagination.page;
      totalPages.value = response.pagination.totalPages;
      totalTransactions.value = response.pagination.total;
      totalTransactionsAmount.value = response.totalAmount;
    } else {
      transactions.value = [];
      totalPages.value = 1;
      totalTransactions.value = 0;
      totalTransactionsAmount.value = 0;
    }
  } catch (error) {
    console.error("Failed to load transactions:", error);
    transactions.value = [];
    totalPages.value = 1;
    totalTransactions.value = 0;
    totalTransactionsAmount.value = 0;
    toast.add({
      title: "Xatolik",
      description: "Tranzaksiyalarni yuklashda xatolik.",
      color: "error",
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
      `/group-students/teacher/${teacherId.value}/students`,
    );
    students.value = response;
  } catch (error) {
    console.error("Failed to load students:", error);
    students.value = [];
    toast.add({
      title: "Xatolik",
      description: "O'quvchilarni yuklashda xatolik.",
      color: "error",
    });
  } finally {
    loadingStudents.value = false;
  }
};

const loadStudentAttendance = async (studentId: string) => {
  if (!studentDateFrom.value || !studentDateTo.value) {
    toast.add({
      title: "Xatolik",
      description: "Iltimos, sanalarni tanlang.",
      color: "error",
    });
    return;
  }

  loadingAttendance.value.add(studentId);
  try {
    const response = await api.get<any[]>(
      apiService.value,
      `/attendance/student/${studentId}/daterange?startDate=${studentDateFrom.value}&endDate=${studentDateTo.value}&teacherId=${teacherId.value}`,
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
    toast.add({
      title: "Xatolik",
      description: "Iltimos, sanalarni tanlang.",
      color: "error",
    });
    return;
  }

  studentAttendance.value = {};
  const promises = students.value.map((student) =>
    loadStudentAttendance(student.student.user_id),
  );
  await Promise.all(promises);

  toast.add({
    title: "Muvaffaqiyat",
    description: "Davomat ma'lumotlari yuklandi.",
    color: "success",
  });
};

const loadExpenseCategories = async () => {
  try {
    const response = await api.get<ExpenseCategory[]>(
      apiService.value,
      "/expense-categories",
    );
    expenseCategories.value = response;
  } catch (error) {
    console.error("Failed to load expense categories:", error);
    toast.add({
      title: "Xatolik",
      description: "Xarajat turlarini yuklashda xatolik.",
      color: "error",
    });
  }
};

const loadCompensatedLessons = async () => {
  loadingCompensatedLessons.value = true;
  try {
    const params = new URLSearchParams({
      teacher_id: teacherId.value,
      page: compensatedLessonsPage.value.toString(),
      limit: compensatedLessonsPerPage.value.toString(),
    });

    const response = await api.get<{
      walletEntries: CompensatedLesson[];
      total: number;
      totalPages: number;
      currentPage: number;
    }>(
      apiService.value,
      `/compensate-lessons/wallet/all-teachers?${params.toString()}`,
    );

    if (response?.walletEntries && Array.isArray(response.walletEntries)) {
      compensatedLessons.value = response.walletEntries;
      compensatedLessonsPage.value = response.currentPage;
      totalCompensatedLessons.value = response.total;
    } else {
      compensatedLessons.value = [];
      totalCompensatedLessons.value = 0;
    }
  } catch (error) {
    console.error("Failed to load compensated lessons:", error);
    compensatedLessons.value = [];
    totalCompensatedLessons.value = 0;
    toast.add({
      title: "Xatolik",
      description: "Qoldirilgan darslarni yuklashda xatolik.",
      color: "error",
    });
  } finally {
    loadingCompensatedLessons.value = false;
  }
};

const loadBonusWallet = async () => {
  try {
    bonusWallet.value = await api.get<BonusPenaltyWallet>(
      apiService.value,
      `/bonus-penalty-wallet/teacher/${teacherId.value}`,
    );
  } catch {
    bonusWallet.value = null;
  }
};

const loadBonusTransactions = async () => {
  loadingBonusTransactions.value = true;
  try {
    const params = new URLSearchParams({
      teacher_id: teacherId.value,
      page: bonusPage.value.toString(),
      limit: bonusPerPage.value.toString(),
    });
    if (bonusTransactionFilter.value !== "all") params.append("type", bonusTransactionFilter.value);
    if (bonusDateFrom.value) params.append("start_date", new Date(bonusDateFrom.value).toISOString());
    if (bonusDateTo.value) params.append("end_date", new Date(bonusDateTo.value).toISOString());

    const response = await api.get<{
      data: BonusPenaltyTransaction[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
      totalAmount: number;
    }>(apiService.value, `/bonus-penalty-transaction?${params.toString()}`);

    if (response?.data) {
      bonusTransactions.value = response.data;
      bonusPage.value = response.pagination.page;
      totalBonusTransactions.value = response.pagination.total;
      totalBonusAmount.value = response.totalAmount;
    } else {
      bonusTransactions.value = [];
      totalBonusTransactions.value = 0;
      totalBonusAmount.value = 0;
    }
  } catch {
    bonusTransactions.value = [];
    totalBonusTransactions.value = 0;
    totalBonusAmount.value = 0;
  } finally {
    loadingBonusTransactions.value = false;
  }
};

const settleBonusWallet = async () => {
  isSettling.value = true;
  try {
    await api.patch(
      apiService.value,
      `/bonus-penalty-wallet/teacher/${teacherId.value}/settle`,
      {},
    );
    toast.add({ title: "Muvaffaqiyat", description: "Bonus & Jarima hamyoni nollandi.", color: "success" });
    settleConfirmDialog.value = false;
    await Promise.all([loadBonusWallet(), loadBonusTransactions()]);
  } catch {
    toast.add({ title: "Xatolik", description: "Hamyonni nollashda xatolik yuz berdi.", color: "error" });
  } finally {
    isSettling.value = false;
  }
};

const markLessonAsPaid = async (walletEntryId: string) => {
  try {
    await api.patch(
      apiService.value,
      `/compensate-lessons/wallet/${walletEntryId}/mark-paid`,
      {},
    );

    toast.add({
      title: "Muvaffaqiyat",
      description: "Dars to'landi deb belgilandi.",
      color: "success",
    });

    // Reload compensated lessons and wallet
    await Promise.all([loadCompensatedLessons(), loadWallet()]);
  } catch (error) {
    console.error("Failed to mark lesson as paid:", error);
    toast.add({
      title: "Xatolik",
      description: "Darsni to'landi deb belgilashda xatolik yuz berdi.",
      color: "error",
    });
  }
};

const submitPayment = async () => {
  if (!teacher.value) return;

  // Validate category_id is selected
  if (!paymentForm.category_id) {
    toast.add({
      title: "Xatolik",
      description: "Iltimos, tur tanlang.",
      color: "error",
    });
    return;
  }

  isSubmittingPayment.value = true;
  try {
    const selectedCategory = expenseCategories.value.find(
      (c) => c.id === paymentForm.category_id,
    );
    const categoryName = selectedCategory?.name || "To'lov";

    const payload = {
      title: `${teacher.value.first_name} ${teacher.value.last_name} ${categoryName}`,
      category_id: paymentForm.category_id,
      description: paymentForm.description,
      amount: paymentForm.amount,
      expense_date: paymentForm.expense_date ? new Date(paymentForm.expense_date).toISOString() : new Date().toISOString(),
      teacher_id: teacherId.value,
      reported_by: teacherId.value,
    };

    await api.post(apiService.value, "/expenses", payload);

    toast.add({
      title: "Muvaffaqiyat",
      description: "To'lov muvaffaqiyatli amalga oshirildi.",
      color: "success",
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
    toast.add({
      title: "Xatolik",
      description: "To'lovni amalga oshirishda xatolik yuz berdi.",
      color: "error",
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
      loadCompensatedLessons(),
      loadBonusWallet(),
      loadBonusTransactions(),
    ]);
  } finally {
    isLoading.value = false;
  }
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
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
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
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
    hamyon: "Hamyon",
    jarima: "Jarima",
  };
  return labels[type] || type;
};

const getTransactionBadgeColor = (type: string) => {
  if (type === "kirim" || type === "bonus" || type === "hamyon") return "green";
  return "gray";
};

const getTransactionIcon = (type: string) => {
  if (type === "kirim" || type === "bonus" || type === "hamyon") return "i-lucide-arrow-down-left";
  return "i-lucide-arrow-up-right";
};

const getTransactionAmountClass = (type: string) => {
  if (type === "kirim" || type === "bonus" || type === "hamyon")
    return "text-green-600 font-semibold text-right";
  return "text-red-600 font-semibold text-right";
};

const getTransactionSign = (type: string) => {
  if (type === "kirim" || type === "bonus" || type === "hamyon") return "+";
  return "-";
};

// Watch for filter changes and reload transactions
watch([transactionFilter, dateFrom, dateTo, transactionSearch], () => {
  currentPage.value = 1; // Reset to first page when filters change
  loadTransactions();
});

// Watch for page changes
watch(currentPage, () => {
  loadTransactions();
});

// Watch for compensated lessons page changes
watch(compensatedLessonsPage, () => {
  loadCompensatedLessons();
});

// Watch for bonus-penalty filter/page changes
watch([bonusTransactionFilter, bonusDateFrom, bonusDateTo], () => {
  bonusPage.value = 1;
  loadBonusTransactions();
});
watch(bonusPage, () => {
  loadBonusTransactions();
});

// Lifecycle
onMounted(() => {
  loadAllData();
});
</script>
