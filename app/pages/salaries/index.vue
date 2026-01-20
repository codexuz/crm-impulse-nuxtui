<template>
  <UDashboardPanel id="salaries">
    <template #header>
      <UDashboardNavbar title="Oyliklar" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          O'qituvchilar oylik ma'lumotlari va hisobotlari
        </template>

        <template #right>
          <UButton icon="i-lucide-wallet" label="Hamyonlar" variant="outline" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Stats Overview -->
        <div class="grid gap-4 md:grid-cols-4">
          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">
                  Jami o'qituvchilar
                </p>
                <p class="text-2xl font-bold mt-1">{{ teachersCount }}</p>
                <p class="text-xs text-gray-500 mt-1">Aktiv o'qituvchilar</p>
              </div>
              <span class="i-lucide-users text-gray-400 text-2xl"></span>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">
                  Jami hamyon balansi
                </p>
                <p class="text-2xl font-bold mt-1">
                  {{ formatCurrency(totalWalletBalance) }}
                </p>
                <p class="text-xs text-gray-500 mt-1">Barcha hamyonlar</p>
              </div>
              <span class="i-lucide-wallet text-gray-400 text-2xl"></span>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Jami talabalar</p>
                <p class="text-2xl font-bold mt-1">{{ totalStudents }}</p>
                <p class="text-xs text-gray-500 mt-1">Barcha guruhlar</p>
              </div>
              <span
                class="i-lucide-graduation-cap text-gray-400 text-2xl"
              ></span>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Jami guruhlar</p>
                <p class="text-2xl font-bold mt-1">{{ totalGroups }}</p>
                <p class="text-xs text-gray-500 mt-1">Aktiv guruhlar</p>
              </div>
              <span class="i-lucide-users-round text-gray-400 text-2xl"></span>
            </div>
          </UCard>
        </div>

        <!-- Filters Section -->
        <UDashboardToolbar>
          <template #left>
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="O'qituvchi ismi yoki telefon..."
              class="w-64"
            />
          </template>

          <template #right>
            <USelectMenu
              v-model="paymentTypeFilter"
              :items="paymentTypeOptions"
              value-key="value"
              placeholder="To'lov turi"
              class="w-40"
            >
              <template #label>
                {{
                  paymentTypeOptions.find((p) => p.value === paymentTypeFilter)
                    ?.label || "To'lov turi"
                }}
              </template>
            </USelectMenu>

            <UButton
              v-if="hasActiveFilters"
              icon="i-lucide-x"
              label="Tozalash"
              variant="ghost"
              @click="clearFilters"
            />

            <UButton
              icon="i-lucide-refresh-cw"
              label="Yangilash"
              variant="outline"
              @click="refreshData"
            />
          </template>
        </UDashboardToolbar>

        <!-- Salaries Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">O'qituvchilar ro'yxati</h3>
          </template>

          <UTable
            :data="paginatedTeachers"
            :columns="columns"
            :loading="loading"
            :empty="'O\'qituvchilar topilmadi'"
          />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                <span class="font-medium">{{ filteredTeachers.length }}</span>
                ta o'qituvchi
              </div>

              <UPagination
                :model-value="currentPage"
                :total="filteredTeachers.length"
                :items-per-page="itemsPerPage"
                show-last
                show-first
                @update:page="onPageChange"
              />
            </div>
          </template>
        </UCard>
      </div>

      <!-- View Modal -->
      <UModal v-model:open="showViewDialog" title="O'qituvchi tafsilotlari">
        <template #body>
          <div v-if="selectedTeacher" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">F.I.Sh.</h4>
                <p class="font-medium">
                  {{ selectedTeacher.first_name }}
                  {{ selectedTeacher.last_name }}
                </p>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">Telefon</h4>
                <p>{{ selectedTeacher.phone }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">
                  To'lov turi
                </h4>
                <UBadge
                  :color="
                    selectedTeacher.payment_type === 'percentage'
                      ? 'blue'
                      : 'green'
                  "
                >
                  {{
                    selectedTeacher.payment_type === "percentage"
                      ? "Foiz"
                      : "Fix"
                  }}
                </UBadge>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">
                  To'lov qiymati
                </h4>
                <p>
                  {{
                    selectedTeacher.payment_type === "percentage"
                      ? formatCurrency(selectedTeacher.payment_value)
                      : formatCurrency(selectedTeacher.payment_value)
                  }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">
                  Hamyon balansi
                </h4>
                <p class="font-semibold text-green-600">
                  {{ formatCurrency(selectedTeacher.walletBalance) }}
                </p>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">
                  Kompensatsiya balansi
                </h4>
                <p class="font-semibold text-blue-600">
                  {{ formatCurrency(selectedTeacher.compensateBalance) }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">
                  Guruhlar soni
                </h4>
                <p>{{ selectedTeacher.groupsCount }}</p>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-500 mb-1">
                  Talabalar soni
                </h4>
                <p>{{ selectedTeacher.studentsCount }}</p>
              </div>
            </div>

            <div>
              <h4 class="text-sm font-medium text-gray-500 mb-1">
                Ro'yxatdan o'tgan sana
              </h4>
              <p class="text-sm">
                {{ formatDate(selectedTeacher.created_at) }}
              </p>
            </div>
          </div>
        </template>

        <template #footer="{ close }">
          <div class="flex justify-end">
            <UButton label="Yopish" @click="close" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");

definePageMeta({
  middleware: ["auth"],
});

interface Teacher {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string | null;
  branch_id: string | null;
  payment_type: "percentage" | "fixed";
  payment_value: number;
  groupsCount: number;
  studentsCount: number;
  walletBalance: number;
  compensateBalance: number;
  created_at: string;
}

const { apiService } = useAuth();
const toast = useToast();
const router = useRouter();
const route = useRoute();

// State variables
const teachers = ref<Teacher[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const paymentTypeFilter = ref<string | null>(null);
const currentPage = ref(1);
const itemsPerPage = 10;
const showViewDialog = ref(false);
const selectedTeacher = ref<Teacher | null>(null);

// Table columns
const columns: TableColumn<Teacher>[] = [
  {
    accessorKey: "first_name",
    header: "O'qituvchi",
    cell: ({ row }) => {
      return h("div", {}, [
        h(
          "div",
          { class: "font-medium" },
          `${row.original.first_name} ${row.original.last_name}`,
        ),
        h("div", { class: "text-xs text-gray-500" }, row.original.phone),
      ]);
    },
  },
  {
    accessorKey: "payment_type",
    header: "To'lov turi",
    cell: ({ row }) => {
      return h(
        UBadge,
        {
          color: row.original.payment_type === "percentage" ? "blue" : "green",
        },
        () => (row.original.payment_type === "percentage" ? "Foiz" : "Fix"),
      );
    },
  },
  {
    accessorKey: "payment_value",
    header: "To'lov qiymati",
    cell: ({ row }) => formatCurrency(row.original.payment_value),
  },
  {
    accessorKey: "walletBalance",
    header: "Hamyon balansi",
    cell: ({ row }) => {
      return h(
        "span",
        { class: "font-semibold text-green-600" },
        formatCurrency(row.original.walletBalance),
      );
    },
  },
  {
    accessorKey: "groupsCount",
    header: "Guruhlar",
    cell: ({ row }) => row.original.groupsCount,
  },
  {
    accessorKey: "studentsCount",
    header: "Talabalar",
    cell: ({ row }) => row.original.studentsCount,
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      return h("div", { class: "flex justify-end gap-1" }, [
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-eye",
          size: "sm",
          square: true,
          onClick: () => navigateToTeacher(row.original.user_id),
        }),
      ]);
    },
  },
];

// Options
const paymentTypeOptions = [
  { label: "Barchasi", value: null },
  { label: "Foiz", value: "percentage" },
  { label: "Fix", value: "fixed" },
];

// Computed properties
const filteredTeachers = computed(() => {
  return teachers.value.filter((teacher) => {
    // Filter by search query
    const searchMatch =
      teacher.first_name
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase()) ||
      teacher.last_name
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase()) ||
      teacher.phone.includes(searchQuery.value);

    // Filter by payment type
    const paymentTypeMatch =
      !paymentTypeFilter.value ||
      teacher.payment_type === paymentTypeFilter.value;

    return searchMatch && paymentTypeMatch;
  });
});

