<template>
  <UDashboardPanel id="leads">
    <template #header>
      <UDashboardNavbar title="Lead boshqaruvi" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          Potentsial talaba leadlarini kuzatish va boshqarish
        </template>

        <template #right>
          <LeadsAddLeadModal
            :status-options="statusOptions"
            :source-options="sourceOptions"
            @submit="loadLeads"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div>
        <!-- Filters Section -->
        <UDashboardToolbar>
          <template #left>
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Leadlarni qidirish..."
              class="w-64"
            />
          </template>

          <template #right>
            <USelectMenu
              :model-value="filterStatus"
              @update:model-value="(val: string | any) => filterStatus = typeof val === 'string' ? val : val?.value || ''"
              :items="statusOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Holat"
              class="w-45"
            />

            <USelectMenu
              :model-value="filterSource"
              @update:model-value="(val: string | any) => filterSource = typeof val === 'string' ? val : val?.value || ''"
              :items="sourceOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Manba"
              class="w-45"
            />

            <UInput
              v-model="startDate"
              type="date"
              placeholder="Boshlanish sanasi"
              class="w-48"
            />

            <UInput
              v-model="endDate"
              type="date"
              placeholder="Tugash sanasi"
              class="w-48"
            />

            <UButton
              variant="outline"
              icon="i-lucide-download"
              label="CSV eksport"
              @click="exportLeadsToCSV"
            />
          </template>
        </UDashboardToolbar>

        <!-- Leads Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Leadlar ro'yxati</h3>
          </template>

          <UTable
            :data="filteredLeads"
            :columns="columns"
            :loading="isLoading"
            :empty="'Leadlar topilmadi'"
          />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                <span class="font-medium">{{ totalLeads }}</span> lead
              </div>

              <UPagination
                :model-value="currentPage"
                :total="totalLeads"
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
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");

definePageMeta({
  middleware: ["auth"],
});

// Types
interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: string;
  source: string;
  question?: string;
  course_id?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TrialLesson {
  id: string;
  lead_id: string;
  teacher_id: string;
  teacher_name: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  notes?: string;
}

// Composables
const { apiService } = useAuth();
const toast = useToast();
const route = useRoute();
const router = useRouter();

// State
const leads = ref<Lead[]>([]);
const courses = ref<any[]>([]);
const teachers = ref<any[]>([]);
const isLoading = ref(true);
const isUpdating = ref(false);
const isDeleting = ref(false);
const isSavingTrial = ref(false);
const isCreatingStudent = ref(false);

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalLeads = ref(0);

const totalPages = computed(() =>
  Math.ceil(totalLeads.value / itemsPerPage.value)
);
const paginationStart = computed(
  () => (currentPage.value - 1) * itemsPerPage.value + 1
);
const paginationEnd = computed(() =>
  Math.min(currentPage.value * itemsPerPage.value, totalLeads.value)
);

// Filters
const search = ref("");
const filterStatus = ref("");
const filterSource = ref("");
const startDate = ref("");
const endDate = ref("");

// Modals
const viewLeadDialog = ref(false);
const changeStatusDialog = ref(false);
const trialLessonDialog = ref(false);
const deleteConfirmDialog = ref(false);
const convertToStudentDialog = ref(false);
const editLeadDialog = ref(false);
const showPassword = ref(false);

const selectedLead = ref<Lead | null>(null);
const leadTrialLessons = ref<TrialLesson[]>([]);

// Form data

const trialLesson = ref({
  teacher_id: "",
  scheduled_date: "",
  scheduled_time: "",
  status: "scheduled",
  notes: "",
});

const studentData = ref({
  username: "",
  password: "",
  level_id: "",
});

