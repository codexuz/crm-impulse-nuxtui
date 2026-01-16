<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Kelayotgan to'lovlar</h2>
        <p class="text-muted-foreground">
          Yaqin kunlarda kutilayotgan to'lovlarni kuzatish
        </p>
      </div>
    </div>

    <div class="space-y-4">
      <!-- Controls -->
      <div class="flex items-center gap-2">
        <Input
          v-model="search"
          placeholder="Talabalarni qidirish..."
          class="max-w-sm"
        />
        <Select v-model="selectedDays" class="w-36">
          <SelectTrigger>
            <SelectValue :placeholder="`Keyingi ${selectedDays} kun`" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Keyingi 1 kun</SelectItem>
            <SelectItem value="3">Keyingi 3 kun</SelectItem>
            <SelectItem value="7">Keyingi 7 kun</SelectItem>
            <SelectItem value="14">Keyingi 14 kun</SelectItem>
            <SelectItem value="30">Keyingi 30 kun</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" @click="refreshData">
          <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" />
          Yangilash
        </Button>
      </div>

      <!-- Upcoming Payments Table -->
      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Talaba</TableHead>
              <TableHead>Summa</TableHead>
              <TableHead>Oxirgi to'lov</TableHead>
              <TableHead>Muddat</TableHead>
              <TableHead>Qolgan kunlar</TableHead>
              <TableHead>Aloqa</TableHead>
              <TableHead>Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="isLoading">
              <TableCell colspan="7" class="text-center py-10">
                <div class="flex justify-center">
                  <Icon
                    name="lucide:loader-2"
                    class="h-8 w-8 animate-spin text-primary"
                  />
                </div>
                <p class="text-muted-foreground mt-2">
                  Kelayotgan to'lovlar yuklanmoqda...
                </p>
              </TableCell>
            </TableRow>
            <TableRow v-else-if="filteredPayments.length === 0">
              <TableCell colspan="7" class="text-center py-10">
                <div class="flex justify-center">
                  <Icon
                    name="lucide:calendar-check"
                    class="h-8 w-8 text-muted-foreground"
                  />
                </div>
                <p class="text-muted-foreground mt-2">
                  Kelayotgan to'lovlar topilmadi
                </p>
                <Button variant="link" @click="refreshData" class="mt-2">
                  Ma'lumotlarni yangilash
                </Button>
              </TableCell>
            </TableRow>
            <TableRow
              v-for="payment in filteredPayments"
              :key="payment.id"
              :class="
                getDaysLeft(payment.next_payment_date) <= 3
                  ? 'bg-red-50 dark:bg-red-950/20'
                  : ''
              "
            >
              <TableCell class="font-medium">
                <div class="flex items-center">
                  <Avatar class="h-8 w-8 mr-2">
                    <AvatarFallback>{{
                      getInitials(
                        payment.student?.first_name || "",
                        payment.student?.last_name || ""
                      )
                    }}</AvatarFallback>
                  </Avatar>
                  {{ payment.student?.first_name }}
                  {{ payment.student?.last_name }}
                </div>
              </TableCell>
              <TableCell>{{ formatCurrency(payment.amount) }}</TableCell>
              <TableCell>{{ formatDate(payment.payment_date) }}</TableCell>
              <TableCell>
                <Badge
                  :variant="
                    getDaysLeft(payment.next_payment_date) <= 3
                      ? 'destructive'
                      : 'default'
                  "
                >
                  {{ formatDate(payment.next_payment_date) }}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  :variant="
                    getDaysLeft(payment.next_payment_date) <= 3
                      ? 'destructive'
                      : 'outline'
                  "
                >
                  {{ getDaysLeft(payment.next_payment_date) }} kun
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  @click="openContactModal(payment)"
                  :class="{
                    'text-green-600 hover:text-green-700':
                      contactStatus[payment.id],
                    'text-gray-400 hover:text-gray-500':
                      !contactStatus[payment.id],
                  }"
                >
                  <Icon
                    :name="
                      contactStatus[payment.id]
                        ? 'lucide:check-circle'
                        : 'lucide:plus-circle'
                    "
                    class="h-4 w-4"
                  />
                  <span class="sr-only">
                    {{
                      contactStatus[payment.id]
                        ? "Aloqa ma'lumotlarini ko'rish/tahrirlash"
                        : "Aloqa qilish"
                    }}
                  </span>
                </Button>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="sendReminder(payment)"
                  >
                    <Icon name="lucide:bell" class="h-4 w-4" />
                    <span class="sr-only">Eslatma yuborish</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon">
                        <Icon name="lucide:more-vertical" class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem @click="viewPaymentHistory(payment)">
                        <Icon name="lucide:history" class="mr-2 h-4 w-4" />
                        To'lovlar tarixini ko'rish
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="extendDueDate(payment)">
                        <Icon
                          name="lucide:calendar-plus"
                          class="mr-2 h-4 w-4"
                        />
                        Muddatni uzaytirish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <!-- Record Payment Dialog -->
    <Dialog v-model:open="recordDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>To'lovni qayd qilish</DialogTitle>
          <DialogDescription>
            Ushbu talaba uchun yangi to'lovni qayd qilish
          </DialogDescription>
        </DialogHeader>
        <form v-if="selectedPayment" @submit.prevent="submitPayment">
          <div class="grid gap-4 py-4">
            <div class="flex items-center gap-4 mb-2">
              <Avatar class="h-10 w-10">
                <AvatarFallback>{{
                  getInitials(
                    selectedPayment.student?.first_name || "",
                    selectedPayment.student?.last_name || ""
                  )
                }}</AvatarFallback>
              </Avatar>
              <div>
                <h3 class="font-medium">
                  {{ selectedPayment.student?.first_name }}
                  {{ selectedPayment.student?.last_name }}
                </h3>
                <p class="text-sm text-muted-foreground">
                  Muddat: {{ formatDate(selectedPayment.next_payment_date) }}
                </p>
              </div>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="amount" class="text-right">Summa</Label>
              <Input
                id="amount"
                v-model="newPayment.amount"
                type="number"
                step="0.01"
                class="col-span-3"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="payment_method" class="text-right">Usul</Label>
              <Select v-model="newPayment.payment_method" class="col-span-3">
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="To'lov usulini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Naqd">Naqd</SelectItem>
                  <SelectItem value="Karta">Karta</SelectItem>
                  <SelectItem value="Click">Click</SelectItem>
                  <SelectItem value="Payme">Payme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="payment_date" class="text-right">Sana</Label>
              <Input
                id="payment_date"
                v-model="newPayment.payment_date"
                type="date"
                class="col-span-3"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="next_payment_date" class="text-right"
                >Keyingi to'lov</Label
              >
              <Input
                id="next_payment_date"
                v-model="newPayment.next_payment_date"
                type="date"
                class="col-span-3"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="notes" class="text-right">Izohlar</Label>
              <Textarea
                id="notes"
                v-model="newPayment.notes"
                class="col-span-3"
                placeholder="To'lov tafsilotlari"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              @click="recordDialog = false"
              >Bekor qilish</Button
            >
            <Button type="submit" :disabled="isSubmitting">
              <Icon
                v-if="isSubmitting"
                name="lucide:loader-2"
                class="mr-2 h-4 w-4 animate-spin"
              />
              {{
                isSubmitting ? "Qayta ishlanmoqda..." : "To'lovni qayd qilish"
              }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Extend Due Date Dialog -->
    <Dialog v-model:open="extendDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Muddatni uzaytirish</DialogTitle>
          <DialogDescription>
            Ushbu talaba uchun to'lov muddatini o'zgartirish
          </DialogDescription>
        </DialogHeader>
        <form v-if="selectedPayment" @submit.prevent="submitExtension">
          <div class="grid gap-4 py-4">
            <div class="flex items-center gap-4 mb-2">
              <Avatar class="h-10 w-10">
                <AvatarFallback>{{
                  getInitials(
                    selectedPayment.student?.first_name || "",
                    selectedPayment.student?.last_name || ""
                  )
                }}</AvatarFallback>
              </Avatar>
              <div>
                <h3 class="font-medium">
                  {{ selectedPayment.student?.first_name }}
                  {{ selectedPayment.student?.last_name }}
                </h3>
                <p class="text-sm text-muted-foreground">
                  Hozirgi muddat:
                  {{ formatDate(selectedPayment.next_payment_date) }}
                </p>
              </div>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="new_due_date" class="text-right">Yangi muddat</Label>
              <Input
                id="new_due_date"
                v-model="extendedDate"
                type="date"
                class="col-span-3"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="extension_reason" class="text-right">Sabab</Label>
              <Textarea
                id="extension_reason"
                v-model="extensionReason"
                class="col-span-3"
                placeholder="Uzaytirilish sababi"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              @click="extendDialog = false"
              >Bekor qilish</Button
            >
            <Button type="submit" :disabled="isSubmitting">
              <Icon
                v-if="isSubmitting"
                name="lucide:loader-2"
                class="mr-2 h-4 w-4 animate-spin"
              />
              {{ isSubmitting ? "Yangilanmoqda..." : "Muddatni uzaytirish" }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Notification Dialog for reminders -->
    <Dialog v-model:open="reminderDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>To'lov eslatmasi yuborish</DialogTitle>
          <DialogDescription>
            Talabaga kelayotgan to'lov haqida xabar berish
          </DialogDescription>
        </DialogHeader>
        <div v-if="selectedPayment" class="py-4">
          <div class="flex items-center gap-4 mb-4">
            <Avatar class="h-10 w-10">
              <AvatarFallback>{{
                getInitials(
                  selectedPayment.student?.first_name || "",
                  selectedPayment.student?.last_name || ""
                )
              }}</AvatarFallback>
            </Avatar>
            <div>
              <h3 class="font-medium">
                {{ selectedPayment.student?.first_name }}
                {{ selectedPayment.student?.last_name }}
              </h3>
              <p class="text-sm text-muted-foreground">
                {{ selectedPayment.student?.phone }}
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <RadioGroup v-model="reminderMethod">
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="sms" id="r1" />
                <Label for="r1">SMS</Label>
              </div>
            </RadioGroup>

            <div class="p-3 bg-muted rounded-md">
              <p class="text-sm">
                To'lov eslatmasi: muddat
                <span class="font-medium">{{
                  formatDate(selectedPayment.next_payment_date)
                }}</span>
                ({{ getDaysLeft(selectedPayment.next_payment_date) }} kun qoldi)
              </p>
            </div>

            <Textarea
              v-model="reminderMessage"
              placeholder="Maxsus xabar (ixtiyoriy)"
              class="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            @click="reminderDialog = false"
            >Bekor qilish</Button
          >
          <Button @click="sendReminderNotification" :disabled="isSubmitting">
            <Icon
              v-if="isSubmitting"
              name="lucide:loader-2"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ isSubmitting ? "Yuborilmoqda..." : "Eslatma yuborish" }}
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
        <div v-if="selectedPayment" class="py-4">
          <div class="flex items-center gap-4 mb-6">
            <Avatar class="h-12 w-12">
              <AvatarFallback>{{
                getInitials(
                  selectedPayment.student?.first_name || "",
                  selectedPayment.student?.last_name || ""
                )
              }}</AvatarFallback>
            </Avatar>
            <div>
              <h3 class="font-medium text-lg">
                {{ selectedPayment.student?.first_name }}
                {{ selectedPayment.student?.last_name }}
              </h3>
              <p class="text-sm text-muted-foreground">
                To'lov summasi: {{ formatCurrency(selectedPayment.amount) }}
              </p>
              <p class="text-sm text-muted-foreground">
                Muddat: {{ formatDate(selectedPayment.next_payment_date) }}
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
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

