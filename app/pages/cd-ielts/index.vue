<template>
  <div class="container py-10 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">CD IELTS Testlar</h1>
        <p class="text-muted-foreground">
          IELTS imtihonlarini boshqarish va kuzatish
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="refreshData">
          <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" />
          Yangilash
        </Button>
        <Button @click="openCreateDialog">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          Yangi test
        </Button>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Jami testlar</CardTitle>
          <Icon
            name="lucide:clipboard-list"
            class="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ tests.length }}</div>
          <p class="text-xs text-muted-foreground">Umumiy testlar soni</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Faol testlar</CardTitle>
          <Icon
            name="lucide:check-circle"
            class="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ activeTests }}</div>
          <p class="text-xs text-muted-foreground">Aktiv testlar</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">Jami o'rinlar</CardTitle>
          <Icon name="lucide:users" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ totalSeats }}</div>
          <p class="text-xs text-muted-foreground">Mavjud o'rinlar</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium">O'rtacha narx</CardTitle>
          <Icon
            name="lucide:dollar-sign"
            class="h-4 w-4 text-muted-foreground"
          />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ formatCurrency(averagePrice) }}
          </div>
          <p class="text-xs text-muted-foreground">O'rtacha test narxi</p>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <Input
        v-model="searchQuery"
        placeholder="Test nomini qidirish..."
        class="sm:max-w-xs"
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
          <SelectItem value="active">Faol</SelectItem>
          <SelectItem value="inactive">Nofaol</SelectItem>
          <SelectItem value="full">To'liq</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Table -->
    <Card>
      <CardHeader>
        <CardTitle>IELTS Testlar ro'yxati</CardTitle>
        <CardDescription>
          Barcha IELTS testlari va ularning ma'lumotlari
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sarlavha</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Imtihon sanasi</TableHead>
              <TableHead>Vaqt</TableHead>
              <TableHead>Joylashuv</TableHead>
              <TableHead>O'rinlar</TableHead>
              <TableHead>Narx</TableHead>
              <TableHead class="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody v-if="!loading && paginatedTests.length > 0">
            <TableRow v-for="test in paginatedTests" :key="test.id">
              <TableCell class="font-medium">
                {{ test.title }}
              </TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(test.status)">
                  {{ getStatusLabel(test.status) }}
                </Badge>
              </TableCell>
              <TableCell>
                {{ formatDate(test.exam_date) }}
              </TableCell>
              <TableCell>{{ test.time }}</TableCell>
              <TableCell class="max-w-xs truncate">{{
                test.location
              }}</TableCell>
              <TableCell>{{ test.seats }}</TableCell>
              <TableCell>{{ formatCurrency(test.price) }}</TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" @click="editTest(test)">
                    <Icon name="lucide:pencil" class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="confirmDelete(test)"
                  >
                    <Icon
                      name="lucide:trash-2"
                      class="h-4 w-4 text-destructive"
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="viewRegistrations(test)"
                  >
                    <Icon name="lucide:arrow-right" class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
          <TableBody v-else-if="loading">
            <TableRow>
              <TableCell colspan="8" class="text-center py-10">
                Yuklanmoqda...
              </TableCell>
            </TableRow>
          </TableBody>
          <TableBody v-else>
            <TableRow>
              <TableCell colspan="8" class="text-center py-10">
                Ma'lumot topilmadi
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter class="flex items-center justify-between">
        <div class="text-sm text-muted-foreground">
          Ko'rsatilmoqda {{ paginationStart }} - {{ paginationEnd }} /
          {{ filteredTests.length }} ta test
        </div>
        <Pagination
          v-model:page="currentPage"
          :total="filteredTests.length"
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

    <!-- Create/Edit Dialog -->
    <Dialog v-model:open="isDialogOpen">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {{ isEditMode ? "Testni tahrirlash" : "Yangi test qo'shish" }}
          </DialogTitle>
          <DialogDescription>
            IELTS test ma'lumotlarini kiriting
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="title" class="text-right">Sarlavha *</Label>
            <Input
              id="title"
              v-model="testForm.title"
              placeholder="IELTS Academic Test - October 2025"
              class="col-span-3"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="status" class="text-right">Status *</Label>
            <div class="col-span-3">
              <Select v-model="testForm.status">
                <SelectTrigger id="status">
                  <SelectValue placeholder="Statusni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Faol</SelectItem>
                  <SelectItem value="inactive">Nofaol</SelectItem>
                  <SelectItem value="full">To'liq</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="exam_date" class="text-right">Imtihon sanasi *</Label>
            <Input
              id="exam_date"
              v-model="testForm.exam_date"
              type="date"
              class="col-span-3"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="time" class="text-right">Vaqt *</Label>
            <Input
              id="time"
              v-model="testForm.time"
              type="time"
              class="col-span-3"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="location" class="text-right">Joylashuv *</Label>
            <Input
              id="location"
              v-model="testForm.location"
              placeholder="British Council Test Center, 123 Main St"
              class="col-span-3"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="seats" class="text-right">O'rinlar soni *</Label>
            <Input
              id="seats"
              v-model.number="testForm.seats"
              type="number"
              placeholder="30"
              class="col-span-3"
              min="1"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="price" class="text-right">Narx *</Label>
            <Input
              id="price"
              v-model.number="testForm.price"
              type="number"
              placeholder="250"
              class="col-span-3"
              min="0"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isDialogOpen = false">
            Bekor qilish
          </Button>
          <Button @click="saveTest">Saqlash</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- View Dialog -->
    <Dialog v-model:open="isViewDialogOpen">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Test ma'lumotlari</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-4" v-if="selectedTest">
          <div class="grid grid-cols-3 gap-4">
            <span class="font-semibold">Sarlavha:</span>
            <span class="col-span-2">{{ selectedTest.title }}</span>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <span class="font-semibold">Status:</span>
            <span class="col-span-2">
              <Badge :variant="getStatusVariant(selectedTest.status)">
                {{ getStatusLabel(selectedTest.status) }}
              </Badge>
            </span>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <span class="font-semibold">Imtihon sanasi:</span>
            <span class="col-span-2">{{
              formatDate(selectedTest.exam_date)
            }}</span>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <span class="font-semibold">Vaqt:</span>
            <span class="col-span-2">{{ selectedTest.time }}</span>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <span class="font-semibold">Joylashuv:</span>
            <span class="col-span-2">{{ selectedTest.location }}</span>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <span class="font-semibold">O'rinlar:</span>
            <span class="col-span-2">{{ selectedTest.seats }}</span>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <span class="font-semibold">Narx:</span>
            <span class="col-span-2">{{
              formatCurrency(selectedTest.price)
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
          <AlertDialogTitle>Testni o'chirish</AlertDialogTitle>
          <AlertDialogDescription>
            Haqiqatan ham bu testni o'chirmoqchimisiz? Bu amalni ortga qaytarib
            bo'lmaydi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction @click="deleteTest">O'chirish</AlertDialogAction>
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

interface IELTSTest {
  id: string;
  title: string;
  status: "active" | "inactive" | "full";
  exam_date: string;
  time: string;
  location: string;
  seats: number;
  price: number;
  created_at?: string;
  updated_at?: string;
}

const { apiService } = useAuth();
const router = useRouter();
const route = useRoute();

// State variables
const tests = ref<IELTSTest[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const statusFilter = ref("all");
const currentPage = ref(1);
const itemsPerPage = 10;

// Dialog states
const isDialogOpen = ref(false);
const isViewDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const isEditMode = ref(false);
const selectedTest = ref<IELTSTest | null>(null);

// Form data
const testForm = ref({
  title: "",
  status: "active" as "active" | "inactive" | "full",
  exam_date: "",
  time: "",
  location: "Impulse Study LC, Sergeli 3-metro bekati. Golden Life orqasi",
  seats: null as number | null,
  price: null as number | string | null,
});

// Computed properties
const filteredTests = computed(() => {
  return tests.value.filter((test) => {
    // Filter by search query
    const searchMatch =
      test.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      test.location.toLowerCase().includes(searchQuery.value.toLowerCase());

    // Filter by status
    const statusMatch =
      statusFilter.value === "all" || test.status === statusFilter.value;

    return searchMatch && statusMatch;
  });
});

const activeTests = computed(() => {
  return tests.value.filter((test) => test.status === "active").length;
});

const totalSeats = computed(() => {
  return tests.value.reduce((sum, test) => sum + test.seats, 0);
});

const averagePrice = computed(() => {
  if (tests.value.length === 0) return 0;
  const total = tests.value.reduce((sum, test) => sum + test.price, 0);
  return Math.round(total / tests.value.length);
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredTests.value.length / itemsPerPage));
});

const paginatedTests = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredTests.value.slice(startIndex, endIndex);
});

