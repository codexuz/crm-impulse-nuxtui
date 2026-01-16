<template>
  <UDashboardPanel id="trial-lessons">
    <template #header>
      <UDashboardNavbar title="Sinov darslari" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          Sinov darslarini kuzatish va boshqarish
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div>
        <!-- Filters Section -->
        <UDashboardToolbar>
          <template #left>
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Qidirish..."
              class="w-64"
            />
          </template>

          <template #right>
            <USelectMenu
              :model-value="statusFilter"
              @update:model-value="(val: string | any) => statusFilter = typeof val === 'string' ? val : val?.value || ''"
              :items="statusOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Holat"
              class="w-45"
            />

            <USelectMenu
              :model-value="teacherFilter"
              @update:model-value="(val: string | any) => teacherFilter = typeof val === 'string' ? val : val?.value || ''"
              :items="teacherOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="O'qituvchi"
              class="w-48"
            />
          </template>
        </UDashboardToolbar>

        <!-- Trial Lessons Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Sinov darslari ro'yxati</h3>
          </template>

          <UTable
            :data="paginatedTrialLessons"
            :columns="columns"
            :loading="loading"
            :empty="'Sinov darslari topilmadi'"
          />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                <span class="font-medium">{{ total }}</span> sinov darsi
              </div>

              <UPagination
                :model-value="currentPage"
                :total="total"
                :items-per-page="itemsPerPage"
                show-last
                show-first
                @update:page="(p: number) => currentPage = p"
              />
            </div>
          </template>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Edit Trial Lesson Modal -->
  <!-- <UModal v-model="showEditDialog">
    <UCard>
      <template #header>
        <h3 class="text-base font-semibold">Sinov darsini tahrirlash</h3>
      </template>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Holat</label>
          <USelectMenu
            v-model="editingTrial.status"
            :items="statusOptions"
            value-attribute="value"
            option-attribute="label"
            placeholder="Holatni tanlang"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Izohlar</label>
          <UTextarea
            v-model="editingTrial.notes"
            placeholder="Sinov darsi haqida izoh qo'shing"
            :rows="3"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="outline"
            label="Bekor qilish"
            @click="showEditDialog = false"
          />
          <UButton label="O'zgarishlarni saqlash" @click="saveTrialChanges" />
        </div>
      </template>
    </UCard>
  </UModal> -->

  <!-- Delete Confirmation Modal -->
  <!-- <UModal v-model="showDeleteDialog">
    <UCard>
      <template #header>
        <h3 class="text-base font-semibold">Ishonchingiz komilmi?</h3>
      </template>

      <p class="text-sm text-gray-600">
        Bu amalni qaytarib bo'lmaydi. Sinov darsi va unga tegishli barcha
        ma'lumotlar butunlay o'chiriladi.
      </p>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="outline"
            label="Bekor qilish"
            @click="showDeleteDialog = false"
          />
          <UButton color="red" label="O'chirish" @click="confirmDelete" />
        </div>
      </template>
    </UCard>
  </UModal> -->
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { format } from "date-fns";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");

definePageMeta({
  middleware: ["auth"],
});

interface TeacherInfo {
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  phone: string;
}

interface LeadInfo {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: string;
}

interface TrialLesson {
  id: string;
  scheduledAt: string;
  status: string;
  teacher_id: string;
  lead_id: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: null | string;
  teacherInfo: TeacherInfo;
  leadInfo: LeadInfo | null;
}

interface ApiResponse {
  trialLessons: TrialLesson[];
  total: number;
  totalPages: number;
  currentPage: number;
}

const router = useRouter();
const route = useRoute();
const toast = useToast();

const trialLessons = ref<TrialLesson[]>([]);
const teachers = ref<TeacherInfo[]>([]);
const loading = ref(true);
const error = ref("");
const currentPage = ref(1);
const itemsPerPage = ref(10);
const total = ref(0);
const totalPages = ref(1);
const searchQuery = ref("");
const statusFilter = ref("");
const teacherFilter = ref("");
const { auth, apiService } = useAuth();
const showDeleteDialog = ref(false);
const trialToDelete = ref<string | null>(null);
const showEditDialog = ref(false);
const editingTrial = reactive({
  id: "",
  status: "",
  notes: "",
});

// Options
const statusOptions = [
  { label: "Barcha holatlar", value: "" },
  { label: "Belgilangan", value: "belgilangan" },
  { label: "Keldi", value: "keldi" },
  { label: "Kelmadi", value: "kelmadi" },
];

const teacherOptions = computed(() => [
  { label: "Barcha o'qituvchilar", value: "" },
  ...teachers.value.map((t) => ({
    label: `${t.first_name} ${t.last_name}`,
    value: t.user_id,
  })),
]);