import { useSMS } from "~/composables/useSMS";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const { apiService } = useAuth();
const { toast } = useToast();
const router = useRouter();
const route = useRoute();

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
const isSubmitting = ref(false);

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
const reminderMethod = ref("sms");
const reminderMessage = ref("");

// Contact form state
const contactDialog = ref(false);
const isSubmittingContact = ref(false);
const contactActions = ref<Record<string, any[]>>({}); // Store full payment action data
const selectedAction = ref<any | null>(null); // Currently selected action for editing
const isEditMode = ref(false); // Track if modal is in edit mode
const contactForm = reactive({
  action_type: "sms" as "sms" | "phone" | "telegram" | "in_person",
  stage: "upcoming" as "upcoming" | "debitor",
  message: "",
  next_action_date: "",
});

// Computed property to get contact status (boolean) from actions data
const contactStatus = computed(() => {
  const status: Record<string, boolean> = {};
  Object.keys(contactActions.value).forEach((paymentId) => {
    const actions = contactActions.value[paymentId];
    status[paymentId] = actions ? actions.length > 0 : false;
  });
  return status;
});

// Computed
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
        payment.amount.toString().includes(search.value)
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

// Functions
const loadContactStatuses = async () => {
  if (!upcomingPayments.value.length) return;

  const { checkPaymentContact } = useSMS();
  const actions: Record<string, any[]> = {};

  try {
    await Promise.all(
      upcomingPayments.value.map(async (payment) => {
        const contacts = await checkPaymentContact(payment.id);
        actions[payment.id] = contacts || [];
      })
    );
    contactActions.value = actions;
  } catch (error) {
    console.error("Failed to load contact statuses:", error);
  }
};
const openContactModal = (payment: any) => {
  selectedPayment.value = payment;

  const existingActions = contactActions.value[payment.id];

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
    const { auth } = useAuth();

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

    // Update contact status
    contactStatus.value[selectedPayment.value.id] = true;

    toast({
      title: "Muvaffaqiyat",
      description: "Aloqa ma'lumoti muvaffaqiyatli saqlandi",
    });

    contactDialog.value = false;

    // Reload upcoming payments and contact statuses
    await loadUpcomingPayments();
  } catch (error) {
    console.error("Failed to create contact action:", error);
    toast({
      title: "Xatolik",
      description: "Aloqa ma'lumotini saqlashda xatolik yuz berdi",
      variant: "destructive",
    });
  } finally {
    isSubmittingContact.value = false;
  }
};

