<template>
  <UDashboardPanel id="teacher-profiles">
    <template #header>
      <UDashboardNavbar title="O'qituvchi profillar" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          O'qituvchilarning to'lov ma'lumotlarini boshqarish
        </template>

        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            variant="outline"
            @click="refreshData"
          />
          <UButton
            icon="i-lucide-plus"
            label="Yangi profil"
            @click="openCreateDialog"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="O'qituvchi ismi bilan qidirish..."
            class="w-64"
          />
        </template>

        <template #right>
          <USelectMenu
            :model-value="paymentTypeFilter"
            @update:model-value="
              (val: string | any) =>
                (paymentTypeFilter =
                  typeof val === 'string' ? val : val?.value || 'all')
            "
            :items="paymentTypeOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="To'lov turi"
            class="w-48"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div>
        <!-- Profiles Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Profillar ro'yxati</h3>
          </template>

          <UTable
            :data="paginatedProfiles"
            :columns="columns"
            :loading="loading"
            :empty="'Profillar topilmadi'"
          />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                <span class="font-medium">{{ totalItems }}</span> ta profil
              </div>

              <UPagination
                :model-value="currentPage"
                :total="totalItems"
                :items-per-page="itemsPerPage"
                show-last
                show-first
                @update:page="(p: number) => (currentPage = p)"
              />
            </div>
          </template>
        </UCard>
      </div>

      <!-- Create/Edit Dialog -->
      <UModal v-model:open="isDialogOpen" :ui="{ width: 'sm:max-w-[500px]' }">
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ isEditMode ? "Profilni tahrirlash" : "Yangi profil qo'shish" }}
          </h3>
        </template>

        <template #body>
          <div class="space-y-4">
            <div>
              <UFormField label="O'qituvchi" required>
                <USelectMenu
                  v-model="profileForm.user_id"
                  :items="teacherOptions"
                  value-attribute="value"
                  option-attribute="label"
                  placeholder="O'qituvchini tanlang"
                  :disabled="isEditMode"
                />
              </UFormField>
            </div>

            <div>
              <UFormField label="To'lov turi" required>
                <USelectMenu
                  v-model="profileForm.payment_type"
                  :items="paymentTypeSelectOptions"
                  value-attribute="value"
                  option-attribute="label"
                  placeholder="To'lov turini tanlang"
                />
              </UFormField>
            </div>

            <div>
              <UFormField label="Bir dars uchun to'lov" required>
                <UInput
                  v-model.number="profileForm.payment_value"
                  type="number"
                  placeholder="Summani kiriting"
                  :min="0"
                />
              </UFormField>
            </div>

            <div>
              <UFormField label="To'lov kuni">
                <UInput
                  v-model.number="profileForm.payment_day"
                  type="number"
                  placeholder="1-31"
                  :min="1"
                  :max="31"
                />
              </UFormField>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="subtle"
              label="Bekor qilish"
              @click="isDialogOpen = false"
            />
            <UButton label="Saqlash" @click="saveProfile" />
          </div>
        </template>
      </UModal>

      <!-- View Dialog -->
      <UModal
        v-model:open="isViewDialogOpen"
        :ui="{ width: 'sm:max-w-[500px]' }"
      >
        <template #header>
          <h3 class="text-lg font-semibold">Profil ma'lumotlari</h3>
        </template>

        <template #body>
          <div v-if="selectedProfile" class="space-y-4 py-4">
            <div class="grid grid-cols-3 gap-4">
              <span class="font-semibold">O'qituvchi:</span>
              <span class="col-span-2">{{
                selectedProfile.teacher_name || "N/A"
              }}</span>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <span class="font-semibold">To'lov turi:</span>
              <span class="col-span-2">
                <UBadge
                  :color="
                    selectedProfile.payment_type === 'percentage'
                      ? 'blue'
                      : 'gray'
                  "
                >
                  {{
                    selectedProfile.payment_type === "percentage"
                      ? "Foiz"
                      : "Qat'iy summa"
                  }}
                </UBadge>
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
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Yopish" @click="isViewDialogOpen = false" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { useAuth } from "~/composables/useAuth";
import { api } from "~/lib/api";

definePageMeta({
  layout: "default",
  middleware: "auth",
});

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UPopover = resolveComponent("UPopover");

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
const toast = useToast();

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
const isEditMode = ref(false);
const selectedProfile = ref<TeacherProfile | null>(null);
const deletePopoverOpen = ref<Record<string, boolean>>({});
const isDeleting = ref(false);

// Form data
const profileForm = ref({
  user_id: "",
  payment_type: "" as "percentage" | "fixed" | "",
  payment_value: null as number | null,
  payment_day: null as number | null,
});

// Options
const paymentTypeOptions = [
  { label: "Barcha turlar", value: "all" },
  { label: "Foiz", value: "percentage" },
  { label: "Qat'iy summa", value: "fixed" },
];

const paymentTypeSelectOptions = [
  { label: "Foiz", value: "percentage" },
  { label: "Qat'iy summa", value: "fixed" },
];

