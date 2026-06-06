<template>
  <UDashboardPanel id="group-teacher-gradings">
    <template #header>
      <UDashboardNavbar
        :title="`Baholar — ${groupName}`"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            @click="navigateTo({ path: '/groups', query: route.query })"
          />
        </template>

        <template #description>
          O'qituvchi baholari ro'yxati
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Talabani qidirish..."
            class="w-64"
          />
        </template>

        <template #right>
          <UInput
            v-model="startDate"
            type="date"
            class="w-40"
            placeholder="Boshlanish sanasi"
          />

          <UInput
            v-model="endDate"
            type="date"
            class="w-40"
            placeholder="Tugash sanasi"
          />

          <USelectMenu v-model="limit" :items="[10, 20, 30, 50]" class="w-24">
            <template #label> {{ limit }} ta </template>
          </USelectMenu>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div>
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 px-4 pt-4">
          <UCard>
            <div class="flex items-center gap-3">
              <div class="p-2 bg-primary-50 dark:bg-primary-950 rounded-lg">
                <UIcon name="i-lucide-bar-chart-3" class="text-primary text-xl" />
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Jami baholar</p>
                <p class="text-2xl font-bold">{{ totalItems }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-3">
              <div class="p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                <UIcon name="i-lucide-trending-up" class="text-green-500 text-xl" />
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">O'rtacha baho</p>
                <p class="text-2xl font-bold">{{ averageGrade }}</p>
              </div>
            </div>
          </UCard>

          <UCard>
            <div class="flex items-center gap-3">
              <div class="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <UIcon name="i-lucide-percent" class="text-blue-500 text-xl" />
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">O'rtacha foiz</p>
                <p class="text-2xl font-bold">{{ averagePercent }}%</p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Gradings Table -->
        <UCard class="mx-4">
          <template #header>
            <h3 class="text-base font-semibold">Baholar ro'yxati</h3>
          </template>

          <UTable
            :data="filteredGradings"
            :columns="columns"
            :loading="isLoading"
            :empty="'Baholar topilmadi'"
          />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                <span class="font-medium">{{ totalItems }}</span> baho
              </div>

              <UPagination
                :model-value="page"
                :total="totalItems"
                :items-per-page="limit"
                show-last
                show-first
                @update:page="(p: number) => (page = p)"
              />
            </div>
          </template>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Grading, PaginatedResponse } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const UBadge = resolveComponent("UBadge");
const UAvatar = resolveComponent("UAvatar");

const { apiService } = useAuth();
const toast = useToast();
const route = useRoute();
const router = useRouter();

// Route params
const groupId = computed(() => route.params.groupId as string);
const teacherId = computed(() => route.params.teacherId as string);

// Data
const gradings = ref<Grading[]>([]);
const isLoading = ref(true);
const groupName = ref("");
const totalItems = ref(0);
const search = ref("");
const page = ref(1);
const limit = ref(10);
const startDate = ref("");
const endDate = ref("");

// Computed: average grade
const averageGrade = computed(() => {
  if (gradings.value.length === 0) return "0.0";
  const sum = gradings.value.reduce((acc, g) => acc + g.grade, 0);
  return (sum / gradings.value.length).toFixed(1);
});

// Computed: average percent
const averagePercent = computed(() => {
  if (gradings.value.length === 0) return "0";
  const sum = gradings.value.reduce((acc, g) => acc + g.percent, 0);
  return Math.round(sum / gradings.value.length);
});

// Computed: client-side search filter
const filteredGradings = computed(() => {
  if (!search.value) return gradings.value;
  const searchLower = search.value.toLowerCase();
  return gradings.value.filter((grading) => {
    const studentName = grading.student
      ? `${grading.student.first_name} ${grading.student.last_name}`.toLowerCase()
      : "";
    const lessonName = grading.lesson_name?.toLowerCase() || "";
    const note = grading.note?.toLowerCase() || "";
    return (
      studentName.includes(searchLower) ||
      lessonName.includes(searchLower) ||
      note.includes(searchLower)
    );
  });
});

// Pagination helpers
const paginationStart = computed(() => {
  return totalItems.value === 0 ? 0 : (page.value - 1) * limit.value + 1;
});

const paginationEnd = computed(() => {
  return Math.min(page.value * limit.value, totalItems.value);
});

// Grade color helpers
const getGradeColor = (grade: number): string => {
  if (grade >= 9) return "success";
  if (grade >= 7) return "primary";
  if (grade >= 5) return "warning";
  return "error";
};

const getPercentColor = (percent: number): string => {
  if (percent >= 85) return "success";
  if (percent >= 65) return "primary";
  if (percent >= 45) return "warning";
  return "error";
};

