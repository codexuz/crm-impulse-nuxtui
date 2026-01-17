<template>
  <UDashboardPanel id="upcoming-payments">
    <template #header>
      <UDashboardNavbar title="Kelayotgan to'lovlar" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          Yaqin kunlarda kutilayotgan to'lovlarni kuzatish
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
      <div>
        <!-- Filters Section -->
        <UDashboardToolbar>
          <template #left>
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Talabalarni qidirish..."
              class="w-64"
            />
          </template>

          <template #right>
            <USelectMenu
              v-model="selectedDays"
              :items="daysOptions"
              value-key="value"
              placeholder="Kunlar"
              class="w-40"
            >
              <template #label>
                {{
                  daysOptions.find((d) => d.value === selectedDays)?.label ||
                  "Kunlar"
                }}
              </template>
            </USelectMenu>
          </template>
        </UDashboardToolbar>

        <!-- Upcoming Payments Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Kelayotgan to'lovlar</h3>
          </template>

          <UTable
            :data="filteredPayments"
            :columns="columns"
            :loading="isLoading"
            :empty="'Kelayotgan to\'lovlar topilmadi'"
          />

          <template #footer>
            <div class="text-sm text-gray-500">
              Jami
              <span class="font-medium">{{ filteredPayments.length }}</span>
              to'lov topildi
            </div>
          </template>
        </UCard>
      </div>

      <!-- Record Payment Modal -->
      <UModal
        v-model:open="recordDialog"
        title="To'lovni qayd qilish"
        description="Ushbu talaba uchun yangi to'lovni qayd qilish"
      >
        <template #body>
          <form
            v-if="selectedPayment"
            @submit.prevent="submitPayment"
            class="space-y-4"
          >
            <div
              class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <UAvatar
                :alt="`${selectedPayment.student?.first_name} ${selectedPayment.student?.last_name}`"
                size="md"
              >
                <template #fallback>
                  {{
                    getInitials(
                      selectedPayment.student?.first_name || "",
                      selectedPayment.student?.last_name || "",
                    )
                  }}
                </template>
              </UAvatar>
              <div>
                <h3 class="font-medium">
                  {{ selectedPayment.student?.first_name }}
                  {{ selectedPayment.student?.last_name }}
                </h3>
                <p class="text-sm text-gray-500">
                  Muddat: {{ formatDate(selectedPayment.next_payment_date) }}
                </p>
              </div>
            </div>

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
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">
                To'lov usuli
                <span class="text-red-500">*</span>
              </label>
              <USelectMenu
                v-model="newPayment.payment_method"
                :items="paymentMethodOptions"
                value-key="value"
                placeholder="Usulni tanlang"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">
                To'lov sanasi
                <span class="text-red-500">*</span>
              </label>
              <UInput v-model="newPayment.payment_date" type="date" required />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">
                Keyingi to'lov sanasi
                <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="newPayment.next_payment_date"
                type="date"
                required
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">Izohlar</label>
              <UTextarea
                v-model="newPayment.notes"
                placeholder="To'lov tafsilotlari"
                class="w-full"
                rows="3"
              />
            </div>
          </form>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              label="Bekor qilish"
              variant="outline"
              @click="recordDialog = false"
            />
            <UButton
              label="To'lovni qayd qilish"
              :loading="isSubmitting"
              @click="submitPayment"
            />
          </div>
        </template>
      </UModal>

      <!-- Extend Due Date Modal -->
      <UModal
        v-model:open="extendDialog"
        title="Muddatni uzaytirish"
        description="Ushbu talaba uchun to'lov muddatini o'zgartirish"
      >
        <template #body>
          <form
            v-if="selectedPayment"
            @submit.prevent="submitExtension"
            class="space-y-4"
          >
            <div
              class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <UAvatar
                :alt="`${selectedPayment.student?.first_name} ${selectedPayment.student?.last_name}`"
                size="md"
              >
                <template #fallback>
                  {{
                    getInitials(
                      selectedPayment.student?.first_name || "",
                      selectedPayment.student?.last_name || "",
                    )
                  }}
                </template>
              </UAvatar>
              <div>
                <h3 class="font-medium">
                  {{ selectedPayment.student?.first_name }}
                  {{ selectedPayment.student?.last_name }}
                </h3>
                <p class="text-sm text-gray-500">
                  Hozirgi muddat:
                  {{ formatDate(selectedPayment.next_payment_date) }}
                </p>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">
                Yangi muddat
                <span class="text-red-500">*</span>
              </label>
              <UInput v-model="extendedDate" type="date" required />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">Sabab</label>
              <UTextarea
                v-model="extensionReason"
                placeholder="Uzaytirilish sababi"
                class="w-full"
                rows="3"
              />
            </div>
          </form>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              label="Bekor qilish"
              variant="outline"
              @click="extendDialog = false"
            />
            <UButton
              label="Muddatni uzaytirish"
              :loading="isSubmitting"
              @click="submitExtension"
            />
          </div>
        </template>
      </UModal>

      <!-- Reminder Modal -->
      <UModal
        v-model:open="reminderDialog"
        title="To'lov eslatmasi yuborish"
        description="Talabaga kelayotgan to'lov haqida xabar berish"
      >
        <template #body>
          <div v-if="selectedPayment" class="space-y-4">
            <div
              class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <UAvatar
                :alt="`${selectedPayment.student?.first_name} ${selectedPayment.student?.last_name}`"
                size="md"
              >
                <template #fallback>
                  {{
                    getInitials(
                      selectedPayment.student?.first_name || "",
                      selectedPayment.student?.last_name || "",
                    )
                  }}
                </template>
              </UAvatar>
              <div>
                <h3 class="font-medium">
                  {{ selectedPayment.student?.first_name }}
                  {{ selectedPayment.student?.last_name }}
                </h3>
                <p class="text-sm text-gray-500">
                  {{ selectedPayment.student?.phone }}
                </p>
              </div>
            </div>

            <div class="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
              <p class="text-sm">
                To'lov eslatmasi: muddat
                <span class="font-medium">{{
                  formatDate(selectedPayment.next_payment_date)
                }}</span>
                ({{ getDaysLeft(selectedPayment.next_payment_date) }} kun qoldi)
              </p>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium">Xabar</label>
              <UTextarea
                v-model="reminderMessage"
                placeholder="Maxsus xabar (ixtiyoriy)"
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
              @click="reminderDialog = false"
            />
            <UButton
              label="Eslatma yuborish"
              :loading="isSubmitting"
              @click="sendReminderNotification"
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
          <div v-if="selectedPayment" class="space-y-4">
            <div
              class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
            >
              <UAvatar
                :alt="`${selectedPayment.student?.first_name} ${selectedPayment.student?.last_name}`"
                size="md"
              >
                <template #fallback>
                  {{
                    getInitials(
                      selectedPayment.student?.first_name || "",
                      selectedPayment.student?.last_name || "",
                    )
                  }}
                </template>
              </UAvatar>
              <div>
                <h3 class="font-medium">
                  {{ selectedPayment.student?.first_name }}
                  {{ selectedPayment.student?.last_name }}
                </h3>
                <p class="text-sm text-gray-500">
                  To'lov summasi: {{ formatCurrency(selectedPayment.amount) }}
                </p>
                <p class="text-sm text-gray-500">
                  Muddat: {{ formatDate(selectedPayment.next_payment_date) }}
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
import { h } from "vue";