const paginationStart = computed(() => {
  return filteredTests.value.length > 0
    ? (currentPage.value - 1) * itemsPerPage + 1
    : 0;
});

const paginationEnd = computed(() => {
  const end = currentPage.value * itemsPerPage;
  return Math.min(end, filteredTests.value.length);
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
const fetchTests = async () => {
  loading.value = true;
  try {
    const response = await api.get<IELTSTest[]>(
      apiService.value,
      "/cd-ielts/tests"
    );
    tests.value = response || [];
  } catch (error) {
    console.error("Failed to fetch tests:", error);
    toast.error("Testlarni yuklashda xatolik yuz berdi");
    tests.value = [];
  } finally {
    loading.value = false;
  }
};

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case "active":
      return "default";
    case "full":
      return "secondary";
    case "inactive":
      return "destructive";
    default:
      return "outline";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "active":
      return "Faol";
    case "full":
      return "To'liq";
    case "inactive":
      return "Nofaol";
    default:
      return status;
  }
};

const resetForm = () => {
  testForm.value = {
    title: "",
    status: "active",
    exam_date: "",
    time: "",
    location: "Impulse Study LC, Sergeli 3-metro bekati. Golden Life orqasi",
    seats: null,
    price: null,
  };
};

// CRUD Operations
const openCreateDialog = () => {
  resetForm();
  isEditMode.value = false;
  isDialogOpen.value = true;
};