const teachersCount = computed(() => filteredTeachers.value.length);

const totalWalletBalance = computed(() => {
  return filteredTeachers.value.reduce(
    (sum, teacher) => sum + teacher.walletBalance,
    0,
  );
});

const totalStudents = computed(() => {
  return filteredTeachers.value.reduce(
    (sum, teacher) => sum + teacher.studentsCount,
    0,
  );
});

const totalGroups = computed(() => {
  return filteredTeachers.value.reduce(
    (sum, teacher) => sum + teacher.groupsCount,
    0,
  );
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredTeachers.value.length / itemsPerPage));
});

const paginatedTeachers = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredTeachers.value.slice(startIndex, endIndex);
});

const paginationStart = computed(() => {
  return filteredTeachers.value.length === 0
    ? 0
    : (currentPage.value - 1) * itemsPerPage + 1;
});

const paginationEnd = computed(() => {
  return Math.min(
    currentPage.value * itemsPerPage,
    filteredTeachers.value.length,
  );
});

const hasActiveFilters = computed(() => {
  return searchQuery.value !== "" || paymentTypeFilter.value !== null;
});

// Fetch data
const fetchTeachers = async () => {
  loading.value = true;
  try {
    const response = await api.get<{
      data: Teacher[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(apiService.value, "/teacher-wallet/stats/teachers?limit=100");

    teachers.value = response.data || [];
  } catch (error) {
    console.error("Failed to fetch teachers:", error);
    toast.add({
      title: "Xatolik",
      description: "O'qituvchilarni yuklashda xatolik yuz berdi",
      color: "error",
    });
    teachers.value = [];
  } finally {
    loading.value = false;
  }
};

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const formatCurrency = (amount: number) => {
  return (
    new Intl.NumberFormat("uz-UZ", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " so'm"
  );
};

// Action handlers
const refreshData = () => {
  fetchTeachers();
};

const navigateToTeacher = (teacherId: string) => {
  router.push(`/salaries/teacher/${teacherId}`);
};

const viewTeacher = (teacher: Teacher) => {
  selectedTeacher.value = teacher;
  showViewDialog.value = true;
};

const clearFilters = () => {
  searchQuery.value = "";
  paymentTypeFilter.value = null;
};

// Navigation functions for pagination
const onPageChange = (newPage: number) => {
  if (newPage >= 1 && newPage <= totalPages.value) {
    currentPage.value = newPage;
    updateUrlParams();
  }
};

const updateUrlParams = () => {
  const query: Record<string, string> = {
    page: currentPage.value.toString(),
  };

  if (searchQuery.value) {
    query.search = searchQuery.value;
  }

  if (paymentTypeFilter.value) {
    query.payment_type = paymentTypeFilter.value;
  }

  router.push({ query });
};

// Initialize data on component mount
onMounted(() => {
  if (route.query.page) {
    currentPage.value = parseInt(route.query.page as string, 10);
  }

  if (route.query.search) {
    searchQuery.value = route.query.search as string;
  }

  if (route.query.payment_type) {
    paymentTypeFilter.value = route.query.payment_type as string;
  }

  fetchTeachers();
});

// Watch for filter changes and reset to page 1
watch([searchQuery, paymentTypeFilter], () => {
  currentPage.value = 1;
  updateUrlParams();
});
</script>