const { apiService, auth } = useAuth();
const toast = useToast();
const router = useRouter();
const route = useRoute();

// Resolve components for render functions
const UAvatar = resolveComponent("UAvatar");
const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdown = resolveComponent("UDropdown");

// State
const upcomingPayments = ref<any[]>([]);
const search = ref("");
const selectedDays = ref("1");
const isLoading = ref(true);
const selectedPayment = ref<any | null>(null);

// Dialog controls
const recordDialog = ref(false);
const extendDialog = ref(false);
const reminderDialog = ref(false);
const contactDialog = ref(false);
const isSubmitting = ref(false);
const isSubmittingContact = ref(false);

// Form state
const newPayment = reactive({
  student_id: "",
  amount: 0,
  status: "completed" as "completed" | "pending" | "failed",
  payment_method: "Naqd" as "Naqd" | "Karta" | "Click" | "Payme",
  payment_date: new Date().toISOString().split("T")[0],
  next_payment_date: "",
  notes: "",
});

const extendedDate = ref("");
const extensionReason = ref("");
const reminderMessage = ref("");

// Contact form state
const contactActions = ref<Record<string, any[]>>({});
const selectedAction = ref<any | null>(null);
const isEditMode = ref(false);
const contactForm = reactive({
  action_type: "sms" as "sms" | "phone" | "telegram" | "in_person",
  stage: "upcoming" as "upcoming" | "debitor",
  message: "",
  next_action_date: "",
});

