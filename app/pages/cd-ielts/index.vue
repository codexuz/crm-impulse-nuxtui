<template>
  <UDashboardPanel id="cd-ielts">
    <template #header>
      <UDashboardNavbar title="CD IELTS Testlar" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          IELTS imtihonlarini boshqarish va kuzatish
        </template>

        <template #right>
          <UButton
            variant="ghost"
            icon="i-lucide-refresh-cw"
            @click="refreshData"
          />
          <UButton
            icon="i-lucide-plus"
            label="Yangi test"
            @click="openCreateDialog"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Test nomini qidirish..."
            class="w-64"
          />
        </template>

        <template #right>
          <USelectMenu
            v-model="statusFilter"
            :items="statusOptions"
            value-attribute="value"
            class="w-48"
          >
            <template #label>
              {{
                statusOptions.find((s) => s.value === statusFilter)?.label ||
                "Barcha statuslar"
              }}
            </template>
          </USelectMenu>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Stats Overview -->
        <div class="grid gap-4 md:grid-cols-4">
          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Jami testlar</p>
                <p class="text-2xl font-bold">{{ tests.length }}</p>
              </div>
              <div class="i-lucide-clipboard-list h-8 w-8 text-gray-400" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Faol testlar</p>
                <p class="text-2xl font-bold">{{ activeTests }}</p>
              </div>
              <div class="i-lucide-check-circle h-8 w-8 text-gray-400" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Jami o'rinlar</p>
                <p class="text-2xl font-bold">{{ totalSeats }}</p>
              </div>
              <div class="i-lucide-users h-8 w-8 text-gray-400" />
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">O'rtacha narx</p>
                <p class="text-2xl font-bold">
                  {{ formatCurrency(averagePrice) }}
                </p>
              </div>
              <div class="i-lucide-dollar-sign h-8 w-8 text-gray-400" />
            </div>
          </UCard>
        </div>

        <!-- Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">IELTS Testlar ro'yxati</h3>
          </template>

          <UTable
            :data="tests"
            :columns="columns"
            :loading="loading"
            :empty="'Ma\'lumot topilmadi'"
          />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                Ko'rsatilmoqda
                <span class="font-medium">{{ paginationStart }}</span> -
                <span class="font-medium">{{ paginationEnd }}</span> /
                <span class="font-medium">{{ totalItems }}</span> ta test
              </div>

              <UPagination
                v-model="currentPage"
                :total="totalItems"
                :items-per-page="itemsPerPage"
                show-last
                show-first
              />
            </div>
          </template>
        </UCard>
      </div>

      <!-- Create/Edit Dialog -->
      <UModal v-model:open="isDialogOpen" :ui="{ width: 'sm:max-w-[600px]' }">
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ isEditMode ? "Testni tahrirlash" : "Yangi test qo'shish" }}
          </h3>
        </template>

        <template #body>
          <div class="space-y-4">
            <div>
              <UFormField  label="Sarlavha" required>
                <UInput
                  v-model="testForm.title"
                  placeholder="IELTS Academic Test - October 2025"
                />
              </UFormField>
            </div>

            <div>
              <UFormField  label="Status" required>
                <USelect
                  v-model="testForm.status"
                  :items="[
                    { label: 'Faol', value: 'active' },
                    { label: 'Nofaol', value: 'inactive' },
                    { label: 'To\'liq', value: 'full' },
                  ]"
                  value-attribute="value"
                  placeholder="Statusni tanlang"
                />
              </UFormField>
            </div>

            <div>
              <UFormField  label="Imtihon sanasi" required>
                <UInput v-model="testForm.exam_date" type="date" />
              </UFormField>
            </div>

            <div>
              <UFormField  label="Vaqt" required>
                <UInput v-model="testForm.time" type="time" />
              </UFormField>
            </div>

            <div>
              <UFormField  label="Joylashuv" required>
                <UInput
                  v-model="testForm.location"
                  placeholder="British Council Test Center, 123 Main St"
                />
              </UFormField>
            </div>

            <div>
              <UFormField  label="O'rinlar soni" required>
                <UInput
                  v-model.number="testForm.seats"
                  type="number"
                  placeholder="30"
                  :min="1"
                />
              </UFormField>
            </div>

            <div>
              <UFormField  label="Narx" required>
                <UInput
                  v-model.number="testForm.price"
                  type="number"
                  placeholder="250"
                  :min="0"
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
            <UButton label="Saqlash" @click="saveTest" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { useRouter, useRoute } from "vue-router";
