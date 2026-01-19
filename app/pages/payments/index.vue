<template>
  <UDashboardPanel id="payments">
    <template #header>
      <UDashboardNavbar title="To'lovlar boshqaruvi" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          Talabalar to'lovlarini kuzatish va boshqarish
        </template>

        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="To'lov qo'shish"
            @click="addPaymentDialog = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div>
        <!-- Filters Section -->
        <UDashboardToolbar>
          <template #left>
            <UInput
              v-model="query"
              icon="i-lucide-search"
              placeholder="To'lovlarni qidirish..."
              class="w-64"
            />
          </template>

          <template #right>
            <USelectMenu
              v-model="status"
              :items="statusOptions"
              value-key="value"
              placeholder="Holat"
              class="w-40"
            >
              <template #label>
                {{
                  statusOptions.find((s) => s.value === status)?.label ||
                  "Holat"
                }}
              </template>
            </USelectMenu>

            <USelectMenu
              v-model="payment_method"
              :items="paymentMethodOptions"
              value-key="value"
              placeholder="To'lov usuli"
              class="w-40"
            >
              <template #label>
                {{
                  paymentMethodOptions.find((m) => m.value === payment_method)
                    ?.label || "To'lov usuli"
                }}
              </template>
            </USelectMenu>

            <UPopover :popper="{ placement: 'bottom-end' }">
              <UButton
                icon="i-lucide-calendar"
                label="To'lov sanasi"
                variant="outline"
                trailing
              />

              <template #content>
                <div class="p-4 space-y-3 w-80">
                  <div class="space-y-2">
                    <label class="text-sm font-medium">Boshlanish</label>
                    <UInput
                      v-model="paymentStartDate"
                      type="date"
                      placeholder="Boshlanish sanasi"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-medium">Tugash</label>
                    <UInput
                      v-model="paymentEndDate"
                      type="date"
                      placeholder="Tugash sanasi"
                    />
                  </div>
                </div>
              </template>
            </UPopover>

            <UPopover :popper="{ placement: 'bottom-end' }">
              <UButton
                icon="i-lucide-calendar-clock"
                label="Keyingi to'lov"
                variant="outline"
                trailing
              />

              <template #content>
                <div class="p-4 space-y-3 w-80">
                  <div class="space-y-2">
                    <label class="text-sm font-medium">Boshlanish</label>
                    <UInput
                      v-model="nextPaymentStartDate"
                      type="date"
                      placeholder="Boshlanish sanasi"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-medium">Tugash</label>
                    <UInput
                      v-model="nextPaymentEndDate"
                      type="date"
                      placeholder="Tugash sanasi"
                    />
                  </div>
                </div>
              </template>
            </UPopover>

            <UPopover :popper="{ placement: 'bottom-end' }">
              <UButton
                icon="i-lucide-calendar-range"
                label="Yaratilgan sana"
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
              v-if="hasActiveFilters"
              icon="i-lucide-x"
              label="Tozalash"
              variant="ghost"
              @click="clearFilters"
            />
          </template>
        </UDashboardToolbar>

        <!-- Payments Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">To'lovlar ro'yxati</h3>
          </template>

          <UTable
            v-model:sorting="sorting"
            :data="payments"
            :columns="columns"
            :loading="isLoading"
            :empty="'To\'lovlar topilmadi'"
          />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                <span class="font-medium">{{ totalPayments }}</span> to'lov
              </div>

              <UPagination
                :model-value="page"
                :total="totalPayments"
                :items-per-page="limit"
                show-last
                show-first
                @update:page="(p: number) => (page = p)"
              />
            </div>
          </template>
        </UCard>
      </div>

      <!-- Add Payment Modal -->
      <UModal v-model:open="addPaymentDialog" title="Yangi to'lov qo'shish">
        <template #body>
          <form @submit.prevent="handleAddPayment" class="space-y-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium">
                Talaba
                <span class="text-red-500">*</span>
              </label>
              <USelectMenu
                v-model="selectedStudent"
                v-model:search-term="studentSearchTerm"
                :items="studentOptions"
                :loading="isLoadingStudents"
                searchable
                ignore-filter
                searchable-placeholder="Talaba ismi yoki telefon raqami..."
                placeholder="Talabani tanlang"
                class="w-full"
              />
              <p class="text-xs text-gray-500">
                Qidirish uchun kamida 2 ta harf kiriting
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="block text-sm font-medium">
                  Summa
                  <span class="text-red-500">*</span>
                </label>
                <UInput
                  v-model="newPayment.amount"
                  type="number"
                  step="0.01"
                  placeholder="Summa"
                  required
                  class="w-full"
                />
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-medium">
                  To'lov usuli
                  <span class="text-red-500">*</span>
                </label>
                <USelectMenu
                  v-model="newPayment.payment_method"
                  :items="paymentMethodOptions.filter((m) => m.value !== null)"
                  value-key="value"
                  placeholder="Usulni tanlang"
                  class="w-full"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="block text-sm font-medium">
                  To'lov sanasi
                  <span class="text-red-500">*</span>
                </label>
                <UInput
                  v-model="newPayment.payment_date"
                  type="date"
                  required
                  class="w-full"
                />
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-medium">
                  Keyingi to'lov sanasi
                </label>
                <UInput
                  v-model="newPayment.next_payment_date"
                  type="date"
                  class="w-full"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">
                Holat
                <span class="text-red-500">*</span>
              </label>
              <USelectMenu
                v-model="newPayment.status"
                :items="statusOptions.filter((s) => s.value !== null)"
                value-key="value"
                placeholder="Holatni tanlang"
                class="w-full"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">Izohlar</label>
              <UTextarea
                v-model="newPayment.notes"
                placeholder="To'lov tafsilotlari"
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
              label="To'lovni qayd qilish"
              :loading="isSubmitting"
              @click="handleAddPayment"
            />
          </div>
        </template>
      </UModal>

      <!-- Edit Payment Modal -->
      <UModal v-model:open="editPaymentDialog" title="To'lovni tahrirlash">
        <template #body>
          <form @submit.prevent="handleEditPayment" class="space-y-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium">
                Talaba
                <span class="text-red-500">*</span>
              </label>
              <USelectMenu
                v-model="selectedStudent"
                v-model:search-term="studentSearchTerm"
                :items="studentOptions"
                :loading="isLoadingStudents"
                searchable
                ignore-filter
                searchable-placeholder="Talaba ismi yoki telefon raqami..."
                placeholder="Talabani tanlang"
                class="w-full"
              />
              <p class="text-xs text-gray-500">
                Qidirish uchun kamida 2 ta harf kiriting
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="block text-sm font-medium">
                  Summa
                  <span class="text-red-500">*</span>
                </label>
                <UInput
                  v-model="editPayment.amount"
                  type="number"
                  step="0.01"
                  placeholder="Summa"
                  required
                  class="w-full"
                />
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-medium">
                  To'lov usuli
                  <span class="text-red-500">*</span>
                </label>
                <USelectMenu
                  v-model="editPayment.payment_method"
                  :items="paymentMethodOptions.filter((m) => m.value !== null)"
                  value-key="value"
                  placeholder="Usulni tanlang"
                  class="w-full"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="block text-sm font-medium">
                  To'lov sanasi
                  <span class="text-red-500">*</span>
                </label>
                <UInput
                  v-model="editPayment.payment_date"
                  type="date"
                  required
                  class="w-full"
                />
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-medium">
                  Keyingi to'lov sanasi
                </label>
                <UInput v-model="editPayment.next_payment_date" type="date" class="w-full"/>
              </div>
            </div>
            <div class="space-y-2">
              <label class="block text-sm font-medium">
                Holat
                <span class="text-red-500">*</span>
              </label>
              <USelectMenu
                v-model="editPayment.status"
                :items="statusOptions.filter((s) => s.value !== null)"
                value-key="value"
                placeholder="Holatni tanlang"
                class="w-full"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">Izohlar</label>
              <UTextarea
                v-model="editPayment.notes"
                placeholder="To'lov tafsilotlari"
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
              label="Saqlash"
              :loading="isSubmitting"
              @click="handleEditPayment"
            />
          </div>
        </template>
      </UModal>

      <!-- View Payment Modal -->
      <UModal v-model:open="viewPaymentDialog" title="To'lov tafsilotlari">
        <template #body>
          <div v-if="selectedPayment" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">Talaba</h4>
                <p class="font-medium">
                  {{ selectedPayment.student?.first_name }}
                  {{ selectedPayment.student?.last_name }}
                </p>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">Summa</h4>
                <p class="font-medium">
                  {{ formatCurrency(selectedPayment.amount) }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">
                  To'lov usuli
                </h4>
                <p>{{ selectedPayment.payment_method }}</p>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">Holat</h4>
                <UBadge :color="getStatusColor(selectedPayment.status)">
                  {{ selectedPayment.status }}
                </UBadge>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">
                  To'lov sanasi
                </h4>
                <p>{{ formatDate(selectedPayment.payment_date) }}</p>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">
                  Keyingi to'lov sanasi
                </h4>
                <p>{{ formatDate(selectedPayment.next_payment_date) }}</p>
              </div>
            </div>

            <div v-if="selectedPayment.notes">
              <h4 class="text-sm font-medium text-gray-500 mb-1">Izohlar</h4>
              <p class="text-sm">{{ selectedPayment.notes }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">
                  Yaratilgan
                </h4>
                <p class="text-sm">
                  {{ formatDate(selectedPayment.createdAt) }}
                </p>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">
                  Yangilangan
                </h4>
                <p class="text-sm">
                  {{ formatDate(selectedPayment.updatedAt) }}
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
import { refDebounced } from "@vueuse/core";
import type { TableColumn } from "@nuxt/ui";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UPopover = resolveComponent("UPopover");

definePageMeta({
  middleware: ["auth"],
});

// Types
interface Payment {
  id: string;
  student_id: string;
  manager_id: string;
  branch_id: string | null;
  student?: {
    user_id: string;
    username: string;
    first_name: string;
    last_name: string;
    phone: string;
    level_id: string;
  };
  manager?: {
    user_id: string;
    username: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  amount: number;
  payment_method: string;
  status: string;
  payment_date: string;
  next_payment_date?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Composables
const { apiService } = useAuth();
const toast = useToast();
const route = useRoute();
const router = useRouter();

// State
const payments = ref<Payment[]>([]);
const students = ref<any[]>([]);
const studentSearchTerm = ref("");
const studentSearchDebounced = refDebounced(studentSearchTerm, 300);
const isLoadingStudents = ref(false);
const isLoading = ref(true);
const isSubmitting = ref(false);
const isDeleting = ref(false);

// Pagination
const page = ref(1);
const limit = ref(10);
const totalPayments = ref(0);

const paginationStart = computed(() => (page.value - 1) * limit.value + 1);
const paginationEnd = computed(() =>
  Math.min(page.value * limit.value, totalPayments.value),
);

// Filters
const query = ref("");
const status = ref<string | null>(null);
const payment_method = ref<string | null>(null);
const startDate = ref("");
const endDate = ref("");
const paymentStartDate = ref("");
const paymentEndDate = ref("");
const nextPaymentStartDate = ref("");
const nextPaymentEndDate = ref("");

// Modals
const addPaymentDialog = ref(false);
const editPaymentDialog = ref(false);
const viewPaymentDialog = ref(false);
const selectedPayment = ref<Payment | null>(null);
const selectedStudent = ref<any>(null);
const deletePopoverOpen = ref<Record<string, boolean>>({});

// Form data
const newPayment = reactive({
  student_id: "",
  amount: 0,
  payment_method: "",
  status: "completed",
  payment_date: "",
  next_payment_date: "",
  notes: "",
});

const editPayment = reactive({
  id: "",
  student_id: "",
  amount: 0,
  payment_method: "",
  status: "",
  payment_date: "",
  next_payment_date: "",
  notes: "",
});

// Table columns
const columns: TableColumn<Payment>[] = [
  {
    accessorKey: "student",
    header: "Talaba",
    cell: ({ row }) => {
      return h("div", {}, [
        h(
          "div",
          { class: "font-medium" },
          `${row.original.student?.first_name || ""} ${row.original.student?.last_name || ""}`,
        ),
        h(
          "div",
          { class: "text-xs text-gray-500" },
          row.original.student?.phone || "",
        ),
      ]);
    },
  },
  {
    accessorKey: "amount",
    header: "Summa",
    cell: ({ row }) => formatCurrency(row.original.amount),
  },
  {
    accessorKey: "payment_method",
    header: "To'lov usuli",
  },
  {
    accessorKey: "status",
    header: "Holat",
    cell: ({ row }) => {
      return h(
        UBadge,
        {
          color: getStatusColor(row.original.status),
        },
        () => row.original.status,
      );
    },
  },
  {
    accessorKey: "payment_date",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();

      return h(UButton, {
        color: "neutral",
        variant: "ghost",
        label: "To'lov sanasi",
        icon: isSorted
          ? isSorted === "asc"
            ? "i-lucide-arrow-up-narrow-wide"
            : "i-lucide-arrow-down-wide-narrow"
          : "i-lucide-arrow-up-down",
        class: "-mx-2.5",
        onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
      });
    },
    cell: ({ row }) => formatDate(row.original.payment_date),
  },
  {
    accessorKey: "next_payment_date",
    header: "Keyingi to'lov",
    cell: ({ row }) => formatDate(row.original.next_payment_date),
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      const paymentId = row.original.id;
      return h("div", { class: "flex items-center gap-1" }, [
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-receipt",
          size: "sm",
          square: true,
          onClick: () => downloadReceipt(row.original),
        }),
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-eye",
          size: "sm",
          square: true,
          onClick: () => viewPayment(row.original),
        }),
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-pencil",
          size: "sm",
          square: true,
          onClick: () => openEditPayment(row.original),
        }),
        h(
          UPopover,
          {
            open: deletePopoverOpen.value[paymentId] || false,
            "onUpdate:open": (value: boolean) => {
              deletePopoverOpen.value[paymentId] = value;
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
                  "Bu to'lovni butunlay o'chiradi. Bu amalni qaytarib bo'lmaydi.",
                ),
                h("div", { class: "flex justify-end gap-2 mt-3" }, [
                  h(UButton, {
                    color: "neutral",
                    variant: "subtle",
                    label: "Bekor qilish",
                    size: "sm",
                    onClick: () => {
                      deletePopoverOpen.value[paymentId] = false;
                    },
                  }),
                  h(UButton, {
                    color: "red",
                    label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                    loading: isDeleting.value,
                    size: "sm",
                    onClick: async () => {
                      await deletePayment(row.original);
                      deletePopoverOpen.value[paymentId] = false;
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

const sorting = ref([
  {
    id: "payment_date",
    desc: true,
  },
]);

// Options
const statusOptions = [
  { label: "Barchasi", value: null },
  { label: "Bajarildi", value: "completed" },
  { label: "Kutilmoqda", value: "pending" },
  { label: "Muvaffaqiyatsiz", value: "failed" },
];

const paymentMethodOptions = [
  { label: "Barchasi", value: null },
  { label: "Naqd", value: "Naqd" },
  { label: "Karta", value: "Karta" },
  { label: "Click", value: "Click" },
  { label: "Payme", value: "Payme" },
];

const studentOptions = computed(() =>
  students.value.map((student) => ({
    value: student.user_id,
    label: `${student.first_name} ${student.last_name} (${student.phone})`,
  })),
);

// Computed
const hasActiveFilters = computed(() => {
  return (
    query.value !== "" ||
    status.value !== null ||
    payment_method.value !== null ||
    startDate.value !== "" ||
    endDate.value !== "" ||
    paymentStartDate.value !== "" ||
    paymentEndDate.value !== "" ||
    nextPaymentStartDate.value !== "" ||
    nextPaymentEndDate.value !== ""
  );
});

// Helper functions
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    completed: "green",
    pending: "yellow",
    failed: "red",
  };
  return colors[status] || "gray";
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency: "UZS",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
};

// API functions
const loadPayments = async () => {
  isLoading.value = true;
  try {
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: limit.value.toString(),
    });

    if (query.value) params.append("query", query.value);
    if (status.value) params.append("status", status.value);
    if (payment_method.value)
      params.append("payment_method", payment_method.value);
    if (startDate.value) params.append("startDate", startDate.value);
    if (endDate.value) params.append("endDate", endDate.value);
    if (paymentStartDate.value)
      params.append("paymentStartDate", paymentStartDate.value);
    if (paymentEndDate.value)
      params.append("paymentEndDate", paymentEndDate.value);
    if (nextPaymentStartDate.value)
      params.append("nextPaymentStartDate", nextPaymentStartDate.value);
    if (nextPaymentEndDate.value)
      params.append("nextPaymentEndDate", nextPaymentEndDate.value);

    const response = await api.get<{
      data: Payment[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, `/student-payments?${params.toString()}`);

    payments.value = response.data || [];
    totalPayments.value = response.total || 0;
  } catch (error) {
    console.error("Failed to load payments:", error);
    toast.add({
      title: "Xatolik",
      description: "To'lovlarni yuklashda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const searchStudents = async (query: string) => {
  if (!query || query.length < 2) {
    students.value = [];
    return;
  }

  isLoadingStudents.value = true;
  try {
    const response = await api.get<{ data: any[]; total: number }>(
      apiService.value,
      `/users/students?query=${encodeURIComponent(query)}`,
    );
    students.value = response.data || [];
  } catch (error) {
    console.error("Failed to search students:", error);
  } finally {
    isLoadingStudents.value = false;
  }
};

// Action handlers
const viewPayment = (payment: Payment) => {
  selectedPayment.value = payment;
  viewPaymentDialog.value = true;
};

const openEditPayment = (payment: Payment) => {
  editPayment.id = payment.id;
  editPayment.student_id = payment.student_id;
  editPayment.amount = payment.amount;
  editPayment.payment_method = payment.payment_method;
  editPayment.status = payment.status;
  editPayment.payment_date = payment.payment_date;
  editPayment.next_payment_date = payment.next_payment_date || "";
  editPayment.notes = payment.notes || "";

  // Set selected student for display
  if (payment.student) {
    selectedStudent.value = {
      value: payment.student_id,
      label: `${payment.student.first_name} ${payment.student.last_name} (${payment.student.phone})`,
    };
  }

  editPaymentDialog.value = true;
};

const deletePayment = async (payment: Payment) => {
  isDeleting.value = true;
  try {
    await api.delete(apiService.value, `/student-payments/${payment.id}`);
    toast.add({
      title: "Muvaffaqiyatli",
      description: "To'lov o'chirildi",
      color: "success",
    });
    loadPayments();
  } catch (error) {
    console.error("Failed to delete payment:", error);
    toast.add({
      title: "Xatolik",
      description: "To'lovni o'chirishda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
};

const translateStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    completed: "Bajarildi",
    pending: "Kutilmoqda",
    failed: "Muvaffaqiyatsiz",
  };
  return statusMap[status] || status;
};

const downloadReceipt = async (payment: any) => {
  try {
    toast.add({
      title: "Jarayon",
      description: "Kvitansiya PDF tayyorlanmoqda...",
    });

    // Import jsPDF dynamically
    const { jsPDF } = await import("jspdf");
    // Import QRCode dynamically
    const QRCodeModule = await import("qrcode");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, 160],
    });

    pdf.setProperties({
      title: `To'lov kvitansiyasi #${payment.id}`,
      subject: "To'lov kvitansiyasi",
      author: "IMPULSE LC",
      creator: "IMPULSE LC CRM",
    });

    // Add the logo
    const logoImg = new Image();
    logoImg.src = "/logo.png";
    await new Promise((resolve) => {
      logoImg.onload = resolve;
    });
    const logoWidth = 30;
    const logoHeight = (logoImg.height * logoWidth) / logoImg.width;
    const logoX = (80 - logoWidth) / 2;
    pdf.addImage(logoImg, "PNG", logoX, 5, logoWidth, logoHeight);

    // Draw dotted lines - using proper TypeScript handling
    // @ts-ignore - jsPDF typings might not include setLineDash
    if (typeof pdf.setLineDash === "function") {
      // @ts-ignore
      pdf.setLineDash([1, 1], 0);
    }
    pdf.setLineWidth(0.2);
    pdf.line(5, logoHeight + 10, 75, logoHeight + 10);
    // @ts-ignore
    if (typeof pdf.setLineDash === "function") {
      // @ts-ignore
      pdf.setLineDash([]);
    }

    // Company Info
    pdf.setFontSize(9);
    pdf.text(`No: #${payment.id}`, 5, logoHeight + 15);
    pdf.text(
      "Manzil: Toshkent sh., Sergeli 5-mavzesi, (3-metro)",
      5,
      logoHeight + 19,
    );
    pdf.text("Tel: +998 95 525 99 66", 5, logoHeight + 23);
    pdf.text(
      `Menejer: ${payment.manager?.first_name || ""} ${
        payment.manager?.last_name || ""
      }`,
      5,
      logoHeight + 27,
    );

    // Draw dotted line
    // @ts-ignore
    if (typeof pdf.setLineDash === "function") {
      // @ts-ignore
      pdf.setLineDash([1, 1], 0);
    }
    pdf.line(5, logoHeight + 30, 75, logoHeight + 30);
    // @ts-ignore
    if (typeof pdf.setLineDash === "function") {
      // @ts-ignore
      pdf.setLineDash([]);
    }

    // Student and Payment Info
    pdf.text(
      `F.I.Sh: ${payment.student?.first_name || ""} ${
        payment.student?.last_name || ""
      }`,
      5,
      logoHeight + 35,
    );
    pdf.text(`To'lov usuli: ${payment.payment_method}`, 5, logoHeight + 39);
    pdf.text(
      `To'lov sanasi: ${formatDate(payment.payment_date)}`,
      5,
      logoHeight + 43,
    );
    pdf.text(`Holat: ${translateStatus(payment.status)}`, 5, logoHeight + 47);
    pdf.text(
      `Keyingi to'lov: ${formatDate(payment.next_payment_date)}`,
      5,
      logoHeight + 51,
    );

    // Draw dotted line
    // @ts-ignore
    if (typeof pdf.setLineDash === "function") {
      // @ts-ignore
      pdf.setLineDash([1, 1], 0);
    }
    pdf.line(5, logoHeight + 54, 75, logoHeight + 54);
    // @ts-ignore
    if (typeof pdf.setLineDash === "function") {
      // @ts-ignore
      pdf.setLineDash([]);
    }

    // Amount
    const amount = Number(payment.amount) || 0;
    pdf.setFont("helvetica", "bold");
    pdf.text(`To'landi: ${amount.toLocaleString()} so'm`, 5, logoHeight + 59);
    pdf.setFont("helvetica", "normal");

    // Draw dotted line
    // @ts-ignore
    if (typeof pdf.setLineDash === "function") {
      // @ts-ignore
      pdf.setLineDash([1, 1], 0);
    }
    pdf.line(5, logoHeight + 66, 75, logoHeight + 66);
    // @ts-ignore
    if (typeof pdf.setLineDash === "function") {
      // @ts-ignore
      pdf.setLineDash([]);
    }

    // Notes section if available
    if (payment.notes) {
      pdf.text(`Izoh: ${payment.notes}`, 5, logoHeight + 71);
      // Adjust position for remaining content
      // @ts-ignore
      if (typeof pdf.setLineDash === "function") {
        // @ts-ignore
        pdf.setLineDash([1, 1], 0);
      }
      pdf.line(5, logoHeight + 74, 75, logoHeight + 74);
      // @ts-ignore
      if (typeof pdf.setLineDash === "function") {
        // @ts-ignore
        pdf.setLineDash([]);
      }
    }

    // Thank You in bold
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      "THANK YOU",
      40,
      payment.notes ? logoHeight + 79 : logoHeight + 71,
      { align: "center" },
    );
    pdf.setFont("helvetica", "normal");

    // Use payment creation date instead of current date
    const creationDate = payment.createdAt
      ? new Date(payment.createdAt).toLocaleDateString()
      : "N/A";
    const creationTime = payment.createdAt
      ? new Date(payment.createdAt).toLocaleTimeString()
      : "N/A";

    // QR Code
    const qrData = `To'lov ID: ${payment.id}\nTalaba: ${
      payment.student?.first_name || ""
    } ${
      payment.student?.last_name || ""
    }\nSumma: ${amount} so'm\nSana: ${creationDate}, ${creationTime}\nQabul qiluvchi: ${
      payment.manager?.first_name || ""
    } ${payment.manager?.last_name || ""}`;
    // Use the toDataURL method from the imported QRCode module
    const qrCodeUrl = await QRCodeModule.toDataURL(qrData, {
      width: 30,
      margin: 1,
    });
    const qrX = (80 - 30) / 2;
    const qrY = payment.notes ? logoHeight + 85 : logoHeight + 80;
    pdf.addImage(qrCodeUrl, "PNG", qrX, qrY, 30, 30);

    pdf.text(`${creationDate}, ${creationTime}`, 40, qrY + 35, {
      align: "center",
    });

    // Save the PDF
    pdf.save(`kvitansiya-${payment.id}.pdf`);

    toast.add({
      title: "Muvaffaqiyat",
      description: "Kvitansiya muvaffaqiyatli yuklandi",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to generate receipt PDF:", error);
    toast.add({
      title: "Xatolik",
      description: "Kvitansiyani yaratishda xatolik. Qaytadan urinib ko'ring.",
      color: "error",
    });
  }
};

const handleAddPayment = async () => {
  isSubmitting.value = true;
  try {
    await api.post(apiService.value, "/student-payments", newPayment);
    toast.add({
      title: "Muvaffaqiyatli",
      description: "To'lov qo'shildi",
      color: "success",
    });
    addPaymentDialog.value = false;
    resetForm();
    loadPayments();
  } catch (error) {
    console.error("Failed to add payment:", error);
    toast.add({
      title: "Xatolik",
      description: "To'lov qo'shishda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const handleEditPayment = async () => {
  isSubmitting.value = true;
  try {
    const { id, ...updateData } = editPayment;
    await api.patch(apiService.value, `/student-payments/${id}`, updateData);
    toast.add({
      title: "Muvaffaqiyatli",
      description: "To'lov yangilandi",
      color: "success",
    });
    editPaymentDialog.value = false;
    resetForm();
    loadPayments();
  } catch (error) {
    console.error("Failed to edit payment:", error);
    toast.add({
      title: "Xatolik",
      description: "To'lovni yangilashda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  newPayment.student_id = "";
  newPayment.amount = 0;
  newPayment.payment_method = "";
  newPayment.status = "completed";
  newPayment.payment_date = "";
  newPayment.next_payment_date = "";
  newPayment.notes = "";

  editPayment.id = "";
  editPayment.student_id = "";
  editPayment.amount = 0;
  editPayment.payment_method = "";
  editPayment.status = "";
  editPayment.payment_date = "";
  editPayment.next_payment_date = "";
  editPayment.notes = "";

  selectedStudent.value = null;
};

const clearFilters = () => {
  query.value = "";
  status.value = null;
  payment_method.value = null;
  startDate.value = "";
  endDate.value = "";
  paymentStartDate.value = "";
  paymentEndDate.value = "";
  nextPaymentStartDate.value = "";
  nextPaymentEndDate.value = "";
};

const updateUrlParams = () => {
  const queryParams: Record<string, string> = {
    page: page.value.toString(),
    limit: limit.value.toString(),
  };

  if (query.value) queryParams.query = query.value;
  if (status.value) queryParams.status = status.value;
  if (payment_method.value) queryParams.payment_method = payment_method.value;
  if (startDate.value) queryParams.startDate = startDate.value;
  if (endDate.value) queryParams.endDate = endDate.value;
  if (paymentStartDate.value)
    queryParams.paymentStartDate = paymentStartDate.value;
  if (paymentEndDate.value) queryParams.paymentEndDate = paymentEndDate.value;
  if (nextPaymentStartDate.value)
    queryParams.nextPaymentStartDate = nextPaymentStartDate.value;
  if (nextPaymentEndDate.value)
    queryParams.nextPaymentEndDate = nextPaymentEndDate.value;

  router.push({ query: queryParams });
};

// Watchers
watch(page, () => {
  loadPayments();
  updateUrlParams();
});

watch(limit, () => {
  page.value = 1;
  loadPayments();
  updateUrlParams();
});

watch(
  [
    query,
    status,
    payment_method,
    startDate,
    endDate,
    paymentStartDate,
    paymentEndDate,
    nextPaymentStartDate,
    nextPaymentEndDate,
  ],
  () => {
    page.value = 1;
    loadPayments();
    updateUrlParams();
  },
);

// Watchers for student search
watch(studentSearchDebounced, (query) => {
  searchStudents(query);
});

watch(selectedStudent, (student) => {
  if (student && typeof student === "object" && student.value) {
    newPayment.student_id = student.value;
    editPayment.student_id = student.value;
  } else if (typeof student === "string") {
    newPayment.student_id = student;
    editPayment.student_id = student;
  }
});

watch(addPaymentDialog, (isOpen) => {
  if (!isOpen) {
    studentSearchTerm.value = "";
    students.value = [];
    selectedStudent.value = null;
  }
});

watch(editPaymentDialog, (isOpen) => {
  if (!isOpen) {
    studentSearchTerm.value = "";
    students.value = [];
    selectedStudent.value = null;
  }
});

// Initialize
onMounted(() => {
  // Load URL params
  if (route.query.page) {
    page.value = parseInt(route.query.page as string) || 1;
  }
  if (route.query.limit) {
    limit.value = parseInt(route.query.limit as string) || 10;
  }
  if (route.query.query) {
    query.value = route.query.query as string;
  }
  if (route.query.status) {
    status.value = route.query.status as string;
  }
  if (route.query.payment_method) {
    payment_method.value = route.query.payment_method as string;
  }
  if (route.query.startDate) {
    startDate.value = route.query.startDate as string;
  }
  if (route.query.endDate) {
    endDate.value = route.query.endDate as string;
  }
  if (route.query.paymentStartDate) {
    paymentStartDate.value = route.query.paymentStartDate as string;
  }
  if (route.query.paymentEndDate) {
    paymentEndDate.value = route.query.paymentEndDate as string;
  }
  if (route.query.nextPaymentStartDate) {
    nextPaymentStartDate.value = route.query.nextPaymentStartDate as string;
  }
  if (route.query.nextPaymentEndDate) {
    nextPaymentEndDate.value = route.query.nextPaymentEndDate as string;
  }

  loadPayments();
});
</script>