// Table columns with render functions
const columns: TableColumn<Lead>[] = [
  {
    accessorKey: "first_name",
    header: "Ism",
    cell: ({ row }) => {
      return h("div", {}, [
        h(
          "div",
          { class: "font-medium" },
          `${row.original.first_name} ${row.original.last_name}`
        ),
        h("div", { class: "text-xs text-gray-500" }, `ID: ${row.original.id}`),
      ]);
    },
  },
  {
    accessorKey: "phone",
    header: "Telefon",
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
        () => getStatusDisplay(row.original.status)
      );
    },
  },
  {
    accessorKey: "source",
    header: "Manba",
    cell: ({ row }) => getSourceDisplay(row.original.source),
  },
  {
    accessorKey: "course",
    header: "Qiziqayotgan kurs",
    cell: ({ row }) => getCourseTitle(row.original.course_id),
  },
  {
    accessorKey: "createdAt",
    header: "Yaratilgan",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      return h("div", { class: "flex items-center gap-1" }, [
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-eye",
          size: "sm",
          square: true,
          onClick: () => viewLead(row.original),
        }),
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-pencil",
          size: "sm",
          square: true,
          onClick: () => editLead(row.original),
        }),
        h(
          UDropdownMenu,
          {
            items: getLeadActions(row.original),
            content: { align: "end" },
          },
          () =>
            h(UButton, {
              variant: "ghost",
              icon: "i-lucide-more-vertical",
              size: "sm",
              square: true,
            })
        ),
      ]);
    },
  },
];

// Options
const statusOptions = [
  { label: "Barcha holatlar", value: "" },
  { label: "Yangi", value: "Yangi" },
  { label: "Aloqada", value: "Aloqada" },
  { label: "Sinovda", value: "Sinovda" },
  { label: "Sinovda qatnashdi", value: "Sinovda qatnashdi" },
  { label: "O'qishga yozildi", value: "O'qishga yozildi" },
  { label: "Yo'qotildi", value: "Yo'qotildi" },
];

const sourceOptions = [
  { label: "Barcha manbalar", value: "" },
  { label: "Instagram", value: "Instagram" },
  { label: "Telegram", value: "Telegram" },
  { label: "Do'stimdan", value: "Do'stimdan" },
  { label: "O'zim keldim", value: "O'zim keldim" },
  { label: "Flayer", value: "Flayer" },
  { label: "Banner(yondagi)", value: "Banner(yondagi)" },
  { label: "Banner(ko'chadagi)", value: "Banner(ko'chadagi)" },
  { label: "Boshqa", value: "Boshqa" },
];

const dateOptions = [
  { label: "Barcha vaqt", value: "" },
  { label: "Bugun", value: "today" },
  { label: "Kecha", value: "yesterday" },
  { label: "Shu hafta", value: "week" },
  { label: "Shu oy", value: "month" },
];

const trialStatusOptions = [
  { label: "Rejalashtirilgan", value: "scheduled" },
  { label: "Yakunlandi", value: "completed" },
  { label: "Bekor qilindi", value: "cancelled" },
];

// Computed
const courseOptions = computed(() => courses.value);
const teacherOptions = computed(() =>
  teachers.value.map((t) => ({
    ...t,
    name: `${t.first_name} ${t.last_name}`,
  }))
);

// Using server-side filtering, so filteredLeads just returns leads
const filteredLeads = computed(() => leads.value);

// Helper functions
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Yangi: "blue",
    Aloqada: "yellow",
    Sinovda: "purple",
    "Sinovda qatnashdi": "indigo",
    "O'qishga yozildi": "green",
    "Yo'qotildi": "red",
  };
  return colors[status] || "gray";
};

const getStatusDisplay = (status: string) => status;
const getSourceDisplay = (source: string) => source;

