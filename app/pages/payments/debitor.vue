<template>
  <UDashboardPanel id="debitor-payments">
    <template #header>
      <UDashboardNavbar title="Qarzdor talabalar" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          Muddati o'tgan to'lovlarga ega talabalar
        </template>

        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            label="Yangilash"
            variant="outline"
            @click="refreshData"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Stats Overview -->
        <div class="grid gap-4 md:grid-cols-3">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">Jami qarzdorlar</span>
                <UIcon name="i-lucide-users" class="w-4 h-4 text-gray-500" />
              </div>
            </template>
            <div class="text-2xl font-bold">{{ debitorCount }}</div>
            <p class="text-xs text-gray-500 mt-1">
              Muddati o'tgan to'lovlarga ega talabalar
            </p>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">Jami qarz</span>
                <UIcon name="i-lucide-banknote" class="w-4 h-4 text-gray-500" />
              </div>
            </template>
            <div class="text-2xl font-bold">
              {{ formatCurrency(totalOverdueAmount) }}
            </div>
            <p class="text-xs text-gray-500 mt-1">To'lanmagan to'lovlar</p>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">O'rtacha kunlar</span>
                <UIcon name="i-lucide-clock" class="w-4 h-4 text-gray-500" />
              </div>
            </template>
            <div class="text-2xl font-bold">{{ averageDaysOverdue }}</div>
            <p class="text-xs text-gray-500 mt-1">O'rtacha kechikish kunlari</p>
          </UCard>
        </div>

        <!-- Filters Section -->
        <UDashboardToolbar>
          <template #left>
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Talaba nomini qidirish..."
              class="w-64"
            />
          </template>

          <template #right>
            <UButton
              icon="i-lucide-download"
              label="CSV yuklash"
              variant="outline"
              @click="exportToCSV"
            />
          </template>
        </UDashboardToolbar>

        <!-- Debitor Students Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Qarzdor talabalar</h3>
          </template>

          <UTable
            :data="paginatedDebitors"
            :columns="columns"
            :loading="loading"
            :empty="'Qarzdor talabalar topilmadi'"
          />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                Ko'rsatilmoqda
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha,
                <span class="font-medium">{{ filteredDebitors.length }}</span>
                qarzdorlar
              </div>
              <UPagination
                :model-value="currentPage"
                :total="filteredDebitors.length"
                :items-per-page="itemsPerPage"
                show-first
                show-last
                @update:page="(p: number) => (currentPage = p)"
              />
            </div>
          </template>
        </UCard>
      </div>

      <!-- Mark as Paid Modal -->
      <UModal
        v-model:open="showPaymentDialog"
        title="To'lovni qayd qilish"
        :description="`${selectedDebitor?.student_name} uchun to'lovni qayd qilish`"
      >
        <template #body>
          <form @submit.prevent="confirmPayment" class="space-y-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium">
                Summa
                <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="paymentDetails.amount"
                type="number"
                :placeholder="
                  selectedDebitor ? String(selectedDebitor.amount) : '0'
                "
                required
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">
                To'lov usuli
                <span class="text-red-500">*</span>
              </label>
              <USelectMenu
                v-model="paymentDetails.method"
                :items="paymentMethodOptions"
                value-key="value"
                placeholder="To'lov usulini tanlang"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">Izoh</label>
              <UTextarea
                v-model="paymentDetails.notes"
                placeholder="To'lov haqida izoh qo'shing"
                rows="3"
                class="w-full"
              />
            </div>
          </form>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              label="Bekor qilish"
              variant="outline"
              @click="showPaymentDialog = false"
            />
            <UButton
              label="To'lovni qayd qilish"
              :loading="isProcessingPayment"
              @click="confirmPayment"
            />
          </div>
        </template>
      </UModal>

      <!-- Send Reminder Modal -->
      <UModal
        v-model:open="showReminderDialog"
        title="To'lov eslatmasi yuborish"
        :description="`${selectedDebitor?.student_name} ga to'lov eslatmasi yuborish`"
      >
        <template #body>
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium">Eslatma turi</label>
              <USelectMenu
                v-model="reminderDetails.type"
                :items="reminderTypeOptions"
                value-key="value"
                placeholder="Eslatma turini tanlang"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">Xabar</label>
              <UTextarea
                v-model="reminderDetails.message"
                placeholder="Eslatma xabarini kiriting"
                rows="5"
                class="w-full"
              />
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              label="Bekor qilish"
              variant="outline"
              @click="showReminderDialog = false"
            />
            <UButton
              label="Eslatma yuborish"
              :loading="isSendingReminder"
              @click="confirmSendReminder"
            />
          </div>
        </template>
      </UModal>

      <!-- Contact Modal -->
      <UModal
        v-model:open="contactDialog"
        :title="
          isEditMode ? 'Aloqa ma`lumotlarini tahrirlash' : 'Aloqa qo`shish'
        "
        :description="
          isEditMode
            ? 'Mavjud aloqa ma`lumotlarini tahrirlash'
            : 'To`lov uchun aloqa ma`lumotlarini kiritish'
        "
      >
        <template #body>
          <div v-if="selectedDebitor" class="space-y-4">
            <div
              class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <UAvatar :alt="selectedDebitor.student_name" size="md">
                <template #fallback>
                  {{ getInitials(selectedDebitor.student_name || "") }}
                </template>
              </UAvatar>
              <div>
                <h3 class="font-medium text-lg">
                  {{ selectedDebitor.student_name }}
                </h3>
                <p class="text-sm text-gray-500">
                  Qarz summasi: {{ formatCurrency(selectedDebitor.amount) }}
                </p>
                <p class="text-sm text-gray-500">
                  Kechikish: {{ selectedDebitor.days_overdue }} kun
                </p>
              </div>
            </div>

            <!-- Show existing action info in edit mode -->
            <div
              v-if="isEditMode && selectedAction"
              class="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg space-y-1"
            >
              <h4 class="font-medium mb-2">Mavjud aloqa ma'lumoti:</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                <span class="font-medium">Manager:</span>
                {{ selectedAction.manager?.first_name }}
                {{ selectedAction.manager?.last_name }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                <span class="font-medium">Yaratilgan:</span>
                {{ formatDate(selectedAction.createdAt) }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                <span class="font-medium">Oxirgi yangilanish:</span>
                {{ formatDate(selectedAction.updatedAt) }}
              </p>
            </div>

            <form @submit.prevent="submitContactAction" class="space-y-4">
              <div class="space-y-2">
                <label class="block text-sm font-medium">
                  Aloqa turi
                  <span class="text-red-500">*</span>
                </label>
                <USelectMenu
                  v-model="contactForm.action_type"
                  :items="contactTypeOptions"
                  value-key="value"
                  placeholder="Aloqa turini tanlang"
                />
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-medium">
                  Bosqich
                  <span class="text-red-500">*</span>
                </label>
                <USelectMenu
                  v-model="contactForm.stage"
                  :items="stageOptions"
                  value-key="value"
                  placeholder="Bosqichni tanlang"
                />
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-medium">
                  Xabar
                  <span class="text-red-500">*</span>
                </label>
                <UTextarea
                  v-model="contactForm.message"
                  placeholder="Aloqa xabarini kiriting..."
                  rows="4"
                  required
                  class="w-full"
                />
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-medium">
                  Keyingi aloqa sanasi
                  <span class="text-red-500">*</span>
                </label>
                <UInput
                  v-model="contactForm.next_action_date"
                  type="datetime-local"
                  required
                />
              </div>
            </form>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              label="Bekor qilish"
              variant="outline"
              :disabled="isSubmittingContact"
              @click="contactDialog = false"
            />
            <UButton
              :label="isEditMode ? 'Yangilash' : 'Saqlash'"
              :loading="isSubmittingContact"
              @click="submitContactAction"
            />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import { useSMS } from "~/composables/useSMS";
import { h, resolveComponent } from "vue";

definePageMeta({
  middleware: ["auth"],
});

const { apiService, auth } = useAuth();
const toast = useToast();
const router = useRouter();
const route = useRoute();

// Resolve components for render functions
const UAvatar = resolveComponent("UAvatar");
const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdown = resolveComponent("UDropdown");

// State variables
const debitors = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const daysFilter = ref("all");
const currentPage = ref(1);
const itemsPerPage = 10;
const totalItems = ref(0);
const showPaymentDialog = ref(false);
const showReminderDialog = ref(false);
const isProcessingPayment = ref(false);
const isSendingReminder = ref(false);

// Payment form details
const paymentDetails = reactive({
  amount: 0,
  method: "Naqd",
  notes: "",
});

// Reminder form details
const reminderDetails = reactive({
  type: "sms",
  message: "",
});

// Contact form state
const contactDialog = ref(false);
const isSubmittingContact = ref(false);
const contactActions = ref<Record<string, any[]>>({});
const selectedAction = ref<any | null>(null);
const isEditMode = ref(false);
const selectedDebitor = ref<any | null>(null);
const contactForm = reactive({
  action_type: "sms" as "sms" | "phone" | "telegram" | "in_person",
  stage: "debitor" as "upcoming" | "debitor",
  message: "",
  next_action_date: "",
});

// Options
const paymentMethodOptions = [
  { value: "Naqd", label: "Naqd" },
  { value: "Karta", label: "Karta" },
  { value: "Bank", label: "Bank o'tkazmasi" },
];

const reminderTypeOptions = [{ value: "sms", label: "SMS" }];

const contactTypeOptions = [
  { value: "sms", label: "SMS" },
  { value: "phone", label: "Telefon" },
  { value: "telegram", label: "Telegram" },
  { value: "in_person", label: "Yuzma-yuz" },
];

const stageOptions = [
  { value: "upcoming", label: "Kelayotgan" },
  { value: "debitor", label: "Qarzdor" },
];

// Table columns
const columns = [
  {
    accessorKey: "student_name",
    header: "Talaba",
    cell: ({ row }: { row: any }) => {
      return h("div", { class: "flex items-center gap-2" }, [
        h(
          UAvatar,
          {
            alt: row.original.student_name,
            size: "xs",
          },
          {
            fallback: () => getInitials(row.original.student_name || ""),
          },
        ),
        h("span", { class: "font-medium" }, row.original.student_name),
      ]);
    },
  },
  {
    accessorKey: "amount",
    header: "Qarz miqdori",
    cell: ({ row }: { row: any }) => formatCurrency(row.original.amount),
  },
  {
    accessorKey: "payment_date",
    header: "To'lov sanasi",
    cell: ({ row }: { row: any }) => formatDate(row.original.payment_date),
  },
  {
    accessorKey: "next_payment_date",
    header: "Keyingi to'lov",
    cell: ({ row }: { row: any }) => formatDate(row.original.next_payment_date),
  },
  {
    accessorKey: "days_overdue",
    header: "Kechikish kunlari",
    cell: ({ row }: { row: any }) => {
      const days = row.original.days_overdue;
      const color =
        days <= 7
          ? "amber"
          : days <= 14
            ? "orange"
            : days <= 30
              ? "red"
              : "gray";
      return h(UBadge, { color, variant: "subtle" }, () => `${days} kun`);
    },
  },
  {
    accessorKey: "notes",
    header: "Izohlar",
    cell: ({ row }: { row: any }) =>
      h(
        "span",
        { class: "max-w-[200px] truncate block" },
        row.original.notes || "Izoh yo'q",
      ),
  },
  {
    id: "contact",
    header: "Aloqa",
    cell: ({ row }: { row: any }) => {
      const paymentId = String(row.original.id);
      const hasContact: boolean = !!(contactStatus.value[paymentId] || false);
      return h(UButton, {
        icon: hasContact ? "i-lucide-check-circle" : "i-lucide-plus-circle",
        color: hasContact ? "green" : "gray",
        variant: "ghost",
        size: "sm",
        onClick: () => openContactModal(row.original),
      });
    },
  },
  {
    id: "actions",
    header: "Harakatlar",
    cell: ({ row }: { row: any }) => {
      return h(UButton, {
        icon: "i-lucide-mail",
        variant: "ghost",
        size: "sm",
        onClick: () => sendReminder(row.original),
      });
    },
  },
];

// Computed properties
const contactStatus = computed(() => {
  const status: Record<string, boolean> = {};
  Object.keys(contactActions.value).forEach((paymentId) => {
    const actions = contactActions.value[paymentId];
    const hasActions: boolean = !!(
      actions &&
      Array.isArray(actions) &&
      actions.length > 0
    );
    status[paymentId] = hasActions;
    status[String(paymentId)] = hasActions;
  });
  return status;
});

const debitorCount = computed(() => debitors.value.length);

const totalOverdueAmount = computed(() => {
  return debitors.value.reduce((sum, debitor) => sum + debitor.amount, 0);
});

const averageDaysOverdue = computed(() => {
  if (debitors.value.length === 0) return 0;

  const totalDays = debitors.value.reduce(
    (sum, debitor) => sum + debitor.days_overdue,
    0,
  );
  return Math.round(totalDays / debitors.value.length);
});

const filteredDebitors = computed(() => {
  return debitors.value.filter((debitor) => {
    const nameMatch = debitor.student_name
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase());

    return nameMatch;
  });
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredDebitors.value.length / itemsPerPage));
});