const teacherOptions = computed(() =>
  teachers.value.map((t) => ({
    label: `${t.first_name} ${t.last_name}`,
    value: t.user_id,
  })),
);

// Table columns
const columns: TableColumn<TeacherProfile>[] = [
  {
    accessorKey: "teacher_name",
    header: "O'qituvchi",
    cell: ({ row }) => row.original.teacher_name || "N/A",
  },
  {
    accessorKey: "payment_type",
    header: "To'lov turi",
    cell: ({ row }) => {
      return h(
        UBadge,
        {
          color: row.original.payment_type === "percentage" ? "blue" : "gray",
        },
        () =>
          row.original.payment_type === "percentage" ? "Foiz" : "Qat'iy summa",
      );
    },
  },
  {
    accessorKey: "payment_value",
    header: "To'lov qiymati",
    cell: ({ row }) => formatCurrency(row.original.payment_value || 0),
  },
  {
    accessorKey: "payment_day",
    header: "To'lov kuni",
    cell: ({ row }) => `${row.original.payment_day || "N/A"}-kun`,
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      const profileId = row.original.id;
      return h("div", { class: "flex items-center gap-1" }, [
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-eye",
          size: "sm",
          square: true,
          onClick: () => viewProfile(row.original),
        }),
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-pencil",
          size: "sm",
          square: true,
          onClick: () => editProfile(row.original),
        }),
        h(
          UPopover,
          {
            open: deletePopoverOpen.value[profileId] || false,
            "onUpdate:open": (value: boolean) => {
              deletePopoverOpen.value[profileId] = value;
            },
          },
          {
            default: () =>
              h(UButton, {
                color: "error",
                variant: "ghost",
                icon: "i-lucide-trash-2",
                size: "sm",
                square: true,
              }),
            content: () =>
              h("div", { class: "p-4 max-w-sm space-y-3" }, [
                h(
                  "h4",
                  { class: "font-semibold text-sm" },
                  "Ishonchingiz komilmi?",
                ),
                h(
                  "p",
                  { class: "text-sm text-gray-600" },
                  "Bu profilni butunlay o'chiradi va \nbarcha bog'langan ma'lumotlarni olib tashlaydi.",
                ),
                h("div", { class: "flex justify-end gap-2 mt-3" }, [
                  h(UButton, {
                    color: "neutral",
                    variant: "subtle",
                    label: "Bekor qilish",
                    size: "sm",
                    onClick: () => {
                      deletePopoverOpen.value[profileId] = false;
                    },
                  }),
                  h(UButton, {
                    color: "red",
                    label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                    loading: isDeleting.value,
                    size: "sm",
                    onClick: async () => {
                      await deleteProfile(row.original);
                      deletePopoverOpen.value[profileId] = false;
                    },
                  }),
                ]),
              ]),
          },
        ),
      ]);
    },
  },
];

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
    toast.add({
      title: "Xatolik",
      description: "Profillarni yuklashda xatolik yuz berdi",
      color: "error",
    });
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

const saveProfile = async () => {
  // Validation
  if (!profileForm.value.user_id) {
    toast.add({
      title: "Xatolik",
      description: "O'qituvchini tanlang",
      color: "error",
    });
    return;
  }

  if (!profileForm.value.payment_type) {
    toast.add({
      title: "Xatolik",
      description: "To'lov turini tanlang",
      color: "error",
    });
    return;
  }

  if (
    profileForm.value.payment_value === null ||
    profileForm.value.payment_value === undefined
  ) {
    toast.add({
      title: "Xatolik",
      description: "To'lov qiymatini kiriting",
      color: "error",
    });
    return;
  }

  if (profileForm.value.payment_value < 0) {
    toast.add({
      title: "Xatolik",
      description: "To'lov qiymati manfiy bo'lishi mumkin emas",
      color: "error",
    });
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
        payload,
      );
      toast.add({
        title: "Muvaffaqiyat",
        description: "Profil muvaffaqiyatli yangilandi",
        color: "success",
      });
    } else {
      await api.post(apiService.value, "/teacher-profile", payload);
      toast.add({
        title: "Muvaffaqiyat",
        description: "Profil muvaffaqiyatli qo'shildi",
        color: "success",
      });
    }

    isDialogOpen.value = false;
    await fetchProfiles();
  } catch (error: any) {
    console.error("Failed to save profile:", error);
    toast.add({
      title: "Xatolik",
      description:
        error?.response?.data?.message ||
        "Profilni saqlashda xatolik yuz berdi",
      color: "error",
    });
  }
};

const deleteProfile = async (profile: TeacherProfile) => {
  if (!profile) return;

  isDeleting.value = true;
  try {
    await api.delete(apiService.value, `/teacher-profile/${profile.id}`);
    toast.add({
      title: "Muvaffaqiyat",
      description: "Profil muvaffaqiyatli o'chirildi",
      color: "success",
    });
    await fetchProfiles();
  } catch (error) {
    console.error("Failed to delete profile:", error);
    toast.add({
      title: "Xatolik",
      description: "Profilni o'chirishda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
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