import { useAuth } from "~/composables/useAuth";
import { api } from "~/lib/api";

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
const toast = useToast();
const router = useRouter();
const route = useRoute();
const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UPopover = resolveComponent("UPopover");

// State variables
const tests = ref<IELTSTest[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const statusFilter = ref("all");
const currentPage = ref(1);
const itemsPerPage = 10;
const totalItems = ref(0);

// Dialog states
const isDialogOpen = ref(false);
const isViewDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const isEditMode = ref(false);
const selectedTest = ref<IELTSTest | null>(null);
const deletePopoverOpen = ref<Record<string, boolean>>({});

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

// Status options for select menu
const statusOptions = [
  { label: "Barcha statuslar", value: "all" },
  { label: "Faol", value: "active" },
  { label: "Nofaol", value: "inactive" },
  { label: "To'liq", value: "full" },
];

// Table columns
const columns: TableColumn<IELTSTest>[] = [
  {
    accessorKey: "title",
    header: "Sarlavha",
    cell: ({ row }) => h("span", { class: "font-medium" }, row.original.title),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return h(UBadge, { variant: getStatusVariant(row.original.status) }, () =>
        getStatusLabel(row.original.status),
      );
    },
  },
  {
    accessorKey: "exam_date",
    header: "Imtihon sanasi",
    cell: ({ row }) => formatDate(row.original.exam_date),
  },
  {
    accessorKey: "time",
    header: "Vaqt",
  },
  {
    accessorKey: "location",
    header: "Joylashuv",
    cell: ({ row }) =>
      h("span", { class: "max-w-xs truncate" }, row.original.location),
  },
  {
    accessorKey: "seats",
    header: "O'rinlar",
  },
  {
    accessorKey: "price",
    header: "Narx",
    cell: ({ row }) => formatCurrency(row.original.price),
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      const testId = row.original.id;
      return h("div", { class: "flex items-center gap-1" }, [
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-pencil",
          size: "sm",
          square: true,
          onClick: () => editTest(row.original),
        }),
        h(
          UPopover,
          {
            open: deletePopoverOpen.value[testId] || false,
            "onUpdate:open": (value: boolean) => {
              deletePopoverOpen.value[testId] = value;
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
                  "Bu testni butunlay o'chiradi. Bu amalni ortga qaytarib bo'lmaydi.",
                ),
                h("div", { class: "flex justify-end gap-2 mt-3" }, [
                  h(UButton, {
                    color: "neutral",
                    variant: "subtle",
                    label: "Bekor qilish",
                    size: "sm",
                    onClick: () => {
                      deletePopoverOpen.value[testId] = false;
                    },
                  }),
                  h(UButton, {
                    color: "error",
                    label: "O'chirish",
                    size: "sm",
                    onClick: async () => {
                      selectedTest.value = row.original;
                      await deleteTest();
                      deletePopoverOpen.value[testId] = false;
                    },
                  }),
                ]),
              ]),
          },
        ),
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-arrow-right",
          size: "sm",
          square: true,
          onClick: () => viewRegistrations(row.original),
        }),
      ]);
    },
  },
];

// Computed properties
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

const paginationStart = computed(() => {
  return totalItems.value > 0 ? (currentPage.value - 1) * itemsPerPage + 1 : 0;
});