// Options
const daysOptions = [
  { value: "1", label: "Keyingi 1 kun" },
  { value: "3", label: "Keyingi 3 kun" },
  { value: "7", label: "Keyingi 7 kun" },
  { value: "14", label: "Keyingi 14 kun" },
  { value: "30", label: "Keyingi 30 kun" },
];

const paymentMethodOptions = [
  { value: "Naqd", label: "Naqd" },
  { value: "Karta", label: "Karta" },
  { value: "Click", label: "Click" },
  { value: "Payme", label: "Payme" },
];

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
    accessorKey: "student",
    header: "Talaba",
    cell: ({ row }: { row: any }) => {
      return h("div", { class: "flex items-center gap-2" }, [
        h(
          UAvatar,
          {
            alt: `${row.original.student?.first_name} ${row.original.student?.last_name}`,
            size: "xs",
          },
          {
            fallback: () =>
              getInitials(
                row.original.student?.first_name || "",
                row.original.student?.last_name || "",
              ),
          },
        ),
        h(
          "span",
          { class: "font-medium" },
          `${row.original.student?.first_name} ${row.original.student?.last_name}`,
        ),
      ]);
    },
  },
  {
    accessorKey: "amount",
    header: "Summa",
    cell: ({ row }: { row: any }) => formatCurrency(row.original.amount),
  },
  {
    accessorKey: "payment_date",
    header: "Oxirgi to'lov",
    cell: ({ row }: { row: any }) => formatDate(row.original.payment_date),
  },
  {
    accessorKey: "next_payment_date",
    header: "Muddat",
    cell: ({ row }: { row: any }) => {
      return h(
        UBadge,
        {
          color:
            getDaysLeft(row.original.next_payment_date) <= 3 ? "red" : "gray",
          variant: "subtle",
        },
        () => formatDate(row.original.next_payment_date),
      );
    },
  },
  {
    accessorKey: "next_payment_date",
    header: "Qolgan kunlar",
    id: "days_left",
    cell: ({ row }: { row: any }) => {
      return h(
        UBadge,
        {
          color:
            getDaysLeft(row.original.next_payment_date) <= 3 ? "red" : "gray",
          variant: "outline",
        },
        () => `${getDaysLeft(row.original.next_payment_date)} kun`,
      );
    },
  },
  {
    id: "contact",
    header: "Aloqa",
    cell: ({ row }: { row: any }) => {
      const paymentId = String(row.original.id);
      const hasContact = contactStatus.value[paymentId] || false;
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
    header: "Amallar",
    cell: ({ row }: { row: any }) => {
      return h("div", { class: "flex items-center gap-1" }, [
        h(UButton, {
          icon: "i-lucide-bell",
          variant: "ghost",
          size: "sm",
          onClick: () => sendReminder(row.original),
        }),
        h(
          UDropdown,
          {
            items: getActionItems(row.original),
          },
          {
            default: () =>
              h(UButton, {
                icon: "i-lucide-more-vertical",
                variant: "ghost",
                size: "sm",
              }),
          },
        ),
      ]);
    },
  },
];

// Computed
const contactStatus = computed(() => {
  const status: Record<string, boolean> = {};
  Object.keys(contactActions.value).forEach((paymentId) => {
    const actions = contactActions.value[paymentId];
    const hasActions: boolean = !!(
      actions &&
      Array.isArray(actions) &&
      actions.length > 0
    );
    // Store with both string and number keys for safety
    status[paymentId] = hasActions;
    status[String(paymentId)] = hasActions;
  });
  return status;
});

