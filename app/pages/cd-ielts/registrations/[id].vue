<template>
  <div class="container py-10 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="goBack">
          <Icon name="lucide:arrow-left" class="h-5 w-5" />
        </Button>
        <div>
          <h1 class="text-3xl font-bold tracking-tight">
            Ro'yxatdan o'tganlar
          </h1>
          <p class="text-muted-foreground" v-if="testInfo">
            {{ testInfo.title }} - {{ formatDate(testInfo.exam_date) }}
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="refreshData">
          <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" />
          Yangilash
        </Button>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Jami ro'yxatlar</CardTitle>
          <Icon name="lucide:users" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ registrations.length }}</div>
          <p class="text-xs text-muted-foreground">Umumiy ro'yxatlar soni</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">To'langan</CardTitle>
          <Icon
            name="lucide:check-circle"
            class="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ paidCount }}</div>
          <p class="text-xs text-muted-foreground">
            To'lovlar amalga oshirilgan
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Kutilmoqda</CardTitle>
          <Icon name="lucide:clock" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ pendingCount }}</div>
          <p class="text-xs text-muted-foreground">To'lov kutilmoqda</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Bekor qilingan</CardTitle>
          <Icon name="lucide:x-circle" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ cancelledCount }}</div>
          <p class="text-xs text-muted-foreground">Bekor qilingan ro'yxatlar</p>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <Input
        v-model="searchQuery"
        placeholder="Ism, familiya yoki telefon raqam bo'yicha qidirish..."
        class="sm:max-w-md"
      >
        <template #leading>
          <Icon name="lucide:search" class="h-4 w-4" />
        </template>
      </Input>
      <Select v-model="statusFilter">
        <SelectTrigger class="sm:max-w-[200px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Barcha statuslar</SelectItem>
          <SelectItem value="paid">To'langan</SelectItem>
          <SelectItem value="pending">Kutilmoqda</SelectItem>
          <SelectItem value="cancelled">Bekor qilingan</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Table -->
    <Card>
      <CardHeader>
        <CardTitle>Ro'yxatdan o'tgan talabalar</CardTitle>
        <CardDescription>
          Ushbu test uchun ro'yxatdan o'tgan barcha talabalar ro'yxati
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Talaba</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ro'yxatdan o'tgan sana</TableHead>
              <TableHead class="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody v-if="!loading && paginatedRegistrations.length > 0">
            <TableRow
              v-for="registration in paginatedRegistrations"
              :key="registration.id"
            >
              <TableCell class="font-medium">
                {{ registration.student.first_name }}
                {{ registration.student.last_name }}
              </TableCell>
              <TableCell>{{ registration.student.phone || "N/A" }}</TableCell>
              <TableCell>{{
                registration.student.username || "N/A"
              }}</TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(registration.status)">
                  {{ getStatusLabel(registration.status) }}
                </Badge>
              </TableCell>
              <TableCell>{{
                formatDateTime(registration.createdAt)
              }}</TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="viewRegistration(registration)"
                  >
                    <Icon name="lucide:eye" class="h-4 w-4" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" size="icon">
                        <Icon name="lucide:more-vertical" class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel
                        >Statusni o'zgartirish</DropdownMenuLabel
                      >
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        @click="updateStatus(registration, 'paid')"
                        :disabled="registration.status === 'paid'"
                      >
                        <Icon
                          name="lucide:check-circle"
                          class="mr-2 h-4 w-4 text-green-600"
                        />
                        To'langan
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        @click="updateStatus(registration, 'pending')"
                        :disabled="registration.status === 'pending'"
                      >
                        <Icon
                          name="lucide:clock"
                          class="mr-2 h-4 w-4 text-yellow-600"
                        />
                        Kutilmoqda
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        @click="updateStatus(registration, 'cancelled')"
                        :disabled="registration.status === 'cancelled'"
                      >
                        <Icon
                          name="lucide:x-circle"
                          class="mr-2 h-4 w-4 text-red-600"
                        />
                        Bekor qilish
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        @click="confirmDelete(registration)"
                        class="text-destructive"
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
          <TableBody v-else-if="loading">
            <TableRow>
              <TableCell colspan="6" class="text-center py-10">
                Yuklanmoqda...
              </TableCell>
            </TableRow>
          </TableBody>
          <TableBody v-else>
            <TableRow>
              <TableCell colspan="6" class="text-center py-10">
                Ma'lumot topilmadi
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter class="flex items-center justify-between">
        <div class="text-sm text-muted-foreground">
          Ko'rsatilmoqda {{ paginationStart }} - {{ paginationEnd }} /
          {{ filteredRegistrations.length }} ta ro'yxat
        </div>
        <Pagination
          v-model:page="currentPage"
          :total="filteredRegistrations.length"
          :items-per-page="itemsPerPage"
          :sibling-count="1"
        >
          <PaginationContent>
            <PaginationPrevious
              :disabled="currentPage === 1"
              @click="currentPage = Math.max(1, currentPage - 1)"
            />

            <PaginationItem
              v-for="pageNum in displayedPages"
              :key="pageNum"
              :value="pageNum"
              :is-active="pageNum === currentPage"
              @click="currentPage = pageNum"
            >
              {{ pageNum }}
            </PaginationItem>

            <PaginationEllipsis v-if="showEndEllipsis" />

            <PaginationNext
              :disabled="currentPage === totalPages"
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
            />
          </PaginationContent>
        </Pagination>
      </CardFooter>
    </Card>

    <!-- View Dialog -->
    <Dialog v-model:open="isViewDialogOpen">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ro'yxat ma'lumotlari</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-4" v-if="selectedRegistration">
          <div class="grid grid-cols-3 gap-4">
            <span class="font-semibold">Talaba:</span>
            <span class="col-span-2">
              {{ selectedRegistration.student.first_name }}
              {{ selectedRegistration.student.last_name }}
            </span>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <span class="font-semibold">Telefon:</span>
            <span class="col-span-2">{{
              selectedRegistration.student.phone || "N/A"
            }}</span>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <span class="font-semibold">Username:</span>
            <span class="col-span-2">{{
              selectedRegistration.student.username || "N/A"
            }}</span>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <span class="font-semibold">Status:</span>
            <span class="col-span-2">
              <Badge :variant="getStatusVariant(selectedRegistration.status)">
                {{ getStatusLabel(selectedRegistration.status) }}
              </Badge>
            </span>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <span class="font-semibold">Ro'yxatdan o'tgan sana:</span>
            <span class="col-span-2">{{
              formatDateTime(selectedRegistration.createdAt)
            }}</span>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <span class="font-semibold">Oxirgi yangilanish:</span>
            <span class="col-span-2">{{
              formatDateTime(selectedRegistration.updatedAt)
            }}</span>
          </div>
        </div>
        <DialogFooter>
          <Button @click="isViewDialogOpen = false">Yopish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ro'yxatni o'chirish</AlertDialogTitle>
          <AlertDialogDescription>
            Haqiqatan ham bu ro'yxatni o'chirmoqchimisiz? Bu amalni ortga
            qaytarib bo'lmaydi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction @click="deleteRegistration"
            >O'chirish</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuth } from "~/composables/useAuth";