// Table columns
const columns: TableColumn<TrialLesson>[] = [
  {
    accessorKey: "scheduledAt",
    header: "Sana va vaqt",
    cell: ({ row }) => {
      return h("div", {}, [
        h(
          "div",
          { class: "font-medium" },
          formatDate(row.original.scheduledAt)
        ),
        h(
          "div",
          { class: "text-xs text-gray-500" },
          formatTime(row.original.scheduledAt)
        ),
      ]);
    },
  },
  {
    accessorKey: "leadInfo",
    header: "Lead",
    cell: ({ row }) => {
      if (!row.original.leadInfo) {
        return h("div", { class: "text-gray-500 italic" }, "Lead topilmadi");
      }
      return h("div", {}, [
        h(
          "div",
          { class: "font-medium" },
          `${row.original.leadInfo.first_name} ${row.original.leadInfo.last_name}`
        ),
        h(
          "div",
          { class: "text-xs text-gray-500" },
          formatPhone(row.original.leadInfo.phone)
        ),
      ]);
    },
  },
  {
    accessorKey: "teacherInfo",
    header: "O'qituvchi",
    cell: ({ row }) => {
      return h("div", {}, [
        h(
          "div",
          { class: "font-medium" },
          `${row.original.teacherInfo.first_name} ${row.original.teacherInfo.last_name}`
        ),
        h(
          "div",
          { class: "text-xs text-gray-500" },
          formatPhone(row.original.teacherInfo.phone)
        ),
      ]);
    },
  },
  {
    accessorKey: "status",
    header: "Holat",
    cell: ({ row }) => {
      return h(
        UBadge,
        {
          color: getStatusColor(row.original.status),
        },
        () => row.original.status
      );
    },
  },
  {
    accessorKey: "notes",
    header: "Izohlar",
    cell: ({ row }) => row.original.notes || "Izoh yo'q",
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      return h("div", { class: "flex items-center gap-1" }, [
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-pencil",
          size: "sm",
          square: true,
          onClick: () => openEditTrialDialog(row.original),
        }),
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-trash-2",
          size: "sm",
          square: true,
          color: "red",
          onClick: () => confirmDeleteTrial(row.original),
        }),
      ]);
    },
  },
];

// Pagination helpers
const paginationStart = computed(() => {
  return total.value === 0
    ? 0
    : (currentPage.value - 1) * itemsPerPage.value + 1;
});

const paginationEnd = computed(() => {
  return Math.min(currentPage.value * itemsPerPage.value, total.value);
});

// Helper functions
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    belgilangan: "blue",
    keldi: "green",
    kelmadi: "red",
  };
  return colors[status.toLowerCase()] || "gray";
};

// Navigation functions for pagination
const navigatePage = (newPage: number) => {
  currentPage.value = newPage;
  fetchTrialLessons();
  updateUrlParams();
};

const onPageChange = (newPage: number) => {
  currentPage.value = newPage;
  fetchTrialLessons();
  updateUrlParams();
};

const updateUrlParams = () => {
  // Create query object with pagination params
  const query: Record<string, string> = {
    page: currentPage.value.toString(),
    limit: itemsPerPage.value.toString(),
  };

  // Add search param if it exists
  if (searchQuery.value) {
    query.search = searchQuery.value;
  }

  // Add status filter if it exists
  if (statusFilter.value) {
    query.status = statusFilter.value;
  }

  // Add teacher filter if it exists
  if (teacherFilter.value) {
    query.teacherId = teacherFilter.value;
  }

  // Update URL with all params
  router.push({ query });
};