const editTest = (test: IELTSTest) => {
  isEditMode.value = true;
  selectedTest.value = test;
  testForm.value = {
    title: test.title,
    status: test.status,
    exam_date: test.exam_date,
    time: test.time,
    location: test.location,
    seats: test.seats,
    price: test.price,
  };
  isDialogOpen.value = true;
};

const viewRegistrations = (test: IELTSTest) => {
  router.push(`/cd-ielts/registrations/${test.id}`);
};

const confirmDelete = (test: IELTSTest) => {
  selectedTest.value = test;
  isDeleteDialogOpen.value = true;
};

const saveTest = async () => {
  // Validation
  if (!testForm.value.title) {
    toast.error("Sarlavhani kiriting");
    return;
  }

  if (!testForm.value.status) {
    toast.error("Statusni tanlang");
    return;
  }

  if (!testForm.value.exam_date) {
    toast.error("Imtihon sanasini kiriting");
    return;
  }

  if (!testForm.value.time) {
    toast.error("Vaqtni kiriting");
    return;
  }

  if (!testForm.value.location) {
    toast.error("Joylashuvni kiriting");
    return;
  }

  if (testForm.value.seats === null || testForm.value.seats < 1) {
    toast.error("O'rinlar sonini kiriting");
    return;
  }

  // Convert price to proper number format (handle comma as decimal separator)
  let priceValue = testForm.value.price;
  if (typeof priceValue === "string") {
    // Replace comma with dot for decimal separator
    priceValue = parseFloat(priceValue.replace(",", "."));
  }

  if (
    priceValue === null ||
    typeof priceValue === "undefined" ||
    isNaN(Number(priceValue)) ||
    Number(priceValue) < 0
  ) {
    toast.error("Narxni kiriting");
    return;
  }

  try {
    const payload = {
      title: testForm.value.title,
      status: testForm.value.status,
      exam_date: testForm.value.exam_date,
      time: testForm.value.time,
      location: testForm.value.location,
      seats: Number(testForm.value.seats),
      price: Number(priceValue),
    };

    if (isEditMode.value && selectedTest.value) {
      await api.patch(
        apiService.value,
        `/cd-ielts/tests/${selectedTest.value.id}`,
        payload
      );
      toast.success("Test muvaffaqiyatli yangilandi");
    } else {
      await api.post(apiService.value, "/cd-ielts/tests", payload);
      toast.success("Test muvaffaqiyatli qo'shildi");
    }

    isDialogOpen.value = false;
    await fetchTests();
  } catch (error: any) {
    console.error("Failed to save test:", error);
    toast.error(
      error?.response?.data?.message || "Testni saqlashda xatolik yuz berdi"
    );
  }
};

const deleteTest = async () => {
  if (!selectedTest.value) {
    toast.error("Test tanlanmagan");
    return;
  }

  if (!selectedTest.value.id) {
    toast.error("Test ID topilmadi");
    return;
  }

  try {
    await api.delete(
      apiService.value,
      `/cd-ielts/tests/${selectedTest.value.id}`
    );
    toast.success("Test muvaffaqiyatli o'chirildi");
    isDeleteDialogOpen.value = false;
    selectedTest.value = null;
    await fetchTests();
  } catch (error) {
    console.error("Failed to delete test:", error);
    toast.error("Testni o'chirishda xatolik yuz berdi");
  }
};

const refreshData = () => {
  fetchTests();
};

// URL params management
const updateUrlParams = () => {
  router.push({
    query: {
      page: currentPage.value > 1 ? currentPage.value.toString() : undefined,
      search: searchQuery.value || undefined,
      status: statusFilter.value !== "all" ? statusFilter.value : undefined,
    },
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

  if (route.query.status) {
    statusFilter.value = route.query.status as string;
  }

  fetchTests();
});

// Watch for filter changes and reset to page 1
watch([searchQuery, statusFilter], () => {
  currentPage.value = 1;
  updateUrlParams();
});

watch(currentPage, () => {
  updateUrlParams();
});
</script>