const filteredPayments = computed(() => {
  if (!upcomingPayments.value) return [];

  let result = [...upcomingPayments.value];

  // Apply search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    result = result.filter(
      (payment) =>
        payment.student?.first_name?.toLowerCase().includes(searchLower) ||
        payment.student?.last_name?.toLowerCase().includes(searchLower) ||
        payment.amount.toString().includes(search.value),
    );
  }

  // Sort by closest due date first
  result.sort((a, b) => {
    const dateA = new Date(a.next_payment_date).getTime();
    const dateB = new Date(b.next_payment_date).getTime();
    return dateA - dateB;
  });

  return result;
});

// Methods
const loadContactStatuses = async () => {
  if (!upcomingPayments.value.length) return;

  const { checkPaymentContact } = useSMS();
  const actions: Record<string, any[]> = {};

  try {
    await Promise.all(
      upcomingPayments.value.map(async (payment) => {
        const contacts = await checkPaymentContact(payment.id);
        const contactList = contacts || [];
        // Store with string key for consistent lookup
        actions[String(payment.id)] = contactList;
        console.log(
          `Payment ${payment.id} has ${contactList.length} contacts:`,
          contactList,
        );
      }),
    );
    contactActions.value = actions;
    console.log("Contact actions loaded:", contactActions.value);
  } catch (error) {
    console.error("Failed to load contact statuses:", error);
  }
};

const loadUpcomingPayments = async () => {
  isLoading.value = true;
  try {
    const response = await api.get<any[]>(
      apiService.value,
      `/student-payments/upcoming?days=${selectedDays.value}`,
    );

    if (Array.isArray(response)) {
      upcomingPayments.value = response;
      await loadContactStatuses();
    } else {
      upcomingPayments.value = [];
      toast.add({
        title: "Ogohlantirish",
        description: "Kelayotgan to'lovlar topilmadi",
        color: "warning",
      });
    }
  } catch (error) {
    console.error("Failed to load upcoming payments:", error);
    toast.add({
      title: "Xatolik",
      description: "Kelayotgan to'lovlarni yuklashda xatolik",
      color: "error",
    });
    upcomingPayments.value = [];
  } finally {
    isLoading.value = false;
  }
};

const refreshData = () => {
  loadUpcomingPayments();
};

const openContactModal = (payment: any) => {
  selectedPayment.value = payment;

  const existingActions = contactActions.value[String(payment.id)];
  console.log(
    `Opening contact modal for payment ${payment.id}, existing actions:`,
    existingActions,
  );

  if (existingActions && existingActions.length > 0) {
    // Edit mode - load existing action data
    isEditMode.value = true;
    const latestAction = existingActions[0];
    selectedAction.value = latestAction;

    // Pre-fill form with existing data
    contactForm.action_type = latestAction.action_type;
    contactForm.stage = latestAction.stage;
    contactForm.message = latestAction.message;
    contactForm.next_action_date = latestAction.next_action_date;
  } else {
    // Create mode - reset form
    isEditMode.value = false;
    selectedAction.value = null;

    contactForm.action_type = "sms";
    contactForm.stage = "upcoming";
    contactForm.message = "";

    // Set default next action date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    contactForm.next_action_date = tomorrow.toISOString().slice(0, 16);
  }

  contactDialog.value = true;
};