// Table columns
const columns: TableColumn<Grading>[] = [
  {
    accessorKey: "student",
    header: "Talaba",
    cell: ({ row }) => {
      const student = row.original.student;
      if (!student) return h("span", { class: "text-gray-400" }, "N/A");

      const initials = `${student.first_name.charAt(0)}${student.last_name.charAt(0)}`.toUpperCase();

      return h("div", { class: "flex items-center gap-3" }, [
        h(
          UAvatar,
          {
            alt: `${student.first_name} ${student.last_name}`,
            size: "sm",
          },
          {
            fallback: () => initials,
          },
        ),
        h("div", {}, [
          h(
            "div",
            { class: "font-medium" },
            `${student.first_name} ${student.last_name}`,
          ),
          h(
            "div",
            { class: "text-xs text-gray-500" },
            student.username || "",
          ),
        ]),
      ]);
    },
  },
  {
    accessorKey: "grade",
    header: "Baho",
    cell: ({ row }) => {
      return h(
        UBadge,
        {
          color: getGradeColor(row.original.grade),
          variant: "subtle",
          size: "lg",
        },
        () => `${row.original.grade}/10`,
      );
    },
  },
  {
    accessorKey: "percent",
    header: "Foiz",
    cell: ({ row }) => {
      return h(
        UBadge,
        {
          color: getPercentColor(row.original.percent),
          variant: "outline",
        },
        () => `${row.original.percent}%`,
      );
    },
  },
  {
    accessorKey: "lesson_name",
    header: "Dars nomi",
    cell: ({ row }) => {
      return h(
        "span",
        { class: row.original.lesson_name ? "" : "text-gray-400 italic" },
        row.original.lesson_name || "—",
      );
    },
  },
  {
    accessorKey: "note",
    header: "Izoh",
    cell: ({ row }) => {
      const note = row.original.note;
      if (!note) return h("span", { class: "text-gray-400 italic" }, "—");
      const truncated = note.length > 40 ? note.substring(0, 40) + "..." : note;
      return h("span", { class: "text-sm", title: note }, truncated);
    },
  },
  {
    accessorKey: "createdAt",
    header: "Sana",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];

// Helper functions
const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

// Data loading
const loadGradings = async () => {
  isLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.append("groupId", groupId.value);
    params.append("teacherId", teacherId.value);
    params.append("page", page.value.toString());
    params.append("limit", limit.value.toString());

    if (startDate.value) {
      params.append("startDate", new Date(startDate.value).toISOString());
    }
    if (endDate.value) {
      // Set end of day for endDate
      const end = new Date(endDate.value);
      end.setHours(23, 59, 59, 999);
      params.append("endDate", end.toISOString());
    }

    const response = await api.get<PaginatedResponse<Grading>>(
      apiService.value,
      `/gradings?${params.toString()}`,
    );

    gradings.value = response.data;
    totalItems.value = response.total;
  } catch (error) {
    console.error("Failed to load gradings:", error);
    toast.add({
      title: "Xatolik",
      description: "Baholarni yuklashda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const loadGroupInfo = async () => {
  try {
    const response = await api.get<any>(
      apiService.value,
      `/groups/${groupId.value}`,
    );
    groupName.value = response.name;
  } catch (error) {
    console.error("Failed to load group info:", error);
    groupName.value = "Guruh";
  }
};

// URL parameter management
const updateUrlParams = () => {
  const query: Record<string, string> = {
    page: page.value.toString(),
    limit: limit.value.toString(),
  };

  if (search.value) {
    query.query = search.value;
  }
  if (startDate.value) {
    query.startDate = startDate.value;
  }
  if (endDate.value) {
    query.endDate = endDate.value;
  }

  router.push({ query });
};

// Load data on mount
onMounted(async () => {
  // Initialize from URL parameters
  if (route.query.page) {
    page.value = parseInt(route.query.page as string) || 1;
  }
  if (route.query.limit) {
    limit.value = parseInt(route.query.limit as string) || 10;
  }
  if (route.query.query) {
    search.value = route.query.query as string;
  }
  if (route.query.startDate) {
    startDate.value = route.query.startDate as string;
  }
  if (route.query.endDate) {
    endDate.value = route.query.endDate as string;
  }

  await Promise.all([loadGradings(), loadGroupInfo()]);
});

// Debounce search
let searchTimeout: NodeJS.Timeout | null = null;
watch(search, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    page.value = 1;
    updateUrlParams();
  }, 300);
});

// Reload when page, limit, or date filters change
watch([page, limit], () => {
  updateUrlParams();
  loadGradings();
});

watch([startDate, endDate], () => {
  page.value = 1;
  updateUrlParams();
  loadGradings();
});
</script>
