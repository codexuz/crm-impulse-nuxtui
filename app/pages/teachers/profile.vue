<template>
  <div class="container py-10 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">O'qituvchi profillar</h1>
        <p class="text-muted-foreground">
          O'qituvchilarning to'lov ma'lumotlarini boshqarish
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="refreshData">
          <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" />
          Yangilash
        </Button>
        <Button @click="openCreateDialog">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          Yangi profil
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <Input
        v-model="searchQuery"
        placeholder="O'qituvchi ismi bilan qidirish..."
        class="sm:max-w-xs"
      >
        <template #leading>
          <Icon name="lucide:search" class="h-4 w-4" />
        </template>
      </Input>
      <Select v-model="paymentTypeFilter">
        <SelectTrigger class="sm:max-w-[200px]">
          <SelectValue placeholder="To'lov turi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Barcha turlar</SelectItem>
          <SelectItem value="percentage">Foiz</SelectItem>
          <SelectItem value="fixed">Qat'iy summa</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Table -->
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>O'qituvchi</TableHead>
              <TableHead>To'lov turi</TableHead>
              <TableHead>To'lov qiymati</TableHead>
              <TableHead>To'lov kuni</TableHead>
              <TableHead class="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody v-if="!loading && paginatedProfiles.length > 0">
            <TableRow v-for="profile in paginatedProfiles" :key="profile.id">
              <TableCell class="font-medium">
                {{ profile.teacher_name || "N/A" }}
              </TableCell>
              <TableCell>
                <Badge
                  :variant="
                    profile.payment_type === 'percentage'
                      ? 'default'
                      : 'secondary'
                  "
                >
                  {{
                    profile.payment_type === "percentage"
                      ? "Foiz"
                      : "Qat'iy summa"
                  }}
                </Badge>
              </TableCell>
              <TableCell>
                {{ formatCurrency(profile.payment_value || 0) }}
              </TableCell>
              <TableCell> {{ profile.payment_day || "N/A" }}-kun </TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="viewProfile(profile)"
                  >
                    <Icon name="lucide:eye" class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="editProfile(profile)"
                  >
                    <Icon name="lucide:pencil" class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="confirmDelete(profile)"
                  >
                    <Icon
                      name="lucide:trash-2"
                      class="h-4 w-4 text-destructive"
                    />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
          <TableBody v-else-if="loading">
            <TableRow>
              <TableCell colspan="5" class="text-center py-10">
                Yuklanmoqda...
              </TableCell>
            </TableRow>
          </TableBody>
          <TableBody v-else>
            <TableRow>
              <TableCell colspan="5" class="text-center py-10">
                Ma'lumot topilmadi
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter class="flex items-center justify-between">
        <div class="text-sm text-muted-foreground">
          Ko'rsatilmoqda {{ paginationStart }} - {{ paginationEnd }} /
          {{ totalItems }} ta profil
        </div>
        <Pagination
          v-model:page="currentPage"
          :total="filteredProfiles.length"
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
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {{ isEditMode ? "Profilni tahrirlash" : "Yangi profil qo'shish" }}
          </DialogTitle>
          <DialogDescription>
            O'qituvchi to'lov ma'lumotlarini kiriting
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="teacher" class="text-right">O'qituvchi *</Label>
            <div class="col-span-3">
              <Select v-model="profileForm.user_id" :disabled="isEditMode">
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="O'qituvchini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="teacher in teachers"
                    :key="teacher.user_id"
                    :value="teacher.user_id"
                  >
                    {{ teacher.first_name }} {{ teacher.last_name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="payment_type" class="text-right">To'lov turi *</Label>
            <div class="col-span-3">
              <Select v-model="profileForm.payment_type">
                <SelectTrigger id="payment_type">
                  <SelectValue placeholder="To'lov turini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Foiz</SelectItem>
                  <SelectItem value="fixed">Qat'iy summa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="payment_value" class="text-right">
              Bir dars uchun to'lov *
            </Label>
            <Input
              id="payment_value"
              v-model.number="profileForm.payment_value"
              type="number"
              placeholder="Summani kiriting"
              class="col-span-3"
              :min="0"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="payment_day" class="text-right">To'lov kuni</Label>
            <Input
              id="payment_day"
              v-model.number="profileForm.payment_day"
              type="number"
              placeholder="1-31"
              class="col-span-3"
              min="1"
              max="31"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="isDialogOpen = false">
            Bekor qilish
          </Button>
          <Button @click="saveProfile">Saqlash</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- View Dialog -->
    <Dialog v-model:open="isViewDialogOpen">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Profil ma'lumotlari</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-4" v-if="selectedProfile">
          <div class="grid grid-cols-3 gap-4">
            <span class="font-semibold">O'qituvchi:</span>
            <span class="col-span-2">{{
              selectedProfile.teacher_name || "N/A"
            }}</span>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <span class="font-semibold">To'lov turi:</span>
            <span class="col-span-2">
              <Badge
                :variant="
                  selectedProfile.payment_type === 'percentage'
                    ? 'default'
                    : 'secondary'
                "
              >
                {{
                  selectedProfile.payment_type === "percentage"
                    ? "Foiz"
                    : "Qat'iy summa"
                }}
              </Badge>
            </span>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <span class="font-semibold">Bir dars uchun:</span>
            <span class="col-span-2">
              {{ formatCurrency(selectedProfile.payment_value || 0) }}
            </span>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <span class="font-semibold">To'lov kuni:</span>
            <span class="col-span-2"
              >{{ selectedProfile.payment_day || "N/A" }}-kun</span
            >
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
          <AlertDialogTitle>Profilni o'chirish</AlertDialogTitle>
          <AlertDialogDescription>
            Haqiqatan ham bu profilni o'chirmoqchimisiz? Bu amalni ortga
            qaytarib bo'lmaydi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction @click="deleteProfile"
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

interface TeacherProfile {
  id: string;
  user_id: string;
  payment_type: "percentage" | "fixed" | null;
  payment_value: number | null;
  payment_day: number | null;
  teacher_name?: string;
  createdAt: string;
  updatedAt: string;
}

interface Teacher {
  user_id: string;
  first_name: string;
  last_name: string;
  teacher_profile?: TeacherProfile;
}

const { apiService } = useAuth();
const router = useRouter();
const route = useRoute();

// State variables
const profiles = ref<TeacherProfile[]>([]);
const teachers = ref<Teacher[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const paymentTypeFilter = ref("all");
const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalItems = ref(0);
const totalServerPages = ref(1);

// Dialog states
const isDialogOpen = ref(false);
const isViewDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const isEditMode = ref(false);
const selectedProfile = ref<TeacherProfile | null>(null);

// Form data
const profileForm = ref({
  user_id: "",
  payment_type: "" as "percentage" | "fixed" | "",
  payment_value: null as number | null,
  payment_day: null as number | null,
});

// Computed properties
const filteredProfiles = computed(() => {
  // Server-side filtering, just return the data
  return profiles.value;
});

const totalPages = computed(() => {
  return totalServerPages.value;
});

const paginatedProfiles = computed(() => {
  // Server already returns paginated data
  return filteredProfiles.value;
});

const paginationStart = computed(() => {
  return totalItems.value > 0
    ? (currentPage.value - 1) * itemsPerPage.value + 1
    : 0;
});

const paginationEnd = computed(() => {
  const end = currentPage.value * itemsPerPage.value;
  return Math.min(end, totalItems.value);
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
const fetchProfiles = async () => {
  loading.value = true;
  try {
    // Build query parameters for API
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: itemsPerPage.value.toString(),
    });

    // Add search query if present
    if (searchQuery.value) {
      params.append("query", searchQuery.value);
    }

    const response = await api.get<{
      data: Teacher[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, `/users/teachers?${params.toString()}`);

    // Extract profiles from teachers and add teacher names
    const profilesWithNames = (response.data || [])
      .filter((teacher) => teacher.teacher_profile) // Only teachers with profiles
      .map((teacher) => ({
        ...teacher.teacher_profile!,
        teacher_name: `${teacher.first_name} ${teacher.last_name}`,
      }));

    profiles.value = profilesWithNames as TeacherProfile[];
    totalItems.value = response.total || 0;
    totalServerPages.value = response.totalPages || 1;
    currentPage.value = response.page || 1;
    itemsPerPage.value = response.limit || 10;
  } catch (error) {
    console.error("Failed to fetch teacher profiles:", error);
    toast.error("Profillarni yuklashda xatolik yuz berdi");
    profiles.value = [];
    totalItems.value = 0;
    totalServerPages.value = 1;
  } finally {
    loading.value = false;
  }
};

const fetchTeachers = async () => {
  try {
    // Fetch all teachers for dropdown - using high limit to get all
    const params = new URLSearchParams({
      page: "1",
      limit: "1000", // Get all teachers
    });

    const response = await api.get<{
      data: Teacher[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, `/users/teachers?${params.toString()}`);

    teachers.value = response.data || [];
  } catch (error) {
    console.error("Failed to fetch teachers:", error);
    teachers.value = [];
  }
};

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
};

const resetForm = () => {
  profileForm.value = {
    user_id: "",
    payment_type: "",
    payment_value: null,
    payment_day: null,
  };
};

// CRUD Operations
const openCreateDialog = () => {
  resetForm();
  isEditMode.value = false;
  isDialogOpen.value = true;
};

const editProfile = (profile: TeacherProfile) => {
  isEditMode.value = true;
  selectedProfile.value = profile;
  profileForm.value = {
    user_id: profile.user_id,
    payment_type: profile.payment_type || "",
    payment_value: profile.payment_value,
    payment_day: profile.payment_day,
  };
  isDialogOpen.value = true;
};

const viewProfile = (profile: TeacherProfile) => {
  selectedProfile.value = profile;
  isViewDialogOpen.value = true;
};

const confirmDelete = (profile: TeacherProfile) => {
  selectedProfile.value = profile;
  isDeleteDialogOpen.value = true;
};

const saveProfile = async () => {
  // Validation
  if (!profileForm.value.user_id) {
    toast.error("O'qituvchini tanlang");
    return;
  }

  if (!profileForm.value.payment_type) {
    toast.error("To'lov turini tanlang");
    return;
  }

  if (
    profileForm.value.payment_value === null ||
    profileForm.value.payment_value === undefined
  ) {
    toast.error("To'lov qiymatini kiriting");
    return;
  }

  if (profileForm.value.payment_value < 0) {
    toast.error("To'lov qiymati manfiy bo'lishi mumkin emas");
    return;
  }

  try {
    const payload = {
      user_id: profileForm.value.user_id,
      payment_type: profileForm.value.payment_type,
      payment_value: profileForm.value.payment_value,
      payment_day: profileForm.value.payment_day,
    };

    if (isEditMode.value && selectedProfile.value) {
      await api.patch(
        apiService.value,
        `/teacher-profile/${selectedProfile.value.id}`,
        payload
      );
      toast.success("Profil muvaffaqiyatli yangilandi");
    } else {
      await api.post(apiService.value, "/teacher-profile", payload);
      toast.success("Profil muvaffaqiyatli qo'shildi");
    }

    isDialogOpen.value = false;
    await fetchProfiles();
  } catch (error: any) {
    console.error("Failed to save profile:", error);
    toast.error(
      error?.response?.data?.message || "Profilni saqlashda xatolik yuz berdi"
    );
  }
};

const deleteProfile = async () => {
  if (!selectedProfile.value) return;

  try {
    await api.delete(
      apiService.value,
      `/teacher-profile/${selectedProfile.value.id}`
    );
    toast.success("Profil muvaffaqiyatli o'chirildi");
    isDeleteDialogOpen.value = false;
    await fetchProfiles();
  } catch (error) {
    console.error("Failed to delete profile:", error);
    toast.error("Profilni o'chirishda xatolik yuz berdi");
  }
};

const refreshData = async () => {
  await fetchTeachers();
  await fetchProfiles();
};

// URL params management
const updateUrlParams = () => {
  router.push({
    query: {
      page: currentPage.value > 1 ? currentPage.value.toString() : undefined,
      search: searchQuery.value || undefined,
      type:
        paymentTypeFilter.value !== "all" ? paymentTypeFilter.value : undefined,
    },
  });
};

// Initialize data on component mount
onMounted(async () => {
  if (route.query.page) {
    currentPage.value = parseInt(route.query.page as string, 10);
  }

  if (route.query.search) {
    searchQuery.value = route.query.search as string;
  }

  if (route.query.type) {
    paymentTypeFilter.value = route.query.type as string;
  }

  // Fetch teachers first (which includes their profiles)
  await fetchTeachers();
  // Then extract profiles with teacher names
  await fetchProfiles();
});

// Debounce function for search
let searchTimeout: NodeJS.Timeout | null = null;
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    updateUrlParams();
    fetchProfiles();
  }, 500); // 500ms debounce
};

// Watch for search changes with debouncing
watch(searchQuery, () => {
  debouncedSearch();
});

// Watch for filter changes and reset to page 1
watch(paymentTypeFilter, () => {
  currentPage.value = 1;
  updateUrlParams();
  fetchProfiles();
});

// Watch for page changes
watch(currentPage, (newPage, oldPage) => {
  if (newPage !== oldPage) {
    updateUrlParams();
    fetchProfiles();
  }
});
</script>