// Methods
const loadUpcomingPayments = async () => {
  isLoading.value = true;
  try {
    const response = await api.get<any[]>(
      apiService.value,
      `/student-payments/upcoming?days=${selectedDays.value}`
    );

    if (Array.isArray(response)) {
      upcomingPayments.value = response;
      // Load contact statuses after payments are loaded
      await loadContactStatuses();
    } else {
      upcomingPayments.value = [];
      toast({
        title: "Ogohlantirish",
        description: "Kelayotgan to'lovlar topilmadi",
      });
    }
  } catch (error) {
    console.error("Failed to load upcoming payments:", error);
    toast({
      title: "Xatolik",
      description:
        "Kelayotgan to'lovlarni yuklashda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
    upcomingPayments.value = [];
  } finally {
    isLoading.value = false;
  }
};

const refreshData = () => {
  loadUpcomingPayments();
};

const submitPayment = async () => {
  if (!selectedPayment.value) return;

  isSubmitting.value = true;
  try {
    const response = await api.post<any>(
      apiService.value,
      "/student-payments",
      newPayment
    );

    toast({
      title: "Muvaffaqiyat",
      description: "To'lov muvaffaqiyatli qayd qilindi",
    });

    // Close dialog and refresh
    recordDialog.value = false;
    loadUpcomingPayments();
  } catch (error) {
    console.error("Failed to record payment:", error);
    toast({
      title: "Xatolik",
      description: "To'lovni qayd qilishda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
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
    const response = await api.patch<any>(
      apiService.value,
      `/student-payments/${selectedPayment.value.id}`,
      {
        next_payment_date: extendedDate.value,
        notes: extensionReason.value
          ? `Due date extended: ${extensionReason.value}`
          : selectedPayment.value.notes || "",
      }
    );

    toast({
      title: "Muvaffaqiyat",
      description: "Muddat muvaffaqiyatli uzaytirildi",
    });

    // Close dialog and refresh
    extendDialog.value = false;
    loadUpcomingPayments();
  } catch (error) {
    console.error("Failed to extend due date:", error);
    toast({
      title: "Xatolik",
      description: "Muddatni uzaytirishda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
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
    // Only handle SMS reminders with the new SMS implementation
    if (reminderMethod.value === "sms") {
      const { sendSMS } = useSMS();

      // Get student's phone number
      const phoneNumber = selectedPayment.value.student?.phone;
      if (!phoneNumber) {
        throw new Error("Talabaning telefon raqami mavjud emas");
      }

      // Send SMS using the new endpoint
      await sendSMS({
        mobile_phone: phoneNumber,
        message: reminderMessage.value || "To'lov eslatmasi",
      });

      toast({
        title: "Muvaffaqiyat",
        description: "SMS muvaffaqiyatli yuborildi",
      });
    } else {
      // For phone calls and in-person meetings, just show a notification
      // since these don't require API calls to SMS service
      toast({
        title: "Eslatma",
        description: `${
          reminderMethod.value === "phone" ? "Qo'ng'iroq" : "Shaxsiy uchrashuv"
        } eslatmasi saqlandi`,
      });
    }

    reminderDialog.value = false;
  } catch (error) {
    console.error("Failed to send reminder:", error);
    toast({
      title: "Xatolik",
      description: "Eslatma yuborishda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const viewPaymentHistory = (payment: any) => {
  // Navigate to payments page filtered for this student
  router.push({
    path: "/payments",
    query: {
      search: `${payment.student?.first_name}`,
    },
  });
};

const callStudent = (payment: any) => {
  if (!payment.student?.phone) {
    toast({
      title: "Xatolik",
      description: "Ushbu talaba uchun telefon raqami mavjud emas",
      variant: "destructive",
    });
    return;
  }

  // In a real app, you might integrate with a calling service
  // For now, we'll just show a toast
  toast({
    title: "Talabaga qo'ng'iroq qilinmoqda",
    description: `${payment.student.phone} raqamiga qo'ng'iroq...`,
  });
};

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
  return new Date(dateString).toLocaleDateString();
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
  // Get days parameter from URL if available
  const route = useRoute();
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

// Watch search input
watch(search, (newVal) => {
  // No need to reload from API, filtering is done client-side
});
</script>