const getCourseTitle = (courseId?: string) => {
  if (!courseId) return "N/A";
  const course = courses.value.find((c) => c.id === courseId);
  return course ? course.title : "N/A";
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// Dropdown actions
const getLeadActions = (lead: Lead) => [
  [
    {
      label: "Holatni o'zgartirish",
      icon: "i-lucide-refresh-cw",
      onSelect: () => changeLeadStatus(lead),
    },
  ],
  [
    {
      label: "Sinov darsini rejalashtirish",
      icon: "i-lucide-calendar-plus",
      onSelect: () => scheduleTrialLesson(lead),
    },
  ],
  [
    {
      label: "Talabaga aylantirish",
      icon: "i-lucide-user-check",
      onSelect: () => convertToStudent(lead),
    },
  ],
  [
    {
      label: "O'chirish",
      icon: "i-lucide-trash-2",
      onSelect: () => deleteLead(lead),
      class: "text-red-600 dark:text-red-400",
    },
  ],
];

// API functions
const loadLeads = async () => {
  isLoading.value = true;
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: itemsPerPage.value.toString(),
    });

    if (search.value) params.append("search", search.value);
    if (filterStatus.value) params.append("status", filterStatus.value);
    if (filterSource.value) params.append("source", filterSource.value);
    if (startDate.value) params.append("startDate", startDate.value);
    if (endDate.value) params.append("endDate", endDate.value);

    const response = await api.get<{ leads: Lead[]; total: number }>(
      apiService.value,
      `/leads?${params.toString()}`
    );

    leads.value = response.leads || [];
    totalLeads.value = response.total || 0;
  } catch (error) {
    console.error("Failed to load leads:", error);
    toast.add({
      title: "Xatolik",
      description: "Leadlarni yuklashda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const loadCourses = async () => {
  try {
    const response = await api.get<any[]>(apiService.value, "/courses");
    courses.value = response;
  } catch (error) {
    console.error("Failed to load courses:", error);
  }
};

const loadTeachers = async () => {
  try {
    const response = await api.get<{ data: any[] }>(
      apiService.value,
      "/users/teachers"
    );
    teachers.value = response.data || [];
  } catch (error) {
    console.error("Failed to load teachers:", error);
  }
};

const updateLead = async () => {
  if (!selectedLead.value) return;

  isUpdating.value = true;
  try {
    await api.put(
      apiService.value,
      `/leads/${selectedLead.value.id}`,
      selectedLead.value
    );
    toast.add({
      title: "Muvaffaqiyatli",
      description: "Lead ma'lumotlari yangilandi",
      color: "success",
    });
    editLeadDialog.value = false;
    loadLeads();
  } catch (error) {
    console.error("Failed to update lead:", error);
    toast.add({
      title: "Xatolik",
      description: "Lead yangilashda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isUpdating.value = false;
  }
};

const confirmDeleteLead = async () => {
  if (!selectedLead.value) return;

  isDeleting.value = true;
  try {
    await api.delete(apiService.value, `/leads/${selectedLead.value.id}`);
    toast.add({
      title: "Muvaffaqiyatli",
      description: "Lead o'chirildi",
      color: "success",
    });
    deleteConfirmDialog.value = false;
    loadLeads();
  } catch (error) {
    console.error("Failed to delete lead:", error);
    toast.add({
      title: "Xatolik",
      description: "Lead o'chirishda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
};

const saveTrialLesson = async () => {
  if (!selectedLead.value) return;

  isSavingTrial.value = true;
  try {
    await api.post(apiService.value, "/trial-lessons", {
      ...trialLesson.value,
      lead_id: selectedLead.value.id,
    });
    toast.add({
      title: "Muvaffaqiyatli",
      description: "Sinov darsi rejalashtirildi",
      color: "success",
    });
    trialLessonDialog.value = false;
    resetTrialLesson();
  } catch (error) {
    console.error("Failed to schedule trial lesson:", error);
    toast.add({
      title: "Xatolik",
      description: "Sinov darsini rejalashtirishda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isSavingTrial.value = false;
  }
};

const convertLeadToStudent = async () => {
  if (!selectedLead.value) return;

  isCreatingStudent.value = true;
  try {
    await api.post(apiService.value, "/leads/convert-to-student", {
      lead_id: selectedLead.value.id,
      ...studentData.value,
      first_name: selectedLead.value.first_name,
      last_name: selectedLead.value.last_name,
      phone: selectedLead.value.phone,
    });
    toast.add({
      title: "Muvaffaqiyatli",
      description: "Lead talabaga aylantirildi",
      color: "success",
    });
    convertToStudentDialog.value = false;
    resetStudentData();
    loadLeads();
  } catch (error) {
    console.error("Failed to convert lead to student:", error);
    toast.add({
      title: "Xatolik",
      description: "Leadni talabaga aylantirishda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isCreatingStudent.value = false;
  }
};

const saveStatusChange = async () => {
  if (!selectedLead.value) return;

  isUpdating.value = true;
  try {
    await api.put(apiService.value, `/leads/${selectedLead.value.id}`, {
      status: selectedLead.value.status,
    });
    toast.add({
      title: "Muvaffaqiyatli",
      description: "Holat o'zgartirildi",
      color: "success",
    });
    changeStatusDialog.value = false;
    loadLeads();
  } catch (error) {
    console.error("Failed to change status:", error);
    toast.add({
      title: "Xatolik",
      description: "Holatni o'zgartirishda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isUpdating.value = false;
  }
};

// Action handlers
const viewLead = async (lead: Lead) => {
  selectedLead.value = lead;

  // Load trial lessons for this lead
  try {
    const trials = await api.get<TrialLesson[]>(
      apiService.value,
      `/trial-lessons?lead_id=${lead.id}`
    );
    leadTrialLessons.value = trials;
  } catch (error) {
    console.error("Failed to load trial lessons:", error);
  }

  viewLeadDialog.value = true;
};

const editLead = (lead: Lead) => {
  selectedLead.value = { ...lead };
  editLeadDialog.value = true;
};

const editFromView = () => {
  viewLeadDialog.value = false;
  editLeadDialog.value = true;
};

const changeLeadStatus = (lead: Lead) => {
  selectedLead.value = { ...lead };
  changeStatusDialog.value = true;
};

const scheduleTrialLesson = (lead: Lead) => {
  selectedLead.value = lead;
  resetTrialLesson();
  trialLessonDialog.value = true;
};

const convertToStudent = (lead: Lead) => {
  selectedLead.value = lead;
  studentData.value.username = `${lead.first_name.toLowerCase()}_${lead.last_name.toLowerCase()}`;
  convertToStudentDialog.value = true;
};

const deleteLead = (lead: Lead) => {
  selectedLead.value = lead;
  deleteConfirmDialog.value = true;
};

const refreshLeads = () => {
  loadLeads();
};

const exportLeadsToCSV = () => {
  const headers = [
    "Ism",
    "Familiya",
    "Telefon",
    "Holat",
    "Manba",
    "Kurs",
    "Yaratilgan",
  ];
  const rows = filteredLeads.value.map((lead) => [
    lead.first_name,
    lead.last_name,
    lead.phone,
    lead.status,
    lead.source,
    getCourseTitle(lead.course_id || ""),
    formatDate(lead.createdAt),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `leads_${new Date().toISOString()}.csv`);
  link.click();
};

// Reset functions
const resetTrialLesson = () => {
  trialLesson.value = {
    teacher_id: "",
    scheduled_date: "",
    scheduled_time: "",
    status: "scheduled",
    notes: "",
  };
};

const resetStudentData = () => {
  studentData.value = {
    username: "",
    password: "",
    level_id: "",
  };
};

// URL param updates
const updateUrlParams = () => {
  const query: Record<string, string> = {
    page: currentPage.value.toString(),
    limit: itemsPerPage.value.toString(),
  };

  if (search.value) query.search = search.value;
  if (filterStatus.value) query.status = filterStatus.value;
  if (filterSource.value) query.source = filterSource.value;
  if (startDate.value) query.startDate = startDate.value;
  if (endDate.value) query.endDate = endDate.value;

  router.push({ query });
};

// Watchers
watch([currentPage, itemsPerPage], () => {
  updateUrlParams();
  loadLeads();
});

watch([search, filterStatus, filterSource, startDate, endDate], () => {
  currentPage.value = 1;
  updateUrlParams();
  loadLeads();
});

// Lifecycle
onMounted(() => {
  if (route.query.page) {
    currentPage.value = parseInt(route.query.page as string) || 1;
  }
  if (route.query.limit) {
    itemsPerPage.value = parseInt(route.query.limit as string) || 10;
  }
  if (route.query.search) {
    search.value = route.query.search as string;
  }
  if (route.query.status) {
    filterStatus.value = route.query.status as string;
  }
  if (route.query.source) {
    filterSource.value = route.query.source as string;
  }
  if (route.query.startDate) {
    startDate.value = route.query.startDate as string;
  }
  if (route.query.endDate) {
    endDate.value = route.query.endDate as string;
  }

  loadLeads();
  loadCourses();
  loadTeachers();
});
</script>
