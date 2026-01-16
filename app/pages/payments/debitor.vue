<template>
  <div class="container mx-auto py-10 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Qarzdor talabalar</h1>
        <p class="text-muted-foreground">
          Muddati o'tgan to'lovlarga ega talabalar
        </p>
      </div>
      <Button variant="outline" @click="refreshData">
        <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" />
        Yangilash
      </Button>
    </div>

    <!-- Stats Overview -->
    <div class="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Jami qarzdorlar</CardTitle>
          <Icon name="lucide:users" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ debitorCount }}</div>
          <p class="text-xs text-muted-foreground">
            Muddati o'tgan to'lovlarga ega talabalar
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Jami qarz</CardTitle>
          <Icon name="lucide:banknote" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ formatCurrency(totalOverdueAmount) }}
          </div>
          <p class="text-xs text-muted-foreground">To'lanmagan to'lovlar</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">O'rtacha kunlar</CardTitle>
          <Icon name="lucide:clock" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ averageDaysOverdue }}</div>
          <p class="text-xs text-muted-foreground">
            O'rtacha kechikish kunlari
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <Input
        v-model="searchQuery"
        placeholder="Talaba nomini qidirish..."
        class="sm:max-w-xs"
      >
        <template #leading>
          <Icon name="lucide:search" class="h-4 w-4" />
        </template>
      </Input>
      <div class="flex flex-wrap gap-2 sm:ml-auto">
        <Button variant="outline" @click="exportToCSV">
          <Icon name="lucide:download" class="mr-2 h-4 w-4" />
          CSV yuklash
        </Button>
      </div>
    </div>

    <!-- Debitor Students Table -->
    <Card>
      <CardContent class="p-0">
        <div class="p-2 border-b">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Talaba</TableHead>
                <TableHead>Qarz miqdori</TableHead>
                <TableHead>To'lov sanasi</TableHead>
                <TableHead>Keyingi to'lov sanasi</TableHead>
                <TableHead>Kechikish kunlari</TableHead>
                <TableHead>Izohlar</TableHead>
                <TableHead>Aloqa</TableHead>
                <TableHead class="text-right">Harakatlar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="loading">
                <TableCell colspan="8" class="text-center py-10">
                  <Spinner class="mx-auto" />
                </TableCell>
              </TableRow>
              <TableRow v-else-if="filteredDebitors.length === 0">
                <TableCell colspan="8" class="text-center py-10">
                  <div class="flex justify-center">
                    <Icon
                      name="lucide:search-x"
                      class="h-8 w-8 text-muted-foreground"
                    />
                  </div>
                  <p class="text-muted-foreground mt-2">
                    Qarzdor talabalar topilmadi
                  </p>
                </TableCell>
              </TableRow>
              <TableRow
                v-for="debitor in paginatedDebitors"
                :key="debitor.id"
                class="hover:bg-muted/50"
              >
                <TableCell>
                  <div class="font-medium">{{ debitor.student_name }}</div>
                </TableCell>
                <TableCell>{{ formatCurrency(debitor.amount) }}</TableCell>
                <TableCell>{{ formatDate(debitor.payment_date) }}</TableCell>
                <TableCell>{{
                  formatDate(debitor.next_payment_date)
                }}</TableCell>
                <TableCell>
                  <Badge
                    :variant="getOverdueBadgeVariant(debitor.days_overdue)"
                  >
                    {{ debitor.days_overdue }} kun
                  </Badge>
                </TableCell>
                <TableCell class="max-w-[200px] truncate">{{
                  debitor.notes || "Izoh yo'q"
                }}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="openContactModal(debitor)"
                    :class="{
                      'text-green-600 hover:text-green-700':
                        contactStatus[debitor.id],
                      'text-gray-400 hover:text-gray-500':
                        !contactStatus[debitor.id],
                    }"
                  >
                    <Icon
                      :name="
                        contactStatus[debitor.id]
                          ? 'lucide:check-circle'
                          : 'lucide:plus-circle'
                      "
                      class="h-4 w-4"
                    />
                    <span class="sr-only">
                      {{
                        contactStatus[debitor.id]
                          ? "Aloqa ma'lumotlarini ko'rish/tahrirlash"
                          : "Aloqa qilish"
                      }}
                    </span>
                  </Button>
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      @click="sendReminder(debitor)"
                      title="Eslatma yuborish"
                    >
                      <Icon name="lucide:mail" class="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between p-4">
          <div class="text-sm text-muted-foreground">
            Ko'rsatilmoqda
            <span class="font-medium">{{ paginationStart }}</span> dan
            <span class="font-medium">{{ paginationEnd }}</span> gacha,
            <span class="font-medium">{{ filteredDebitors.length }}</span>
            qarzdorlar
          </div>

          <Pagination
            v-model:page="currentPage"
            :total="filteredDebitors.length"
            :items-per-page="itemsPerPage"
            :sibling-count="1"
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

    <!-- Mark as Paid Dialog -->
    <Dialog v-model:open="showPaymentDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>To'lovni qayd qilish</DialogTitle>
          <DialogDescription>
            {{ selectedDebitor?.student_name }} uchun to'lovni qayd qilish
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="amount" class="text-right">Summa</Label>
            <div class="col-span-3">
              <Input
                id="amount"
                v-model="paymentDetails.amount"
                type="number"
                :placeholder="
                  selectedDebitor ? String(selectedDebitor.amount) : '0'
                "
              />
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="payment-method" class="text-right">To'lov usuli</Label>
            <div class="col-span-3">
              <Select v-model="paymentDetails.method">
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="To'lov usulini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Naqd">Naqd</SelectItem>
                  <SelectItem value="Karta">Karta</SelectItem>
                  <SelectItem value="Bank">Bank o'tkazmasi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="notes" class="text-right">Izoh</Label>
            <Textarea
              id="notes"
              v-model="paymentDetails.notes"
              placeholder="To'lov haqida izoh qo'shing"
              class="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="showPaymentDialog = false"
            >Bekor qilish</Button
          >
          <Button @click="confirmPayment" :disabled="isProcessingPayment">
            <Icon
              v-if="isProcessingPayment"
              name="lucide:loader-2"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{
              isProcessingPayment
                ? "Qayta ishlanmoqda..."
                : "To'lovni qayd qilish"
            }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Send Reminder Dialog -->
    <Dialog v-model:open="showReminderDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>To'lov eslatmasi yuborish</DialogTitle>
          <DialogDescription>
            {{ selectedDebitor?.student_name }} ga to'lov eslatmasi yuborish
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="reminder-type" class="text-right">Eslatma turi</Label>
            <div class="col-span-3">
              <Select v-model="reminderDetails.type">
                <SelectTrigger id="reminder-type">
                  <SelectValue placeholder="Eslatma turini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="reminder-message" class="text-right">Xabar</Label>
            <Textarea
              id="reminder-message"
              v-model="reminderDetails.message"
              placeholder="Eslatma xabarini kiriting"
              class="col-span-3"
              rows="4"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="showReminderDialog = false"
            >Bekor qilish</Button
          >
          <Button @click="confirmSendReminder" :disabled="isSendingReminder">
            <Icon
              v-if="isSendingReminder"
              name="lucide:loader-2"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ isSendingReminder ? "Yuborilmoqda..." : "Eslatma yuborish" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Contact Modal -->
    <Dialog v-model:open="contactDialog">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{
            isEditMode ? "Aloqa ma'lumotlarini tahrirlash" : "Aloqa qo'shish"
          }}</DialogTitle>
          <DialogDescription>
            {{
              isEditMode
                ? "Mavjud aloqa ma'lumotlarini tahrirlash"
                : "To'lov uchun aloqa ma'lumotlarini kiritish"
            }}
          </DialogDescription>
        </DialogHeader>
        <div v-if="selectedDebitor" class="py-4">
          <div class="flex items-center gap-4 mb-6">
            <Avatar class="h-12 w-12">
              <AvatarFallback>{{
                getInitials(selectedDebitor.student_name || "")
              }}</AvatarFallback>
            </Avatar>
            <div>
              <h3 class="font-medium text-lg">
                {{ selectedDebitor.student_name }}
              </h3>
              <p class="text-sm text-muted-foreground">
                Qarz summasi: {{ formatCurrency(selectedDebitor.amount) }}
              </p>
              <p class="text-sm text-muted-foreground">
                Kechikish: {{ selectedDebitor.days_overdue }} kun
              </p>
            </div>
          </div>

          <!-- Show existing action info in edit mode -->
          <div
            v-if="isEditMode && selectedAction"
            class="mb-6 p-4 bg-muted rounded-lg"
          >
            <h4 class="font-medium mb-2">Mavjud aloqa ma'lumoti:</h4>
            <div class="space-y-1 text-sm text-muted-foreground">
              <p>
                <span class="font-medium">Manager:</span>
                {{ selectedAction.manager?.first_name }}
                {{ selectedAction.manager?.last_name }}
              </p>
              <p>
                <span class="font-medium">Yaratilgan:</span>
                {{ formatDate(selectedAction.createdAt) }}
              </p>
              <p>
                <span class="font-medium">Oxirgi yangilanish:</span>
                {{ formatDate(selectedAction.updatedAt) }}
              </p>
            </div>
          </div>

          <form @submit.prevent="submitContactAction" class="space-y-4">
            <div class="grid w-full gap-2">
              <Label for="action_type">Aloqa turi</Label>
              <Select v-model="contactForm.action_type">
                <SelectTrigger>
                  <SelectValue placeholder="Aloqa turini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="phone">Telefon</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="in_person">Yuzma-yuz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="grid w-full gap-2">
              <Label for="stage">Bosqich</Label>
              <Select v-model="contactForm.stage">
                <SelectTrigger>
                  <SelectValue placeholder="Bosqichni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Kelayotgan</SelectItem>
                  <SelectItem value="debitor">Qarzdor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="grid w-full gap-2">
              <Label for="message">Xabar</Label>
              <Textarea
                id="message"
                v-model="contactForm.message"
                placeholder="Aloqa xabarini kiriting..."
                class="min-h-[100px]"
                required
              />
            </div>

            <div class="grid w-full gap-2">
              <Label for="next_action_date">Keyingi aloqa sanasi</Label>
              <Input
                id="next_action_date"
                type="datetime-local"
                v-model="contactForm.next_action_date"
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                @click="contactDialog = false"
                :disabled="isSubmittingContact"
              >
                Bekor qilish
              </Button>
              <Button type="submit" :disabled="isSubmittingContact">
                <Icon
                  v-if="isSubmittingContact"
                  name="lucide:loader-2"
                  class="mr-2 h-4 w-4 animate-spin"
                />
                {{
                  isSubmittingContact
                    ? isEditMode
                      ? "Yangilanmoqda..."
                      : "Saqlanmoqda..."
                    : isEditMode
                    ? "Yangilash"
                    : "Saqlash"
                }}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";

