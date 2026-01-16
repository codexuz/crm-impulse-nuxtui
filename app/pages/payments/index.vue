<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">To'lovlar</h2>
        <p class="text-muted-foreground">
          Talabalar to'lovlarini kuzatish va boshqarish
        </p>
      </div>
      <Dialog>
        <DialogTrigger as-child>
          <Button>
            <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
            To'lov qo'shish
          </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Yangi to'lov qo'shish</DialogTitle>
            <DialogDescription>
              Talaba uchun yangi to'lovni qayd qilish
            </DialogDescription>
          </DialogHeader>
          <form @submit.prevent="addPayment">
            <div class="grid gap-4 py-4">
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="student_id" class="text-right">Talaba</Label>
                <div class="col-span-3">
                  <div class="mb-2">
                    <Input
                      v-model="studentSearch"
                      placeholder="Talabalarni qidirish..."
                      class="w-full"
                    />
                  </div>
                  <Select v-model="newPayment.student_id" class="w-full">
                    <SelectTrigger id="student_id">
                      <SelectValue placeholder="Talabani tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="student in filteredStudents"
                        :key="student.user_id"
                        :value="student.user_id"
                      >
                        {{ student.first_name }} {{ student.last_name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                <Label for="status" class="text-right">Holat</Label>
                <Select v-model="newPayment.status" class="col-span-3">
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Holatni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Bajarildi</SelectItem>
                    <SelectItem value="pending">Kutilmoqda</SelectItem>
                    <SelectItem value="failed">Muvaffaqiyatsiz</SelectItem>
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
              <Button type="submit" :disabled="isLoading">
                <Icon
                  v-if="isLoading"
                  name="lucide:loader-2"
                  class="mr-2 h-4 w-4 animate-spin"
                />
                {{ isLoading ? "Yaratilmoqda..." : "To'lovni qayd qilish" }}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>

    <div class="space-y-4">
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between gap-2">
          <Input
            v-model="search"
            placeholder="To'lovlarni qidirish..."
            class="max-w-sm"
          />
        </div>

        <!-- Filters -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div>
            <Label class="text-sm mb-2">To'lov sanasi</Label>
            <Input
              v-model="filters.payment_date"
              type="date"
              placeholder="To'lov sanasi"
            />
          </div>
          <div>
            <Label class="text-sm mb-2">Holat</Label>
            <Select v-model="filters.status">
              <SelectTrigger>
                <SelectValue placeholder="Barchasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="completed">Bajarildi</SelectItem>
                <SelectItem value="pending">Kutilmoqda</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label class="text-sm mb-2">To'lov usuli</Label>
            <Select v-model="filters.payment_method">
              <SelectTrigger>
                <SelectValue placeholder="Barchasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="Naqd">Naqd</SelectItem>
                <SelectItem value="Karta">Karta</SelectItem>
                <SelectItem value="Click">Click</SelectItem>
                <SelectItem value="Payme">Payme</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label class="text-sm mb-2">Yaratilgan sana</Label>
            <Input
              v-model="filters.createdAt"
              type="date"
              placeholder="Yaratilgan sana"
            />
          </div>
          <div>
            <Label class="text-sm mb-2">Keyingi to'lov sanasi</Label>
            <Input
              v-model="filters.next_payment_date"
              type="date"
              placeholder="Keyingi to'lov sanasi"
            />
          </div>
        </div>

        <!-- Clear Filters Button -->
        <div v-if="hasActiveFilters" class="flex justify-end">
          <Button variant="outline" size="sm" @click="clearFilters">
            <Icon name="lucide:x" class="mr-2 h-4 w-4" />
            Filtrlarni tozalash
          </Button>
        </div>
      </div>

      <!-- Payments Table -->
      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Talaba</TableHead>
              <TableHead>Summa</TableHead>
              <TableHead>Usul</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead>Keyingi to'lov</TableHead>
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
                  To'lovlar yuklanmoqda...
                </p>
              </TableCell>
            </TableRow>
            <TableRow v-else-if="payments.length === 0">
              <TableCell colspan="7" class="text-center py-10">
                <div class="flex justify-center">
                  <Icon
                    name="lucide:credit-card-off"
                    class="h-8 w-8 text-muted-foreground"
                  />
                </div>
                <p class="text-muted-foreground mt-2">To'lovlar topilmadi</p>
                <Button variant="link" @click="loadPayments" class="mt-2">
                  Ma'lumotlarni yangilash
                </Button>
              </TableCell>
            </TableRow>
            <TableRow v-for="payment in payments" :key="payment.id">
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
              <TableCell>{{ payment.payment_method }}</TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(payment.status)">
                  {{ payment.status }}
                </Badge>
              </TableCell>
              <TableCell>{{ formatDate(payment.payment_date) }}</TableCell>
              <TableCell>{{ formatDate(payment.next_payment_date) }}</TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="viewPayment(payment)"
                  >
                    <Icon name="lucide:eye" class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="editPayment(payment)"
                  >
                    <Icon name="lucide:pencil" class="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon">
                        <Icon name="lucide:more-vertical" class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        @click="updatePaymentStatus(payment, 'completed')"
                      >
                        <Icon name="lucide:check-circle" class="mr-2 h-4 w-4" />
                        Bajarildi deb belgilash
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        @click="updatePaymentStatus(payment, 'pending')"
                      >
                        <Icon name="lucide:clock" class="mr-2 h-4 w-4" />
                        Kutilmoqda deb belgilash
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        @click="updatePaymentStatus(payment, 'failed')"
                      >
                        <Icon name="lucide:x-circle" class="mr-2 h-4 w-4" />
                        Muvaffaqiyatsiz deb belgilash
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem @click="downloadReceipt(payment)">
                        <Icon name="lucide:download" class="mr-2 h-4 w-4" />
                        Kvitansiyani yuklash
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        @click="deletePayment(payment)"
                        class="text-destructive focus:text-destructive"
                      >
                        <Icon name="lucide:trash-2" class="mr-2 h-4 w-4" />
                        O'chirish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between py-4">
        <div class="text-sm text-muted-foreground">
          <span class="font-medium">{{ paginationStart }}</span> dan
          <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
          <span class="font-medium">{{ totalItems }}</span> to'lov
        </div>

        <Pagination
          :items-per-page="limit"
          :total="totalItems"
          :default-page="page"
        >
          <PaginationContent>
            <PaginationPrevious
              :disabled="page === 1"
              @click="navigateToPage(page - 1)"
            />

            <PaginationItem
              v-for="pageNum in displayedPages"
              :key="pageNum"
              :value="pageNum"
              :is-active="pageNum === page"
              @click="navigateToPage(pageNum)"
            >
              {{ pageNum }}
            </PaginationItem>

            <PaginationEllipsis v-if="showEndEllipsis" />

            <PaginationNext
              :disabled="page === totalPages"
              @click="navigateToPage(page + 1)"
            />
          </PaginationContent>
        </Pagination>
      </div>
    </div>

    <!-- View Payment Dialog -->
    <Dialog v-model:open="viewDialog">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>To'lov ma'lumotlari</DialogTitle>
          <DialogDescription>
            To'lov haqida batafsil ma'lumot
          </DialogDescription>
        </DialogHeader>
        <div v-if="selectedPayment" class="py-4">
          <div class="flex items-center gap-4 mb-4">
            <Avatar class="h-16 w-16">
              <AvatarFallback class="text-lg">
                {{
                  getInitials(
                    selectedPayment.student?.first_name || "",
                    selectedPayment.student?.last_name || ""
                  )
                }}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 class="text-lg font-semibold">
                {{ selectedPayment.student?.first_name }}
                {{ selectedPayment.student?.last_name }}
              </h3>
              <p class="text-muted-foreground">
                {{ selectedPayment.student?.phone }}
              </p>
            </div>
            <Badge
              :variant="getStatusVariant(selectedPayment.status)"
              class="ml-auto"
            >
              {{ selectedPayment.status }}
            </Badge>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="font-medium text-sm">To'lov ma'lumotlari</h4>
              <div class="space-y-1 mt-2">
                <div class="flex">
                  <span class="text-muted-foreground w-28">Summa:</span>
                  <span class="font-semibold">{{
                    formatCurrency(selectedPayment.amount)
                  }}</span>
                </div>
                <div class="flex">
                  <span class="text-muted-foreground w-28">Usul:</span>
                  <span>{{ selectedPayment.payment_method }}</span>
                </div>
                <div class="flex">
                  <span class="text-muted-foreground w-28">To'lov sanasi:</span>
                  <span>{{ formatDate(selectedPayment.payment_date) }}</span>
                </div>
                <div class="flex">
                  <span class="text-muted-foreground w-28"
                    >Keyingi to'lov:</span
                  >
                  <span>{{
                    formatDate(selectedPayment.next_payment_date)
                  }}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 class="font-medium text-sm">Tizim ma'lumotlari</h4>
              <div class="space-y-1 mt-2">
                <div class="flex">
                  <span class="text-muted-foreground w-28">To'lov ID:</span>
                  <span class="text-xs font-mono">{{
                    selectedPayment.id
                  }}</span>
                </div>
                <div class="flex">
                  <span class="text-muted-foreground w-28">Menejer:</span>
                  <span
                    >{{ selectedPayment.manager?.first_name }}
                    {{ selectedPayment.manager?.last_name }}</span
                  >
                </div>
                <div class="flex">
                  <span class="text-muted-foreground w-28">Yaratilgan:</span>
                  <span>{{ formatDateTime(selectedPayment.createdAt) }}</span>
                </div>
                <div class="flex">
                  <span class="text-muted-foreground w-28">Yangilangan:</span>
                  <span>{{ formatDateTime(selectedPayment.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <h4 class="font-medium text-sm">Izohlar</h4>
            <div class="p-3 bg-muted/40 rounded-lg mt-2">
              {{ selectedPayment.notes || "Izoh yo'q" }}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="viewDialog = false">Yopish</Button>
          <Button
            variant="outline"
            @click="downloadReceipt(selectedPayment)"
            class="mr-2"
          >
            <Icon name="lucide:download" class="mr-2 h-4 w-4" />
            Kvitansiyani yuklash
          </Button>
          <Button @click="editPayment(selectedPayment)">Tahrirlash</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Payment Dialog -->
    <Dialog v-model:open="editDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>To'lovni tahrirlash</DialogTitle>
          <DialogDescription>To'lov ma'lumotlarini yangilash</DialogDescription>
        </DialogHeader>
        <form v-if="editingPayment" @submit.prevent="updatePayment">
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="edit_student_id" class="text-right">Talaba</Label>
              <div class="col-span-3">
                <div class="mb-2">
                  <Input
                    v-model="editStudentSearch"
                    placeholder="Talabalarni qidirish..."
                    class="w-full"
                  />
                </div>
                <Select v-model="editingPayment.student_id" class="w-full">
                  <SelectTrigger id="edit_student_id">
                    <SelectValue>
                      {{ editingPayment.student?.first_name }}
                      {{ editingPayment.student?.last_name }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="student in filteredEditStudents"
                      :key="student.user_id"
                      :value="student.user_id"
                    >
                      {{ student.first_name }} {{ student.last_name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="edit_amount" class="text-right">Summa</Label>
              <Input
                id="edit_amount"
                v-model="editingPayment.amount"
                type="number"
                step="0.01"
                class="col-span-3"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="edit_payment_method" class="text-right">Usul</Label>
              <Select
                v-model="editingPayment.payment_method"
                class="col-span-3"
              >
                <SelectTrigger id="edit_payment_method">
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
              <Label for="edit_status" class="text-right">Holat</Label>
              <Select v-model="editingPayment.status" class="col-span-3">
                <SelectTrigger id="edit_status">
                  <SelectValue placeholder="Holatni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Bajarildi</SelectItem>
                  <SelectItem value="pending">Kutilmoqda</SelectItem>
                  <SelectItem value="failed">Muvaffaqiyatsiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="edit_payment_date" class="text-right">Sana</Label>
              <Input
                id="edit_payment_date"
                v-model="editingPayment.payment_date"
                type="date"
                class="col-span-3"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="edit_next_payment_date" class="text-right"
                >Keyingi to'lov</Label
              >
              <Input
                id="edit_next_payment_date"
                v-model="editingPayment.next_payment_date"
                type="date"
                class="col-span-3"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="edit_notes" class="text-right">Izohlar</Label>
              <Textarea
                id="edit_notes"
                v-model="editingPayment.notes"
                class="col-span-3"
                placeholder="To'lov tafsilotlari"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" @click="editDialog = false"
              >Bekor qilish</Button
            >
            <Button type="submit" :disabled="isUpdating">
              <Icon
                v-if="isUpdating"
                name="lucide:loader-2"
                class="mr-2 h-4 w-4 animate-spin"
              />
              {{ isUpdating ? "Yangilanmoqda..." : "To'lovni yangilash" }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Confirmation Dialog -->
    <AlertDialog v-model:open="confirmDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
          <AlertDialogDescription>
            Bu amalni qaytarib bo'lmaydi. To'lov yozuvi butunlay o'chiriladi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            @click="confirmDelete"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Icon
              v-if="isDeleting"
              name="lucide:loader-2"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ isDeleting ? "O'chirilmoqda..." : "O'chirish" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from "vue";
import type { StudentPayment, Student } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const { apiService } = useAuth();
const { toast } = useToast();

// Payments data
const payments = ref<any[]>([]); // Using any as the API response includes nested objects
const isLoading = ref(true);
const page = ref(1);
const limit = ref(10);
const totalItems = ref(0);
const totalPages = ref(1);

// Students data for the dropdown
const students = ref<Student[]>([]);

// Filters and search
const search = ref("");
const filters = reactive({
  completed: true,
  pending: true,
  failed: true,
  payment_date: "",
  payment_method: "all",
  createdAt: "",
  next_payment_date: "",
  status: "all",
});

// Selected payment data
const selectedPayment = ref<any | null>(null);
const viewDialog = ref(false);
const editDialog = ref(false);
const confirmDialog = ref(false);
const isUpdating = ref(false);
const isDeleting = ref(false);
const editingPayment = ref<any | null>(null);
const paymentToDelete = ref<any | null>(null);

// Student search for payment dialogs
const studentSearch = ref("");
const editStudentSearch = ref("");

// New payment form
const newPayment = reactive({
  student_id: "",
  amount: 0,
  status: "completed" as "completed" | "pending" | "failed",
  payment_method: "Naqd" as "Naqd" | "Karta" | "Click" | "Payme",
  payment_date: new Date().toISOString().split("T")[0],
  next_payment_date: new Date(new Date().setMonth(new Date().getMonth() + 1))
    .toISOString()
    .split("T")[0],
  notes: "",
});

// Computed
const filteredStudents = computed(() => {
  if (!studentSearch.value) {
    return students.value;
  }

  const searchLower = studentSearch.value.toLowerCase();
  return students.value.filter(
    (student) =>
      student.first_name?.toLowerCase().includes(searchLower) ||
      student.last_name?.toLowerCase().includes(searchLower) ||
      `${student.first_name} ${student.last_name}`
        .toLowerCase()
        .includes(searchLower) ||
      student.phone?.includes(studentSearch.value)
  );
});

const filteredEditStudents = computed(() => {
  if (!editStudentSearch.value) {
    return students.value;
  }

  const searchLower = editStudentSearch.value.toLowerCase();
  return students.value.filter(
    (student) =>
      student.first_name?.toLowerCase().includes(searchLower) ||
      student.last_name?.toLowerCase().includes(searchLower) ||
      `${student.first_name} ${student.last_name}`
        .toLowerCase()
        .includes(searchLower) ||
      student.phone?.includes(editStudentSearch.value)
  );
});

const hasActiveFilters = computed(() => {
  return (
    filters.payment_date !== "" ||
    (filters.payment_method !== "all" && filters.payment_method !== "") ||
    filters.createdAt !== "" ||
    filters.next_payment_date !== "" ||
    (filters.status !== "all" && filters.status !== "")
  );
});

const clearFilters = () => {
  filters.payment_date = "";
  filters.payment_method = "all";
  filters.createdAt = "";
  filters.next_payment_date = "";
  filters.status = "all";
};

const paginationStart = computed(() => {
  return totalItems.value === 0 ? 0 : (page.value - 1) * limit.value + 1;
});

const paginationEnd = computed(() => {
  return Math.min(page.value * limit.value, totalItems.value);
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
  if (page.value <= 3) {
    pages.push(2, 3, 4);
  }
  // If we're at the end, show the last few pages
  else if (page.value >= totalPages.value - 2) {
    pages.push(
      totalPages.value - 3,
      totalPages.value - 2,
      totalPages.value - 1
    );
  }
  // Otherwise show current page and surrounding pages
  else {
    pages.push(page.value - 1, page.value, page.value + 1);
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

// Methods
const loadPayments = async () => {
  isLoading.value = true;
  try {
    // Build query parameters
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: limit.value.toString(),
    });

    // Add search query if present
    if (search.value) {
      params.append("query", search.value);
    }

    // Add filters
    if (filters.status !== "all") {
      params.append("status", filters.status);
    }

    if (filters.payment_method !== "all") {
      params.append("payment_method", filters.payment_method);
    }

    if (filters.payment_date) {
      params.append("payment_date", filters.payment_date);
    }

    if (filters.createdAt) {
      params.append("created_at", filters.createdAt);
    }

    if (filters.next_payment_date) {
      params.append("next_payment_date", filters.next_payment_date);
    }

    // Load payments with pagination
    const response = await api.get<{
      data: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, `/student-payments?${params.toString()}`);

    payments.value = response.data || [];
    totalItems.value = response.total || 0;
    totalPages.value = response.totalPages || 1;
  } catch (error) {
    console.error("Failed to load payments:", error);
    toast({
      title: "Xatolik",
      description: "To'lovlarni yuklashda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1; // Reset to first page on search
    loadPayments();
  }, 500);
};

const navigateToPage = (newPage: number) => {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
};

const loadStudents = async () => {
  try {
    const params = new URLSearchParams({
      page: "1",
      limit: "1000", // Get all students for dropdown
    });
    const response = await api.get<{
      data: Student[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, `/users/students?${params.toString()}`);
    students.value = response.data || [];
  } catch (error) {
    console.error("Failed to load students:", error);
    toast({
      title: "Xatolik",
      description: "Talabalarni yuklashda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
  }
};

const addPayment = async () => {
  isLoading.value = true;
  try {
    await api.post<any>(apiService.value, "/student-payments", newPayment);

    // Reload payments to get fresh data with nested relationships
    await loadPayments();

    toast({
      title: "Muvaffaqiyat",
      description: "To'lov muvaffaqiyatli qayd qilindi",
    });

    // Reset form and search
    studentSearch.value = "";
    newPayment.student_id = "";
    newPayment.amount = 0;
    newPayment.status = "completed";
    newPayment.payment_method = "Naqd";
    newPayment.payment_date = new Date().toISOString().split("T")[0];
    newPayment.next_payment_date = new Date(
      new Date().setMonth(new Date().getMonth() + 1)
    )
      .toISOString()
      .split("T")[0];
    newPayment.notes = "";
  } catch (error) {
    console.error("Failed to create payment:", error);
    toast({
      title: "Xatolik",
      description: "To'lovni qayd qilishda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const viewPayment = (payment: any) => {
  selectedPayment.value = payment;
  viewDialog.value = true;
};

const editPayment = (payment: any) => {
  if (!payment) return;

  // Close view dialog if open
  viewDialog.value = false;

  // Reset student search for edit dialog
  editStudentSearch.value = "";

  // Clone payment data for editing
  editingPayment.value = { ...payment };
  editDialog.value = true;
};

const updatePayment = async () => {
  if (!editingPayment.value || !editingPayment.value.id) return;

  isUpdating.value = true;
  try {
    const payload = {
      student_id: editingPayment.value.student_id,
      amount: editingPayment.value.amount,
      status: editingPayment.value.status,
      payment_method: editingPayment.value.payment_method,
      payment_date: editingPayment.value.payment_date,
      next_payment_date: editingPayment.value.next_payment_date,
      notes: editingPayment.value.notes,
    };

    await api.patch<any>(
      apiService.value,
      `/student-payments/${editingPayment.value.id}`,
      payload
    );

    // Reload payments to get fresh data
    await loadPayments();

    toast({
      title: "Muvaffaqiyat",
      description: "To'lov muvaffaqiyatli yangilandi",
    });

    editDialog.value = false;
  } catch (error) {
    console.error("Failed to update payment:", error);
    toast({
      title: "Xatolik",
      description: "To'lovni yangilashda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
  } finally {
    isUpdating.value = false;
  }
};

const updatePaymentStatus = async (
  payment: any,
  status: "completed" | "pending" | "failed"
) => {
  try {
    await api.patch<any>(apiService.value, `/student-payments/${payment.id}`, {
      status,
    });

    // Reload payments to get fresh data
    await loadPayments();

    toast({
      title: "Muvaffaqiyat",
      description: `To'lov ${translateStatus(status)} deb belgilandi`,
    });
  } catch (error) {
    console.error("Failed to update payment status:", error);
    toast({
      title: "Xatolik",
      description:
        "To'lov holatini yangilashda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
  }
};

const deletePayment = (payment: any) => {
  paymentToDelete.value = payment;
  confirmDialog.value = true;
};

const confirmDelete = async () => {
  if (!paymentToDelete.value) return;

  isDeleting.value = true;
  try {
    await api.delete<void>(
      apiService.value,
      `/student-payments/${paymentToDelete.value.id}`
    );

    // Reload payments to get fresh data
    await loadPayments();

    toast({
      title: "Muvaffaqiyat",
      description: "To'lov muvaffaqiyatli o'chirildi",
    });

    confirmDialog.value = false;
  } catch (error) {
    console.error("Failed to delete payment:", error);
    toast({
      title: "Xatolik",
      description: "To'lovni o'chirishda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
  } finally {
    isDeleting.value = false;
  }
};

const downloadReceipt = async (payment: any) => {
  try {
    toast({
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
      logoHeight + 19
    );
    pdf.text("Tel: +998 95 525 99 66", 5, logoHeight + 23);
    pdf.text(
      `Menejer: ${payment.manager?.first_name || ""} ${
        payment.manager?.last_name || ""
      }`,
      5,
      logoHeight + 27
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
      logoHeight + 35
    );
    pdf.text(`To'lov usuli: ${payment.payment_method}`, 5, logoHeight + 39);
    pdf.text(
      `To'lov sanasi: ${formatDate(payment.payment_date)}`,
      5,
      logoHeight + 43
    );
    pdf.text(`Holat: ${translateStatus(payment.status)}`, 5, logoHeight + 47);
    pdf.text(
      `Keyingi to'lov: ${formatDate(payment.next_payment_date)}`,
      5,
      logoHeight + 51
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
      { align: "center" }
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

    toast({
      title: "Muvaffaqiyat",
      description: "Kvitansiya muvaffaqiyatli yuklandi",
    });
  } catch (error) {
    console.error("Failed to generate receipt PDF:", error);
    toast({
      title: "Xatolik",
      description: "Kvitansiyani yaratishda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
  }
};

// Helper function to translate status to Uzbek for receipt
const translateStatus = (status: string): string => {
  switch (status) {
    case "completed":
      return "To'langan";
    case "pending":
      return "Kutilmoqda";
    case "failed":
      return "Bekor qilingan";
    default:
      return status;
  }
};

// Helper functions
const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
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

const getStatusVariant = (status: string): string => {
  switch (status) {
    case "completed":
      return "default";
    case "pending":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
};

// Load data on component mount
onMounted(() => {
  loadPayments();
  loadStudents();
});

// Watch for search changes with debouncing
watch(search, () => {
  debouncedSearch();
});

// Watch for filter changes to reload data
watch(
  [filters],
  () => {
    page.value = 1; // Reset to first page
    loadPayments();
  },
  { deep: true }
);

// Watch for page changes
watch(page, () => {
  loadPayments();
});
</script>