const paginationEnd = computed(() => {
  const end = currentPage.value * itemsPerPage;
  return Math.min(end, totalItems.value);
});

// API Functions
const fetchTests = async () => {
  loading.value = true;
  try {
    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: itemsPerPage.toString(),
    });

    if (searchQuery.value) {
      params.append("search", searchQuery.value);
    }

    if (statusFilter.value !== "all") {
      params.append("status", statusFilter.value);
    }

    const url = `/cd-ielts/tests?${params.toString()}`;
    const response = await api.get<{
      data: IELTSTest[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, url);

    tests.value = response.data || [];
    totalItems.value = response.total || 0;
  } catch (error) {
    console.error("Failed to fetch tests:", error);
    toast.add({
      title: "Xatolik",
      description: "Testlarni yuklashda xatolik yuz berdi",
      color: "error",
    });
    tests.value = [];
    totalItems.value = 0;
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
      return "solid";
    case "full":
      return "subtle";
    case "inactive":
      return "outline";
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
    toast.add({
      title: "Xatolik",
      description: "Sarlavhani kiriting",
      color: "error",
    });
    return;
  }

  if (!testForm.value.status) {
    toast.add({
      title: "Xatolik",
      description: "Statusni tanlang",
      color: "error",
    });
    return;
  }

  if (!testForm.value.exam_date) {
    toast.add({
      title: "Xatolik",
      description: "Imtihon sanasini kiriting",
      color: "error",
    });
    return;
  }

  if (!testForm.value.time) {
    toast.add({
      title: "Xatolik",
      description: "Vaqtni kiriting",
      color: "error",
    });
    return;
  }

  if (!testForm.value.location) {
    toast.add({
      title: "Xatolik",
      description: "Joylashuvni kiriting",
      color: "error",
    });
    return;
  }

  if (testForm.value.seats === null || testForm.value.seats < 1) {
    toast.add({
      title: "Xatolik",
      description: "O'rinlar sonini kiriting",
      color: "error",
    });
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
    toast.add({
      title: "Xatolik",
      description: "Narxni kiriting",
      color: "error",
    });
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
        payload,
      );
      toast.add({
        title: "Muvaffaqiyat",
        description: "Test muvaffaqiyatli yangilandi",
        color: "success",
      });
    } else {
      await api.post(apiService.value, "/cd-ielts/tests", payload);
      toast.add({
        title: "Muvaffaqiyat",
        description: "Test muvaffaqiyatli qo'shildi",
        color: "success",
      });
    }

    isDialogOpen.value = false;
    await fetchTests();
  } catch (error: any) {
    console.error("Failed to save test:", error);
    toast.add({
      title: "Xatolik",
      description:
        error?.response?.data?.message || "Testni saqlashda xatolik yuz berdi",
      color: "error",
    });
  }
};

const deleteTest = async () => {
  if (!selectedTest.value) {
    toast.add({
      title: "Xatolik",
      description: "Test tanlanmagan",
      color: "error",
    });
    return;
  }

  if (!selectedTest.value.id) {
    toast.add({
      title: "Xatolik",
      description: "Test ID topilmadi",
      color: "error",
    });
    return;
  }

  try {
    await api.delete(
      apiService.value,
      `/cd-ielts/tests/${selectedTest.value.id}`,
    );
    toast.add({
      title: "Muvaffaqiyat",
      description: "Test muvaffaqiyatli o'chirildi",
      color: "success",
    });
    isDeleteDialogOpen.value = false;
    selectedTest.value = null;
    await fetchTests();
  } catch (error) {
    console.error("Failed to delete test:", error);
    toast.add({
      title: "Xatolik",
      description: "Testni o'chirishda xatolik yuz berdi",
      color: "error",
    });
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
  fetchTests();
});

watch(currentPage, () => {
  updateUrlParams();
  fetchTests();
});
</script>