import { useSMS } from "~/composables/useSMS";
import { api } from "~/lib/api";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

definePageMeta({
  middleware: ["auth"],
});

const { apiService } = useAuth();
const toast = useToast();
const router = useRouter();
const route = useRoute();

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
const contactActions = ref<Record<string, any[]>>({}); // Store full payment action data
const selectedAction = ref<any | null>(null); // Currently selected action for editing
const isEditMode = ref(false); // Track if modal is in edit mode
const selectedDebitor = ref<any | null>(null);
const contactForm = reactive({
  action_type: "sms" as "sms" | "phone" | "telegram" | "in_person",
  stage: "debitor" as "upcoming" | "debitor",
  message: "",
  next_action_date: "",
});

// Computed properties
// Computed property to get contact status (boolean) from actions data
const contactStatus = computed(() => {
  const status: Record<string, boolean> = {};
  Object.keys(contactActions.value).forEach((paymentId) => {
    const actions = contactActions.value[paymentId];
    status[paymentId] = actions ? actions.length > 0 : false;
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
    0
  );
  return Math.round(totalDays / debitors.value.length);
});

const filteredDebitors = computed(() => {
  return debitors.value.filter((debitor) => {
    // Filter by search query
    const nameMatch = debitor.student_name
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase());

    // Filter by days overdue
    let daysMatch = true;
    if (daysFilter.value !== "all") {
      const days = debitor.days_overdue;
      switch (daysFilter.value) {
        case "0-7":
          daysMatch = days >= 0 && days <= 7;
          break;
        case "8-14":
          daysMatch = days >= 8 && days <= 14;
          break;
        case "15-30":
          daysMatch = days >= 15 && days <= 30;
          break;
        case "30+":
          daysMatch = days > 30;
          break;
      }
    }

    return nameMatch && daysMatch;
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
    filteredDebitors.value.length
  );
});

// Pagination display helpers
const displayedPages = computed(() => {
  if (totalPages.value <= 7) {
    // If we have 7 or fewer pages, show all pages
    return Array.from({ length: totalPages.value }, (_, i) => i + 1);
  }

  // Always show first and last page
  // For current page, show 1 page before and 1 page after when possible
  const pages = [];

  // Always include page 1
  pages.push(1);

  // If we're at the start, show pages 2 and 3
  if (currentPage.value <= 3) {
    pages.push(2, 3, 4);
  }
  // If we're at the end, show the last few pages
  else if (currentPage.value >= totalPages.value - 2) {
    pages.push(
      totalPages.value - 3,
      totalPages.value - 2,
      totalPages.value - 1
    );
  }
  // Otherwise show current page and surrounding pages
  else {
    pages.push(currentPage.value - 1, currentPage.value, currentPage.value + 1);
  }

  // Always include last page if not already included
  if (!pages.includes(totalPages.value)) {
    pages.push(totalPages.value);
  }

  return [...new Set(pages)].sort((a, b) => a - b);
});

// Show ellipsis if there are gaps in the pagination
const showEndEllipsis = computed(() => {
  const lastDisplayedPage = Math.max(...displayedPages.value);
  return lastDisplayedPage < totalPages.value;
});

// Contact functions
const loadContactStatuses = async () => {
  if (!debitors.value.length) return;

  const { checkPaymentContact } = useSMS();
  const actions: Record<string, any[]> = {};

  try {
    await Promise.all(
      debitors.value.map(async (debitor) => {
        const contacts = await checkPaymentContact(debitor.id);
        actions[debitor.id] = contacts || [];
      })
    );
    contactActions.value = actions;
  } catch (error) {
    console.error("Failed to load contact statuses:", error);
  }
};

const openContactModal = (debitor: any) => {
  selectedDebitor.value = debitor;

  const existingActions = contactActions.value[debitor.id];

  if (existingActions && existingActions.length > 0) {
    // Edit mode - load existing action data
    isEditMode.value = true;
    const latestAction = existingActions[0]; // Get the latest action
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
    contactForm.stage = "debitor";
    contactForm.message = "";

    // Set default next action date to tomorrow
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
    const { createPaymentAction, updatePaymentAction } = useSMS();
    const { auth } = useAuth();

    const managerId = auth.value.user?.id;
    if (!managerId) {
      throw new Error("Manager ID not found");
    }

    if (isEditMode.value && selectedAction.value) {
      // Update existing action
      await updatePaymentAction(selectedAction.value.id, {
        payment_id: selectedDebitor.value.id,
        manager_id: managerId,
        stage: contactForm.stage,
        action_type: contactForm.action_type,
        message: contactForm.message,
        next_action_date: contactForm.next_action_date,
      });

      toast.toast({
        title: "Muvaffaqiyat",
        description: "Aloqa ma'lumoti muvaffaqiyatli yangilandi",
      });
    } else {
      // Create new action
      await createPaymentAction({
        payment_id: selectedDebitor.value.id,
        manager_id: managerId,
        stage: contactForm.stage,
        action_type: contactForm.action_type,
        message: contactForm.message,
        next_action_date: contactForm.next_action_date,
      });

      toast.toast({
        title: "Muvaffaqiyat",
        description: "Aloqa ma'lumoti muvaffaqiyatli saqlandi",
      });
    }

    // Reload contact statuses to get updated data
    await loadContactStatuses();

    contactDialog.value = false;
  } catch (error) {
    console.error("Failed to save contact action:", error);
    toast.toast({
      title: "Xatolik",
      description: "Aloqa ma'lumotini saqlashda xatolik yuz berdi",
      variant: "destructive",
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

// Fetch debitor students data
const fetchDebitors = async () => {
  loading.value = true;
  try {
    const response = await api.get<{ count: number; payments: any[] }>(
      apiService.value,
      "/student-payments/due-payments/check"
    );

    debitors.value = response.payments || [];
    totalItems.value = response.count || 0;
    // Load contact statuses after debitors are loaded
    await loadContactStatuses();
  } catch (error) {
    console.error("Failed to fetch debitor data:", error);
    toast.toast({
      title: "Error",
      description: "Failed to load debitor students data",
      variant: "destructive",
    });
    debitors.value = [];
    totalItems.value = 0;
  } finally {
    loading.value = false;
  }
};

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "UZS",
    minimumFractionDigits: 0,
  }).format(amount);
};

const getOverdueBadgeVariant = (days: number) => {
  if (days <= 7) return "warning";
  if (days <= 14) return "default";
  if (days <= 30) return "destructive";
  return "outline"; // More than 30 days
};

// Action handlers
const refreshData = () => {
  fetchDebitors();
};

// Navigation functions for pagination
const navigatePage = (newPage: number) => {
  if (newPage >= 1 && newPage <= totalPages.value) {
    currentPage.value = newPage;
    updateUrlParams();
  }
};

const onPageChange = (newPage: number) => {
  if (newPage >= 1 && newPage <= totalPages.value) {
    currentPage.value = newPage;
    updateUrlParams();
  }
};

const updateUrlParams = () => {
  // Create query object with pagination params
  const query: Record<string, string> = {
    page: currentPage.value.toString(),
  };

  // Add search param if it exists
  if (searchQuery.value) {
    query.search = searchQuery.value;
  }

  if (daysFilter.value !== "all") {
    query.filter = daysFilter.value;
  }

  // Update URL with all params
  router.push({ query });
};

const markAsPaid = (debitor: any) => {
  selectedDebitor.value = debitor;
  paymentDetails.amount = debitor.amount;
  paymentDetails.notes = `Payment for overdue balance (${debitor.days_overdue} days)`;
  showPaymentDialog.value = true;
};

const confirmPayment = async () => {
  if (!selectedDebitor.value) return;

  isProcessingPayment.value = true;
  try {
    // Make API call to record payment
    await api.post(
      apiService.value,
      `/student-payments/${selectedDebitor.value.id}/record-payment`,
      {
        amount: paymentDetails.amount,
        payment_method: paymentDetails.method,
        notes: paymentDetails.notes,
      }
    );

    // Remove from local list
    debitors.value = debitors.value.filter(
      (d) => d.id !== selectedDebitor.value?.id
    );

    // Show success message
    toast.toast({
      title: "Success",
      description: `Payment recorded for ${selectedDebitor.value.student_name}`,
    });

    // Close dialog
    showPaymentDialog.value = false;
  } catch (error) {
    console.error("Failed to record payment:", error);
    toast.toast({
      title: "Error",
      description: "Failed to record payment",
      variant: "destructive",
    });
  } finally {
    isProcessingPayment.value = false;
  }
};

const viewStudentProfile = (studentId: string) => {
  window.location.href = `/students/${studentId}`;
};

const sendReminder = (debitor: any) => {
  selectedDebitor.value = debitor;

  // Format currency for SMS (e.g., "1,300,000 so'm")
  const formatCurrencyForSMS = (amount: number): string => {
    return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
  };

  // Format date for SMS (DD.MM.YYYY)
  const formatDateForSMS = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const amount = formatCurrencyForSMS(debitor.amount);
  const daysText = debitor.days_overdue === 1 ? "kun" : "kun";

  // For overdue payments, emphasize how many days overdue
  reminderDetails.message = `Hurmatli ${debitor.student_name}, Sizning ${amount} miqdoridagi to'lovingiz ${debitor.days_overdue} ${daysText} ga kechikkan. Iltimos, imkon qadar tezroq to'lovni amalga oshiring. Impulse Study LC`;
  showReminderDialog.value = true;
};

const confirmSendReminder = async () => {
  if (!selectedDebitor.value) return;

  isSendingReminder.value = true;
  try {
    // Only handle SMS reminders with the new SMS implementation
    if (reminderDetails.type === "sms") {
      const { sendSMS } = useSMS();

      // Get student's phone number - check all possible phone field locations
      const phoneNumber =
        selectedDebitor.value.student_phone ||
        selectedDebitor.value.student?.phone ||
        selectedDebitor.value.phone;
      if (!phoneNumber) {
        throw new Error("Talabaning telefon raqami mavjud emas");
      }

      // Send SMS using the new endpoint
      await sendSMS({
        mobile_phone: phoneNumber,
        message: reminderDetails.message || "To'lov eslatmasi",
      });

      toast.toast({
        title: "Muvaffaqiyat",
        description: "SMS muvaffaqiyatli yuborildi",
      });
    } else {
      // For other types, show a notification since they don't require API calls to SMS service
      toast.toast({
        title: "Eslatma",
        description: "Eslatma saqlandi",
      });
    }

    // Close dialog
    showReminderDialog.value = false;
  } catch (error) {
    console.error("Failed to send reminder:", error);
    toast.toast({
      title: "Xatolik",
      description: "Eslatma yuborishda xatolik yuz berdi",
      variant: "destructive",
    });
  } finally {
    isSendingReminder.value = false;
  }
};

const exportToCSV = () => {
  // Create CSV content
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

  // Create download link
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `debitor-students-${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.toast({
    title: "Success",
    description: `Exported ${filteredDebitors.value.length} debitor records`,
  });
};

// Initialize data on component mount
onMounted(() => {
  // Get URL parameters if available

  // Get page parameter
  if (route.query.page) {
    currentPage.value = parseInt(route.query.page as string, 10);
  }

  // Get search parameter
  if (route.query.search) {
    searchQuery.value = route.query.search as string;
  }

  // Get filter parameter
  if (route.query.filter) {
    daysFilter.value = route.query.filter as string;
  }

  fetchDebitors();
});

// Watch for filter changes and reset to page 1
watch([searchQuery, daysFilter], () => {
  // Reset to page 1 when filters change
  currentPage.value = 1;
  // Update URL params
  updateUrlParams();
});
</script>
