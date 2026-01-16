<template>
  <div class="container mx-auto py-10 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">SMS Hisobot</h1>
        <p class="text-muted-foreground">
          SMS xabarlar hisoboti va balans ma'lumotlari
        </p>
      </div>
      <Button variant="outline" @click="refreshData">
        <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" />
        Yangilash
      </Button>
    </div>

    <!-- Balance Card -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Icon name="lucide:wallet" class="h-5 w-5" />
          SMS Balans
        </CardTitle>
      </CardHeader>
      <CardContent>
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
          <p class="text-sm text-muted-foreground">Joriy balans (UZS)</p>
        </div>
        <div v-else class="text-muted-foreground">
          Balans ma'lumotlari yuklanmadi
        </div>
      </CardContent>
    </Card>

    <!-- Report Filters -->
    <Card>
      <CardHeader>
        <CardTitle>Hisobot filtrlari</CardTitle>
        <CardDescription>
          Ma'lum vaqt oralig'i uchun SMS hisobotini olish
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="generateReport" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="start_date">Boshlanish sanasi</Label>
              <Input
                id="start_date"
                type="datetime-local"
                v-model="reportFilters.start_date"
                required
              />
            </div>
            <div class="space-y-2">
              <Label for="end_date">Tugash sanasi</Label>
              <Input
                id="end_date"
                type="datetime-local"
                v-model="reportFilters.end_date"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="status">Holat</Label>
              <Select v-model="reportFilters.status">
                <SelectTrigger>
                  <SelectValue placeholder="Holatni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="delivered">Yetkazilgan</SelectItem>
                  <SelectItem value="failed">Muvaffaqiyatsiz</SelectItem>
                  <SelectItem value="pending">Kutilmoqda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label for="is_ad">Reklama</Label>
              <Select v-model="reportFilters.is_ad">
                <SelectTrigger>
                  <SelectValue placeholder="Reklama turini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="true">Reklama</SelectItem>
                  <SelectItem value="false">Reklama emas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" :disabled="isLoadingReport" class="w-full">
            <Icon
              v-if="isLoadingReport"
              name="lucide:loader-2"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{
              isLoadingReport ? "Hisobot tayyorlanmoqda..." : "Hisobot olish"
            }}
          </Button>
        </form>
      </CardContent>
    </Card>

    <!-- Report Results -->
    <Card v-if="reportData">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Icon name="lucide:bar-chart-3" class="h-5 w-5" />
          Hisobot natijalari
        </CardTitle>
      </CardHeader>
      <CardContent>
        <!-- Main Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="space-y-2">
            <div class="text-2xl font-bold">
              {{ reportData.data?.data?.total_parts || 0 }}
            </div>
            <p class="text-sm text-muted-foreground">Jami SMS qismlari</p>
          </div>
          <div class="space-y-2">
            <div class="text-2xl font-bold text-blue-600">
              {{ reportData.data?.data?.parts || 0 }}
            </div>
            <p class="text-sm text-muted-foreground">Oddiy SMS qismlari</p>
          </div>
          <div class="space-y-2">
            <div class="text-2xl font-bold text-purple-600">
              {{ reportData.data?.data?.ad_parts || 0 }}
            </div>
            <p class="text-sm text-muted-foreground">Reklama SMS qismlari</p>
          </div>
          <div class="space-y-2">
            <div class="text-2xl font-bold">
              {{ formatCurrency(reportData.data?.data?.total_spent || 0) }}
            </div>
            <p class="text-sm text-muted-foreground">Jami xarajat</p>
          </div>
        </div>

        <!-- Detailed Cost Breakdown -->
        <div class="mt-6 pt-6 border-t">
          <h3 class="text-lg font-semibold mb-4">Xarajatlar tafsiloti</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <div class="text-xl font-bold text-blue-600">
                {{ formatCurrency(reportData.data?.data?.spent || 0) }}
              </div>
              <p class="text-sm text-muted-foreground">Oddiy SMS xarajati</p>
            </div>
            <div class="space-y-2">
              <div class="text-xl font-bold text-purple-600">
                {{ formatCurrency(reportData.data?.data?.ad_spent || 0) }}
              </div>
              <p class="text-sm text-muted-foreground">Reklama SMS xarajati</p>
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
              <p class="text-sm text-muted-foreground">Reklama SMS ulushi</p>
            </div>
            <div class="space-y-2">
              <div class="text-lg font-semibold">
                {{ calculateRegularPercentage() }}%
              </div>
              <p class="text-sm text-muted-foreground">Oddiy SMS ulushi</p>
            </div>
            <div class="space-y-2">
              <div class="text-lg font-semibold">
                {{ calculateAverageCost() }}
              </div>
              <p class="text-sm text-muted-foreground">
                O'rtacha xarajat (1 qism)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useSMS } from "~/composables/useSMS";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

definePageMeta({
  middleware: ["auth"],
});

const { toast } = useToast();

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
    toast({
      title: "Xatolik",
      description: "SMS balansini yuklashda xatolik yuz berdi",
      variant: "destructive",
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

    toast({
      title: "Muvaffaqiyat",
      description: "Hisobot muvaffaqiyatli olindi",
    });

    console.log("SMS Report Data:", response);
  } catch (error) {
    console.error("Failed to generate SMS report:", error);
    toast({
      title: "Xatolik",
      description: "Hisobotni olishda xatolik yuz berdi",
      variant: "destructive",
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
  return new Intl.NumberFormat("uz-UZ").format(amount);
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