const paginatedDebitors = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredDebitors.value.slice(startIndex, endIndex);
});

const paginationStart = computed(() => {
  return filteredDebitors.value.length === 0
    ? 0
    : (currentPage.value - 1) * itemsPerPage + 1;
});

const paginationEnd = computed(() => {
  return Math.min(
    currentPage.value * itemsPerPage,
    filteredDebitors.value.length,
  );
});

// Methods
const loadContactStatuses = async () => {
  if (!debitors.value.length) return;

  const { checkPaymentContact } = useSMS();
  const actions: Record<string, any[]> = {};

  try {
    await Promise.all(
      debitors.value.map(async (debitor) => {
        const contacts = await checkPaymentContact(debitor.id);
        const contactList = contacts || [];
        actions[String(debitor.id)] = contactList;
      }),
    );
    contactActions.value = actions;
  } catch (error) {
    console.error("Failed to load contact statuses:", error);
  }
};

const openContactModal = (debitor: any) => {
  selectedDebitor.value = debitor;

  const existingActions = contactActions.value[String(debitor.id)];

  if (existingActions && existingActions.length > 0) {
    isEditMode.value = true;
    const latestAction = existingActions[0];
    selectedAction.value = latestAction;

    contactForm.action_type = latestAction.action_type;
    contactForm.stage = latestAction.stage;
    contactForm.message = latestAction.message;
    contactForm.next_action_date = latestAction.next_action_date;
  } else {
    isEditMode.value = false;
    selectedAction.value = null;

    contactForm.action_type = "sms";
    contactForm.stage = "debitor";
    contactForm.message = "";

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    contactForm.next_action_date = tomorrow.toISOString().slice(0, 16);
  }

  contactDialog.value = true;
};