const submitContactAction = async () => {
  if (!selectedPayment.value) return;

  isSubmittingContact.value = true;

  try {
    const { createPaymentAction } = useSMS();

    const managerId = auth.value.user?.id;
    if (!managerId) {
      throw new Error("Manager ID not found");
    }

    await createPaymentAction({
      payment_id: selectedPayment.value.id,
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
    await loadUpcomingPayments();
  } catch (error) {
    console.error("Failed to create contact action:", error);
    toast.add({
      title: "Xatolik",
      description: "Aloqa ma'lumotini saqlashda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isSubmittingContact.value = false;
  }
};

const submitPayment = async () => {
  if (!selectedPayment.value) return;

  isSubmitting.value = true;
  try {
    await api.post<any>(apiService.value, "/student-payments", newPayment);

    toast.add({
      title: "Muvaffaqiyat",
      description: "To'lov muvaffaqiyatli qayd qilindi",
      color: "success",
    });

    recordDialog.value = false;
    loadUpcomingPayments();
  } catch (error) {
    console.error("Failed to record payment:", error);
    toast.add({
      title: "Xatolik",
      description: "To'lovni qayd qilishda xatolik",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const extendDueDate = (payment: any) => {
  selectedPayment.value = payment;

  // Pre-fill with a date 7 days later than current due date
  const currentDueDate = new Date(payment.next_payment_date);
  currentDueDate.setDate(currentDueDate.getDate() + 7);
  extendedDate.value = currentDueDate.toISOString().split("T")[0] || "";
  extensionReason.value = "";

  extendDialog.value = true;
};

const submitExtension = async () => {
  if (!selectedPayment.value) return;

  isSubmitting.value = true;
  try {
    await api.patch<any>(
      apiService.value,
      `/student-payments/${selectedPayment.value.id}`,
      {
        next_payment_date: extendedDate.value,
        notes: extensionReason.value
          ? `Due date extended: ${extensionReason.value}`
          : selectedPayment.value.notes || "",
      },
    );

    toast.add({
      title: "Muvaffaqiyat",
      description: "Muddat muvaffaqiyatli uzaytirildi",
      color: "success",
    });

    extendDialog.value = false;
    loadUpcomingPayments();
  } catch (error) {
    console.error("Failed to extend due date:", error);
    toast.add({
      title: "Xatolik",
      description: "Muddatni uzaytirishda xatolik",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const sendReminder = (payment: any) => {
  selectedPayment.value = payment;

  // Pre-fill reminder message
  const formatCurrencyForSMS = (amount: number): string => {
    return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
  };

  const formatDateForSMS = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const fullName = `${payment.student?.first_name || ""} ${
    payment.student?.last_name || ""
  }`.trim();
  const amount = formatCurrencyForSMS(payment.amount);
  const dueDate = formatDateForSMS(payment.next_payment_date);
  reminderMessage.value = `Hurmatli ${fullName}, ${amount} miqdorida to'lovingiz ${dueDate} sanasida muddati tugaydi. O'z vaqtida to'lov qilishingizni so'raymiz. Impulse Study LC`;

  reminderDialog.value = true;
};

const sendReminderNotification = async () => {
  if (!selectedPayment.value) return;

  isSubmitting.value = true;
  try {
    const { sendSMS } = useSMS();

    const phoneNumber = selectedPayment.value.student?.phone;
    if (!phoneNumber) {
      throw new Error("Talabaning telefon raqami mavjud emas");
    }

    await sendSMS({
      mobile_phone: phoneNumber,
      message: reminderMessage.value || "To'lov eslatmasi",
    });

    toast.add({
      title: "Muvaffaqiyat",
      description: "SMS muvaffaqiyatli yuborildi",
      color: "success",
    });

    reminderDialog.value = false;
  } catch (error) {
    console.error("Failed to send reminder:", error);
    toast.add({
      title: "Xatolik",
      description: "Eslatma yuborishda xatolik",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const viewPaymentHistory = (payment: any) => {
  router.push({
    path: "/payments",
    query: {
      search: `${payment.student?.first_name}`,
    },
  });
};

const getActionItems = (payment: any) => [
  [
    {
      label: "To'lovlar tarixini ko'rish",
      icon: "i-lucide-history",
      click: () => viewPaymentHistory(payment),
    },
    {
      label: "Muddatni uzaytirish",
      icon: "i-lucide-calendar-plus",
      click: () => extendDueDate(payment),
    },
  ],
];

// Helper functions
const getDaysLeft = (dateString: string): number => {
  if (!dateString) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(dateString);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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

// Load data on component mount
onMounted(() => {
  if (route.query.days) {
    selectedDays.value = route.query.days as string;
  }

  loadUpcomingPayments();
});

// Watch for changes in selected days to reload data
watch(selectedDays, (newVal) => {
  router.push({
    query: {
      ...route.query,
      days: newVal,
    },
  });
  loadUpcomingPayments();
});
</script>