import { api } from "~/lib/api";
import { toast } from "vue-sonner";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  username: string | null;
}

interface Registration {
  id: string;
  student_id: string;
  cd_test_id: string;
  status: "paid" | "pending" | "cancelled";
  createdAt: string;
  updatedAt: string;
  student: Student;
}

interface TestInfo {
  id: string;
  title: string;
  exam_date: string;
  time: string;
  location: string;
  seats: number;
  price: number;
}

const { apiService } = useAuth();
const router = useRouter();
const route = useRoute();

// Get test ID from route params
const testId = computed(() => route.params.id as string);

// State variables
const registrations = ref<Registration[]>([]);
const testInfo = ref<TestInfo | null>(null);
const loading = ref(true);
const searchQuery = ref("");
const statusFilter = ref("all");
const currentPage = ref(1);
const itemsPerPage = 10;

// Dialog states
const isViewDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const selectedRegistration = ref<Registration | null>(null);

// Computed properties
const filteredRegistrations = computed(() => {
  return registrations.value.filter((registration) => {
    // Filter by search query
    const searchMatch =
      registration.student.first_name
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase()) ||
      registration.student.last_name
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase()) ||
      registration.student.phone
        ?.toLowerCase()
        .includes(searchQuery.value.toLowerCase()) ||
      registration.student.username
        ?.toLowerCase()
        .includes(searchQuery.value.toLowerCase());

    // Filter by status
    const statusMatch =
      statusFilter.value === "all" ||
      registration.status === statusFilter.value;

    return searchMatch && statusMatch;
  });
});

const paidCount = computed(() => {
  return registrations.value.filter((r) => r.status === "paid").length;
});