const submitContactAction = async () => {
  if (!selectedDebitor.value) return;

  isSubmittingContact.value = true;

  try {
    const { createPaymentAction } = useSMS();

    const managerId = auth.value.user?.id;
    if (!managerId) {
      throw new Error("Manager ID not found");
    }

    await createPaymentAction({
      payment_id: selectedDebitor.value.id,
      manager_id: managerId,
      stage: contactForm.stage,
      action_type: contactForm.action_type,
      message: contactForm.message,
      next_action_date: contactForm.next_action_date,
    });

    toast.add({
      title: "Muvaffaqiyat",
      description: "Aloqa ma'lumoti muvaffaqiyatli saqlandi",
      color: "success",
    });

    contactDialog.value = false;
    await fetchDebitors();
  } catch (error) {
    console.error("Failed to save contact action:", error);
    toast.add({
      title: "Xatolik",
      description: "Aloqa ma'lumotini saqlashda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isSubmittingContact.value = false;
  }
};

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const fetchDebitors = async () => {
  loading.value = true;
  try {
    const response = await api.get<{ count: number; payments: any[] }>(
      apiService.value,
      "/student-payments/due-payments/check",
    );

    debitors.value = response.payments || [];
    totalItems.value = response.count || 0;
    await loadContactStatuses();
  } catch (error) {
    console.error("Failed to fetch debitor data:", error);
    toast.add({
      title: "Xatolik",
      description: "Qarzdor talabalar ma'lumotlarini yuklashda xatolik",
      color: "error",
    });
    debitors.value = [];
    totalItems.value = 0;
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("uz-UZ");
};

const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("uz-UZ", {
    style: "currency",
    currency: "UZS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

const refreshData = () => {
  fetchDebitors();
};

const confirmPayment = async () => {
  if (!selectedDebitor.value) return;

  isProcessingPayment.value = true;
  try {
    await api.post(
      apiService.value,
      `/student-payments/${selectedDebitor.value.id}/record-payment`,
      {
        amount: paymentDetails.amount,
        payment_method: paymentDetails.method,
        notes: paymentDetails.notes,
      },
    );

    debitors.value = debitors.value.filter(
      (d) => d.id !== selectedDebitor.value?.id,
    );

    toast.add({
      title: "Muvaffaqiyat",
      description: `To'lov ${selectedDebitor.value.student_name} uchun qayd qilindi`,
      color: "success",
    });

    showPaymentDialog.value = false;
  } catch (error) {
    console.error("Failed to record payment:", error);
    toast.add({
      title: "Xatolik",
      description: "To'lovni qayd qilishda xatolik",
      color: "error",
    });
  } finally {
    isProcessingPayment.value = false;
  }
};

const sendReminder = (debitor: any) => {
  selectedDebitor.value = debitor;

  const formatCurrencyForSMS = (amount: number): string => {
    return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
  };

  const amount = formatCurrencyForSMS(debitor.amount);
  const daysText = debitor.days_overdue === 1 ? "kun" : "kun";

  reminderDetails.message = `Hurmatli ${debitor.student_name}, Sizning ${amount} miqdoridagi to'lovingiz ${debitor.days_overdue} ${daysText} ga kechikkan. Iltimos, imkon qadar tezroq to'lovni amalga oshiring. Impulse Study LC`;
  showReminderDialog.value = true;
};

const confirmSendReminder = async () => {
  if (!selectedDebitor.value) return;

  isSendingReminder.value = true;
  try {
    if (reminderDetails.type === "sms") {
      const { sendSMS } = useSMS();

      const phoneNumber =
        selectedDebitor.value.student_phone ||
        selectedDebitor.value.student?.phone ||
        selectedDebitor.value.phone;
      if (!phoneNumber) {
        throw new Error("Talabaning telefon raqami mavjud emas");
      }

      await sendSMS({
        mobile_phone: phoneNumber,
        message: reminderDetails.message || "To'lov eslatmasi",
      });

      toast.add({
        title: "Muvaffaqiyat",
        description: "SMS muvaffaqiyatli yuborildi",
        color: "success",
      });
    }

    showReminderDialog.value = false;
  } catch (error) {
    console.error("Failed to send reminder:", error);
    toast.add({
      title: "Xatolik",
      description: "Eslatma yuborishda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isSendingReminder.value = false;
  }
};

const exportToCSV = () => {
  const headers = [
    "Student Name",
    "Amount Due",
    "Payment Date",
    "Days Overdue",
    "Notes",
  ];
  const rows = filteredDebitors.value.map((debitor) => [
    debitor.student_name,
    debitor.amount,
    formatDate(debitor.payment_date),
    debitor.days_overdue,
    debitor.notes || "",
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
    `debitor-students-${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.add({
    title: "Muvaffaqiyat",
    description: `${filteredDebitors.value.length} ta qarzdor ma'lumoti eksport qilindi`,
    color: "success",
  });
};

// Initialize data on component mount
onMounted(() => {
  if (route.query.page) {
    currentPage.value = parseInt(route.query.page as string, 10);
  }

  if (route.query.search) {
    searchQuery.value = route.query.search as string;
  }

  fetchDebitors();
});

// Watch for filter changes
watch([searchQuery], () => {
  currentPage.value = 1;
});
</script>
