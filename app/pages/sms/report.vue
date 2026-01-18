<template>
  <UDashboardPanel id="sms-report">
    <template #header>
      <UDashboardNavbar title="SMS Hisobot">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          SMS xabarlar hisoboti va balans ma'lumotlari
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
        <!-- Balance Card -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <Icon name="lucide:wallet" class="h-5 w-5" />
              <h3 class="text-base font-semibold">SMS Balans</h3>
            </div>
          </template>

          <div
            v-if="isLoadingBalance"
            class="flex items-center justify-center py-8"
          >
            <Icon
              name="lucide:loader-2"
              class="h-8 w-8 animate-spin text-primary"
            />
          </div>
          <div v-else-if="balance" class="space-y-2">
            <div class="text-3xl font-bold">
              {{ formatCurrency(balance.data?.data?.balance || 0) }}
            </div>
            <p class="text-sm text-gray-500">Joriy balans (UZS)</p>
          </div>
          <div v-else class="text-gray-500">Balans ma'lumotlari yuklanmadi</div>
        </UCard>

        <!-- Report Filters -->
        <UCard>
          <template #header>
            <div>
              <h3 class="text-base font-semibold">Hisobot filtrlari</h3>
              <p class="text-sm text-gray-500 mt-1">
                Ma'lum vaqt oralig'i uchun SMS hisobotini olish
              </p>
            </div>
          </template>

          <form @submit.prevent="generateReport" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <UFormField  label="Boshlanish sanasi" required>
                  <UInput
                    type="datetime-local"
                    v-model="reportFilters.start_date"
                    required
                  />
                </UFormField>
              </div>
              <div>
                <UFormField  label="Tugash sanasi" required>
                  <UInput
                    type="datetime-local"
                    v-model="reportFilters.end_date"
                    required
                  />
                </UFormField>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <UFormField  label="Holat">
                  <USelect
                    v-model="reportFilters.status"
                    :items="statusOptions"
                    placeholder="Holatni tanlang"
                  />
                </UFormField>
              </div>
              <div>
                <UFormField  label="Reklama">
                  <USelect
                    v-model="reportFilters.is_ad"
                    :items="adOptions"
                    placeholder="Reklama turini tanlang"
                  />
                </UFormField>
              </div>
            </div>

            <UButton
              type="submit"
              :loading="isLoadingReport"
              :label="
                isLoadingReport ? 'Hisobot tayyorlanmoqda...' : 'Hisobot olish'
              "
              block
            />
          </form>
        </UCard>

        <!-- Report Results -->
        <UCard v-if="reportData">
          <template #header>
            <div class="flex items-center gap-2">
              <Icon name="lucide:bar-chart-3" class="h-5 w-5" />
              <h3 class="text-base font-semibold">Hisobot natijalari</h3>
            </div>
          </template>

          <!-- Main Statistics -->
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            <div class="space-y-2">
              <div class="text-2xl font-bold">
                {{ reportData.data?.data?.total_parts || 0 }}
              </div>
              <p class="text-sm text-gray-500">Jami SMS qismlari</p>
            </div>
            <div class="space-y-2">
              <div class="text-2xl font-bold text-blue-600">
                {{ reportData.data?.data?.parts || 0 }}
              </div>
              <p class="text-sm text-gray-500">Oddiy SMS qismlari</p>
            </div>
            <div class="space-y-2">
              <div class="text-2xl font-bold text-purple-600">
                {{ reportData.data?.data?.ad_parts || 0 }}
              </div>
              <p class="text-sm text-gray-500">Reklama SMS qismlari</p>
            </div>
            <div class="space-y-2">
              <div class="text-2xl font-bold">
                {{ formatCurrency(reportData.data?.data?.total_spent || 0) }}
              </div>
              <p class="text-sm text-gray-500">Jami xarajat</p>
            </div>
          </div>

          <!-- Detailed Cost Breakdown -->
          <div class="pt-6 border-t">
            <h3 class="text-lg font-semibold mb-4">Xarajatlar tafsiloti</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <div class="text-xl font-bold text-blue-600">
                  {{ formatCurrency(reportData.data?.data?.spent || 0) }}
                </div>
                <p class="text-sm text-gray-500">Oddiy SMS xarajati</p>
              </div>
              <div class="space-y-2">
                <div class="text-xl font-bold text-purple-600">
                  {{ formatCurrency(reportData.data?.data?.ad_spent || 0) }}
                </div>
                <p class="text-sm text-gray-500">Reklama SMS xarajati</p>
              </div>
            </div>
          </div>

          <!-- Statistics -->
          <div class="mt-6 pt-6 border-t">
            <h3 class="text-lg font-semibold mb-4">Statistika</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-2">
                <div class="text-lg font-semibold">
                  {{ calculateAdPercentage() }}%
                </div>
                <p class="text-sm text-gray-500">Reklama SMS ulushi</p>
              </div>
              <div class="space-y-2">
                <div class="text-lg font-semibold">
                  {{ calculateRegularPercentage() }}%
                </div>
                <p class="text-sm text-gray-500">Oddiy SMS ulushi</p>
              </div>
              <div class="space-y-2">
                <div class="text-lg font-semibold">
                  {{ calculateAverageCost() }}
                </div>
                <p class="text-sm text-gray-500">O'rtacha xarajat (1 qism)</p>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useSMS } from "~/composables/useSMS";