// Fetch trial lessons from the API
const fetchTrialLessons = async () => {
  loading.value = true;
  error.value = "";

  try {
    // Add pagination parameters to the request
    const params = new URLSearchParams();
    params.append("page", currentPage.value.toString());
    params.append("limit", itemsPerPage.value.toString());

    if (searchQuery.value) {
      params.append("search", searchQuery.value);
    }

    if (statusFilter.value) {
      params.append("status", statusFilter.value);
    }

    if (teacherFilter.value) {
      params.append("teacherId", teacherFilter.value);
    }

    const url = `/lead-trial-lessons?${params.toString()}`;
    const data = await api.get<ApiResponse>(apiService.value, url);

    trialLessons.value = data.trialLessons;
    total.value = data.total;
    totalPages.value = data.totalPages;
    currentPage.value = data.currentPage;
  } catch (err) {
    console.error("Error fetching trial lessons:", err);
    error.value = "Sinov darslarini yuklashda xatolik.";
    toast.add({
      title: "Xatolik",
      description: "Sinov darslarini yuklashda xatolik",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

// Fetch teachers list
const fetchTeachers = async () => {
  try {
    const response = await api.get<{ data: TeacherInfo[] }>(
      apiService.value,
      "/users/teachers"
    );
    teachers.value = response.data || [];
  } catch (err) {
    console.error("Error fetching teachers:", err);
  }
};

// Using server-side filtering, so filteredTrialLessons just returns trialLessons
const filteredTrialLessons = computed(() => trialLessons.value);

// Get paginated trial lessons (same as filtered since API handles pagination)
const paginatedTrialLessons = computed(() => {
  return filteredTrialLessons.value;
});

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, "MMM dd, yyyy");
};

// Format time
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

// Format phone number
const formatPhone = (phone: string) => {
  if (!phone) return "";

  if (phone.startsWith("+")) {
    return phone;
  }

  if (phone.match(/^\d+$/)) {
    return `+998${phone}`;
  }

  return phone;
};

// Open dialog to edit an existing trial lesson
const openEditTrialDialog = (trial: TrialLesson) => {
  // Set the current trial data to edit
  editingTrial.id = trial.id;
  editingTrial.status = trial.status;
  editingTrial.notes = trial.notes || "";

  // Open the dialog
  showEditDialog.value = true;
};

// Save changes to trial lesson
const saveTrialChanges = async () => {
  try {
    // Make the API request to update the trial lesson
    await api.patch(
      apiService.value,
      `/lead-trial-lessons/${editingTrial.id}`,
      {
        status: editingTrial.status,
        notes: editingTrial.notes,
      }
    );

    // Update the trial in the local state
    const index = trialLessons.value.findIndex(
      (trial: TrialLesson) => trial.id === editingTrial.id
    );
    if (index !== -1) {
      const trial = trialLessons.value[index];
      if (trial) {
        trial.status = editingTrial.status;
        trial.notes = editingTrial.notes;
      }
    }

    toast.add({
      title: "Muvaffaqiyat",
      description: "Sinov darsi yangilandi",
      color: "success",
    });

    showEditDialog.value = false;
  } catch (err) {
    console.error("Error updating trial lesson:", err);
    toast.add({
      title: "Xatolik",
      description: "Sinov darsini yangilashda xatolik",
      color: "error",
    });
  }
};

// Confirm deletion of a trial lesson
const confirmDeleteTrial = (trial: TrialLesson) => {
  trialToDelete.value = trial.id;
  showDeleteDialog.value = true;
};

// Confirm deletion from dialog
const confirmDelete = async () => {
  if (trialToDelete.value) {
    await deleteTrial(trialToDelete.value);
    showDeleteDialog.value = false;
    trialToDelete.value = null;
  }
};

// Delete a trial lesson
const deleteTrial = async (id: string) => {
  try {
    await api.delete(apiService.value, `/lead-trial-lessons/${id}`);

    // Remove from local state
    trialLessons.value = trialLessons.value.filter(
      (trial: TrialLesson) => trial.id !== id
    );

    toast.add({
      title: "Muvaffaqiyat",
      description: "Sinov darsi o'chirildi",
      color: "success",
    });
  } catch (err) {
    console.error("Error deleting trial lesson:", err);
    toast.add({
      title: "Xatolik",
      description: "Sinov darsini o'chirishda xatolik",
      color: "error",
    });
  }
};

// Fetch data on component mount
onMounted(() => {
  // Get the pagination parameters from URL
  if (route.query.page) {
    currentPage.value = parseInt(route.query.page as string) || 1;
  }

  if (route.query.limit) {
    itemsPerPage.value = parseInt(route.query.limit as string) || 10;
  }

  // Handle search from URL
  if (route.query.search) {
    searchQuery.value = route.query.search as string;
  }

  // Handle status filter from URL
  if (route.query.status) {
    statusFilter.value = route.query.status as string;
  }

  // Handle teacher filter from URL
  if (route.query.teacherId) {
    teacherFilter.value = route.query.teacherId as string;
  }

  fetchTeachers();
  fetchTrialLessons();
});

// Watchers
watch(currentPage, () => {
  fetchTrialLessons();
  updateUrlParams();
});

watch(itemsPerPage, () => {
  currentPage.value = 1;
  fetchTrialLessons();
  updateUrlParams();
});

// Watch for filter changes and reset to page 1
watch(
  [searchQuery, statusFilter, teacherFilter],
  () => {
    // Reset to page 1 when filters change
    currentPage.value = 1;
    // Fetch new data with filters
    fetchTrialLessons();
    // Update URL params
    updateUrlParams();
  },
  { deep: true }
);
</script>