const pendingCount = computed(() => {
  return registrations.value.filter((r) => r.status === "pending").length;
});

const cancelledCount = computed(() => {
  return registrations.value.filter((r) => r.status === "cancelled").length;
});

const totalPages = computed(() => {
  return Math.max(
    1,
    Math.ceil(filteredRegistrations.value.length / itemsPerPage)
  );
});

const paginatedRegistrations = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredRegistrations.value.slice(startIndex, endIndex);
});

const paginationStart = computed(() => {
  return filteredRegistrations.value.length > 0
    ? (currentPage.value - 1) * itemsPerPage + 1
    : 0;
});

const paginationEnd = computed(() => {
  const end = currentPage.value * itemsPerPage;
  return Math.min(end, filteredRegistrations.value.length);
});

const displayedPages = computed(() => {
  const pages = [];
  const maxPagesToShow = 5;
  const halfRange = Math.floor(maxPagesToShow / 2);

  let startPage = Math.max(1, currentPage.value - halfRange);
  let endPage = Math.min(totalPages.value, startPage + maxPagesToShow - 1);

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return pages;
});

const showEndEllipsis = computed(() => {
  const lastDisplayedPage =
    displayedPages.value[displayedPages.value.length - 1];
  return (
    lastDisplayedPage !== undefined && lastDisplayedPage < totalPages.value
  );
});

// API Functions
const fetchRegistrations = async () => {
  loading.value = true;
  try {
    const response = await api.get<Registration[]>(
      apiService.value,
      `/cd-ielts/registrations/test/${testId.value}`
    );
    registrations.value = response || [];
  } catch (error) {
    console.error("Failed to fetch registrations:", error);
    toast.error("Ro'yxatlarni yuklashda xatolik yuz berdi");
    registrations.value = [];
  } finally {
    loading.value = false;
  }
};

const fetchTestInfo = async () => {
  try {
    const response = await api.get<TestInfo>(
      apiService.value,
      `/cd-ielts/tests/${testId.value}`
    );
    testInfo.value = response;
  } catch (error) {
    console.error("Failed to fetch test info:", error);
  }
};

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "paid":
      return "default";
    case "pending":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "paid":
      return "To'langan";
    case "pending":
      return "Kutilmoqda";
    case "cancelled":
      return "Bekor qilingan";
    default:
      return status;
  }
};

// Actions
const viewRegistration = (registration: Registration) => {
  selectedRegistration.value = registration;
  isViewDialogOpen.value = true;
};

const updateStatus = async (
  registration: Registration,
  newStatus: "paid" | "pending" | "cancelled"
) => {
  try {
    await api.patch(
      apiService.value,
      `/cd-ielts/registrations/${registration.id}`,
      { status: newStatus }
    );

    const statusLabel = getStatusLabel(newStatus);
    toast.success(`Status ${statusLabel} ga o'zgartirildi`);
    await fetchRegistrations();
  } catch (error) {
    console.error("Failed to update status:", error);
    toast.error("Statusni yangilashda xatolik yuz berdi");
  }
};

const confirmDelete = (registration: Registration) => {
  selectedRegistration.value = registration;
  isDeleteDialogOpen.value = true;
};

const deleteRegistration = async () => {
  if (!selectedRegistration.value) {
    toast.error("Ro'yxat tanlanmagan");
    return;
  }

  if (!selectedRegistration.value.id) {
    toast.error("Ro'yxat ID topilmadi");
    return;
  }

  try {
    await api.delete(
      apiService.value,
      `/cd-ielts/registrations/${selectedRegistration.value.id}`
    );
    toast.success("Ro'yxat muvaffaqiyatli o'chirildi");
    isDeleteDialogOpen.value = false;
    selectedRegistration.value = null;
    await fetchRegistrations();
  } catch (error) {
    console.error("Failed to delete registration:", error);
    toast.error("Ro'yxatni o'chirishda xatolik yuz berdi");
  }
};

const goBack = () => {
  router.push("/cd-ielts");
};

const refreshData = () => {
  fetchRegistrations();
  fetchTestInfo();
};

// Initialize data on component mount
onMounted(() => {
  if (!testId.value) {
    toast.error("Test ID topilmadi");
    router.push("/cd-ielts");
    return;
  }

  fetchRegistrations();
  fetchTestInfo();
});

// Watch for filter changes and reset to page 1
watch([searchQuery, statusFilter], () => {
  currentPage.value = 1;
});
</script>