definePageMeta({
  middleware: ["auth"],
});

const toast = useToast();

// State
const balance = ref<any>(null);
const reportData = ref<any>(null);
const isLoadingBalance = ref(false);
const isLoadingReport = ref(false);

// Report filters
const reportFilters = reactive({
  start_date: "",
  end_date: "",
  status: "all",
  is_ad: "all",
});

const statusOptions = [
  { label: "Barchasi", value: "all" },
  { label: "Yetkazilgan", value: "delivered" },
  { label: "Muvaffaqiyatsiz", value: "failed" },
  { label: "Kutilmoqda", value: "pending" },
];

const adOptions = [
  { label: "Barchasi", value: "all" },
  { label: "Reklama", value: "true" },
  { label: "Reklama emas", value: "false" },
];

// Initialize default date range (current and future - next 1 month)
const initializeDateRange = () => {
  const now = new Date();
  const monthFromNow = new Date();
  monthFromNow.setMonth(now.getMonth() + 1);

  // Format for datetime-local input
  reportFilters.start_date = now.toISOString().slice(0, 16);
  reportFilters.end_date = monthFromNow.toISOString().slice(0, 16);
};

// Functions
const loadBalance = async () => {
  isLoadingBalance.value = true;
  try {
    const { getSMSBalance } = useSMS();
    balance.value = await getSMSBalance();
  } catch (error) {
    console.error("Failed to load SMS balance:", error);
    toast.add({
      title: "Xatolik",
      description: "SMS balansini yuklashda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isLoadingBalance.value = false;
  }
};

const generateReport = async () => {
  isLoadingReport.value = true;
  try {
    const { getSMSReport } = useSMS();

    // Format dates for API (YYYY-MM-DD HH:MM format)
    const startDate = new Date(reportFilters.start_date)
      .toISOString()
      .slice(0, 16)
      .replace("T", " ");
    const endDate = new Date(reportFilters.end_date)
      .toISOString()
      .slice(0, 16)
      .replace("T", " ");

    const reportRequest = {
      start_date: startDate,
      end_date: endDate,
      status: reportFilters.status === "all" ? "" : reportFilters.status,
      is_ad: reportFilters.is_ad === "all" ? "" : reportFilters.is_ad,
    };

    const response = await getSMSReport(reportRequest);
    reportData.value = response;

    toast.add({
      title: "Muvaffaqiyat",
      description: "Hisobot muvaffaqiyatli olindi",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to generate SMS report:", error);
    toast.add({
      title: "Xatolik",
      description: "Hisobotni olishda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isLoadingReport.value = false;
  }
};

const refreshData = async () => {
  await Promise.all([
    loadBalance(),
    reportData.value ? generateReport() : Promise.resolve(),
  ]);
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US").format(amount);
};

const calculateAdPercentage = (): string => {
  if (!reportData.value?.data?.data?.total_parts) return "0";
  const rate =
    (reportData.value.data.data.ad_parts /
      reportData.value.data.data.total_parts) *
    100;
  return rate.toFixed(1);
};

const calculateRegularPercentage = (): string => {
  if (!reportData.value?.data?.data?.total_parts) return "0";
  const rate =
    (reportData.value.data.data.parts /
      reportData.value.data.data.total_parts) *
    100;
  return rate.toFixed(1);
};

const calculateAverageCost = (): string => {
  if (!reportData.value?.data?.data?.total_parts) return "0";
  const avgCost =
    reportData.value.data.data.total_spent /
    reportData.value.data.data.total_parts;
  return formatCurrency(avgCost);
};

// Initialize
onMounted(() => {
  initializeDateRange();
  loadBalance();
});
</script>
