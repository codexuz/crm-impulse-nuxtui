<template>
  <UDashboardPanel id="send-sms">
    <template #header>
      <UDashboardNavbar title="SMS Jo'natmalar">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          SMS xabarlarni jo'nating va jo'natilgan xabarlar tarixini ko'ring
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Messages History -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <Icon name="lucide:history" class="h-5 w-5" />
              <h3 class="text-base font-semibold">
                Jo'natilgan xabarlar tarixi
              </h3>
            </div>
          </template>

          <!-- Date Filter -->
          <div class="mb-6">
            <form @submit.prevent="searchMessages" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <UFormField  label="Boshlanish sanasi" required>
                    <UInput
                      type="datetime-local"
                      v-model="messageFilters.start_date"
                      required
                    />
                  </UFormField>
                </div>
                <div>
                  <UFormField  label="Tugash sanasi" required>
                    <UInput
                      type="datetime-local"
                      v-model="messageFilters.end_date"
                      required
                    />
                  </UFormField>
                </div>
                <div>
                  <UFormField  label="Holat">
                    <USelectMenu
                      v-model="messageFilters.status"
                      :items="statusOptions"
                      value-key="value"
                      placeholder="Holatni tanlang"
                    >
                      <template #label>
                        {{
                          statusOptions.find(
                            (s) => s.value === messageFilters.status,
                          )?.label || "Holatni tanlang"
                        }}
                      </template>
                    </USelectMenu>
                  </UFormField>
                </div>
              </div>

              <UButton
                type="submit"
                :loading="isLoadingMessages"
                :label="
                  isLoadingMessages ? 'Yuklanmoqda...' : 'Xabarlarni yuklash'
                "
              />
            </form>
          </div>

          <!-- Messages Table -->
          <UTable
            :loading="isLoadingMessages"
            :columns="columns"
            :data="userMessages"
            :empty="'Hech qanday xabar topilmadi'"
          />

          <!-- Pagination -->
          <div
            v-if="totalPages > 1"
            class="flex items-center justify-between mt-4 pt-4 border-t"
          >
            <div class="text-sm text-gray-500">
              <span class="font-medium">{{ paginationStart }}</span> dan
              <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
              <span class="font-medium">{{ totalMessages }}</span> xabar
            </div>

            <UPagination
              :model-value="currentPage"
              :total="totalMessages"
              :items-per-page="pageSize"
              show-last
              show-first
              @update:page="(p: number) => (currentPage = p)"
            />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, h } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { useSMS } from "~/composables/useSMS";

definePageMeta({
  middleware: ["auth"],
});

const UBadge = resolveComponent("UBadge");

const toast = useToast();

// State
const templates = ref<any[]>([]);
const userMessages = ref<any[]>([]);
const isLoadingMessages = ref(false);

// Pagination state
const currentPage = ref(1);
const pageSize = ref(20);
const totalPages = ref(1);
const totalMessages = ref(0);

// Forms
const smsForm = reactive({
  mobile_phone: "",
  message: "",
});

const messageFilters = reactive({
  start_date: "",
  end_date: "",
  status: "all",
});

const statusOptions = [
  { label: "Barchasi", value: "all" },
  { label: "Yetkazilgan", value: "delivered" },
  { label: "Muvaffaqiyatsiz", value: "rejected" },
];

// Table columns
const columns: TableColumn<any>[] = [
  {
    accessorKey: "to",
    header: "Telefon raqami",
    cell: ({ row }) =>
      h("div", { class: "font-medium" }, `+${row.original.to}`),
  },
  {
    accessorKey: "message",
    header: "Xabar",
    cell: ({ row }) =>
      h(
        "div",
        {
          class: "max-w-md text-sm break-words whitespace-normal line-clamp-3",
        },
        row.original.message,
      ),
  },
  {
    accessorKey: "total_price",
    header: "Xarajat",
    cell: ({ row }) =>
      h(
        "div",
        { class: "font-medium" },
        formatCurrency(row.original.total_price),
      ),
  },
  {
    accessorKey: "status",
    header: "Holat",
    cell: ({ row }) =>
      h(UBadge, {
        label: getStatusText(row.original.status),
        color: getStatusColor(row.original.status),
      }),
  },
  {
    accessorKey: "sent_at",
    header: "Sana",
    cell: ({ row }) =>
      h(
        "div",
        { class: "text-sm text-gray-500" },
        formatDate(row.original.sent_at),
      ),
  },
];

// Initialize default date range (beginning of current month to beginning of next month)
const initializeDateRange = () => {
  const now = new Date();

  // Start date: beginning of current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // End date: beginning of next month
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  messageFilters.start_date = startOfMonth.toISOString().slice(0, 16);
  messageFilters.end_date = startOfNextMonth.toISOString().slice(0, 16);
};



const loadUserMessages = async () => {
  isLoadingMessages.value = true;
  try {
    const { getUserMessages } = useSMS();

    // Format dates for API
    const startDate = new Date(messageFilters.start_date)
      .toISOString()
      .slice(0, 16)
      .replace("T", " ");
    const endDate = new Date(messageFilters.end_date)
      .toISOString()
      .slice(0, 16)
      .replace("T", " ");

    const requestData = {
      start_date: startDate,
      end_date: endDate,
      status: messageFilters.status === "all" ? "" : messageFilters.status,
      page: currentPage.value,
      page_size: pageSize.value,
      count: 0,
      is_ad: "",
    };

    const response = await getUserMessages(requestData);
    userMessages.value = response.data?.data?.result || [];
    totalPages.value = response.data?.data?.last_page || 1;
    totalMessages.value = response.data?.data?.total || 0;
  } catch (error) {
    console.error("Failed to load user messages:", error);
    toast.add({
      title: "Xatolik",
      description: "Xabarlar tarixini yuklashda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isLoadingMessages.value = false;
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case "DELIVERED":
    case "SUCCESS":
      return "success";
    case "REJECTED":
    case "ERROR":
      return "error";
    case "ACCEPTED":
      return "warning";
    default:
      return "info";
  }
};

const getStatusText = (status: string) => {
  switch (status?.toUpperCase()) {
    case "DELIVERED":
    case "SUCCESS":
      return "Yetkazilgan";
    case "REJECTED":
      return "Muvaffaqiyatsiz";
    case "ACCEPTED":
      return "Kutilmoqda";
    default:
      return status || "Noma'lum";
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("uz-UZ", { timeZone: "UTC" });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("uz-UZ").format(amount);
};

// Pagination computed properties
const paginationStart = computed(() => {
  return totalMessages.value === 0
    ? 0
    : (currentPage.value - 1) * pageSize.value + 1;
});

const paginationEnd = computed(() => {
  return Math.min(currentPage.value * pageSize.value, totalMessages.value);
});

// Search messages (when filters change)
const searchMessages = () => {
  currentPage.value = 1; // Reset to first page
  loadUserMessages();
};

// Watch for page changes
watch(currentPage, () => {
  loadUserMessages();
});

// Initialize
onMounted(() => {
  initializeDateRange();
  loadUserMessages();
});
</script>
