<template>
  <div class="container mx-auto py-10 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">SMS Jo'natmalar</h1>
        <p class="text-muted-foreground">
          SMS xabarlarni jo'nating va jo'natilgan xabarlar tarixini ko'ring
        </p>
      </div>
    </div>

    <!-- Messages History -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Icon name="lucide:history" class="h-5 w-5" />
          Jo'natilgan xabarlar tarixi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <!-- Date Filter -->
        <div class="mb-6">
          <form @submit.prevent="searchMessages" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-2">
                <Label for="start_date">Boshlanish sanasi</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  v-model="messageFilters.start_date"
                  required
                />
              </div>
              <div class="space-y-2">
                <Label for="end_date">Tugash sanasi</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  v-model="messageFilters.end_date"
                  required
                />
              </div>
              <div class="space-y-2">
                <Label for="status">Holat</Label>
                <Select v-model="messageFilters.status">
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
            </div>

            <Button type="submit" :disabled="isLoadingMessages">
              <Icon
                v-if="isLoadingMessages"
                name="lucide:loader-2"
                class="mr-2 h-4 w-4 animate-spin"
              />
              {{ isLoadingMessages ? "Yuklanmoqda..." : "Xabarlarni yuklash" }}
            </Button>
          </form>
        </div>

        <!-- Messages Table -->
        <div
          v-if="isLoadingMessages"
          class="flex items-center justify-center py-8"
        >
          <Icon
            name="lucide:loader-2"
            class="h-8 w-8 animate-spin text-primary"
          />
        </div>
        <div
          v-else-if="userMessages.length === 0"
          class="text-center py-8 text-muted-foreground"
        >
          Hech qanday xabar topilmadi
        </div>
        <div v-else class="border rounded-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-muted/50">
                <tr>
                  <th class="text-left p-4 font-semibold">Telefon raqami</th>
                  <th class="text-left p-4 font-semibold">Xabar</th>
                  <th class="text-left p-4 font-semibold">Qismlar</th>
                  <th class="text-left p-4 font-semibold">Xarajat</th>
                  <th class="text-left p-4 font-semibold">Holat</th>
                  <th class="text-left p-4 font-semibold">Sana</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(message, index) in userMessages"
                  :key="message.id || index"
                  class="border-t hover:bg-muted/25"
                >
                  <td class="p-4">
                    <div class="font-medium">+{{ message.to }}</div>
                  </td>
                  <td class="p-4">
                    <div class="max-w-md leading-relaxed whitespace-pre-wrap">
                      {{ message.message }}
                    </div>
                  </td>
                  <td class="p-4">
                    <div class="text-sm">{{ message.parts_count }} qism</div>
                  </td>
                  <td class="p-4">
                    <div class="font-medium">
                      {{ formatCurrency(message.total_price) }}
                    </div>
                  </td>
                  <td class="p-4">
                    <div
                      class="px-2 py-1 text-xs rounded inline-block"
                      :class="getStatusClass(message.status)"
                    >
                      {{ getStatusText(message.status) }}
                    </div>
                  </td>
                  <td class="p-4">
                    <div class="text-sm text-muted-foreground">
                      {{ formatDate(message.sent_at) }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="flex items-center justify-between mt-4 py-4"
        >
          <div class="text-sm text-muted-foreground">
            <span class="font-medium">{{ paginationStart }}</span> dan
            <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
            <span class="font-medium">{{ totalMessages }}</span> xabar
          </div>

          <Pagination
            :items-per-page="pageSize"
            :total="totalMessages"
            :default-page="currentPage"
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { useSMS } from "~/composables/useSMS";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";

definePageMeta({
  middleware: ["auth"],
});

const { toast } = useToast();

// State
const templates = ref<any[]>([]);
const userMessages = ref<any[]>([]);
const isSending = ref(false);
const isLoadingMessages = ref(false);
const selectedTemplate = ref("none");

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

// Functions
const loadTemplates = async () => {
  try {
    const { getSMSTemplates } = useSMS();
    const response = await getSMSTemplates();
    templates.value = response.data?.result || [];
  } catch (error) {
    console.error("Failed to load templates:", error);
  }
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
    console.log("User messages loaded:", response);
  } catch (error) {
    console.error("Failed to load user messages:", error);
    toast({
      title: "Xatolik",
      description: "Xabarlar tarixini yuklashda xatolik yuz berdi",
      variant: "destructive",
    });
  } finally {
    isLoadingMessages.value = false;
  }
};

const sendSMS = async () => {
  isSending.value = true;
  try {
    const { sendSMS: sendSMSMessage } = useSMS();

    await sendSMSMessage({
      mobile_phone: smsForm.mobile_phone,
      message: smsForm.message,
    });

    toast({
      title: "Muvaffaqiyat",
      description: "SMS muvaffaqiyatli jo'natildi",
    });

    // Reset form
    smsForm.mobile_phone = "";
    smsForm.message = "";
    selectedTemplate.value = "none";

    // Reload messages
    await loadUserMessages();
  } catch (error) {
    console.error("Failed to send SMS:", error);
    toast({
      title: "Xatolik",
      description: "SMS jo'natishda xatolik yuz berdi",
      variant: "destructive",
    });
  } finally {
    isSending.value = false;
  }
};

const onTemplateSelect = (templateId: string) => {
  if (templateId && templateId !== "none") {
    const template = templates.value.find((t) => t.id == templateId);
    if (template) {
      smsForm.message = template.template;
    }
  } else if (templateId === "none") {
    smsForm.message = "";
  }
};

const getStatusClass = (status: string) => {
  switch (status?.toUpperCase()) {
    case "DELIVERED":
    case "SUCCESS":
      return "bg-green-100 text-green-800";
    case "REJECTED":
    case "ERROR":
      return "bg-red-100 text-red-800";
    case "ACCEPTED":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
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
  return date.toLocaleString("uz-UZ");
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

// Search messages (when filters change)
const searchMessages = () => {
  currentPage.value = 1; // Reset to first page
  loadUserMessages();
};

// Pagination navigation
const navigatePage = (newPage: number) => {
  if (newPage < 1 || newPage > totalPages.value) return;
  currentPage.value = newPage;
  loadUserMessages();
};

const onPageChange = (newPage: number) => {
  navigatePage(newPage);
};

// Initialize
onMounted(() => {
  initializeDateRange();
  loadTemplates();
  loadUserMessages();
});
</script>
