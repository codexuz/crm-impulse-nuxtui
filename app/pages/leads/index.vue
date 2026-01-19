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
              @update:model-value="
                (val: string | any) =>
                  (filterStatus =
                    typeof val === 'string' ? val : val?.value || '')
              "
              :items="statusOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="Holat"
              class="w-45"
            />

            <USelectMenu
              :model-value="filterSource"
              @update:model-value="
                (val: string | any) =>
                  (filterSource =
                    typeof val === 'string' ? val : val?.value || '')
              "
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
              label="Excel eksport"
              @click="exportLeadsToExcel"
            />
          </template>
        </UDashboardToolbar>

        <!-- Leads Table -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold">Leadlar ro'yxati</h3>
              <div v-if="selectedRowsCount > 0" class="flex items-center gap-2">
                <span class="text-sm text-muted"
                  >{{ selectedRowsCount }} ta tanlandi</span
                >
                <UButton
                  color="error"
                  variant="outline"
                  icon="i-lucide-trash-2"
                  label="O'chirish"
                  size="sm"
                  :loading="isBulkDeleting"
                  @click="bulkDeleteLeads"
                />
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-archive"
                  label="Arxivlash"
                  size="sm"
                  :loading="isBulkArchiving"
                  @click="bulkArchiveLeads"
                />
              </div>
            </div>
          </template>

          <UTable
            ref="table"
            v-model:row-selection="rowSelection"
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
                @update:page="(p: number) => (currentPage = p)"
              />
            </div>
          </template>
        </UCard>
      </div>

      <!-- View Lead Modal -->
      <LeadsViewLeadModal
        v-model:open="viewLeadDialog"
        :lead="selectedLead"
        :courses="courses"
        @edit="editFromView"
      />

      <!-- Edit Lead Modal -->
      <LeadsEditLeadModal
        v-model:open="editLeadDialog"
        :lead="selectedLead"
        :status-options="statusOptions"
        :source-options="sourceOptions"
        :courses="courses"
        @updated="loadLeads"
      />

      <!-- Change Status Modal -->
      <LeadsChangeLeadStatusModal
        v-model:open="changeStatusDialog"
        :lead="selectedLead"
        :status-options="statusOptions"
        @updated="loadLeads"
      />

      <!-- Trial Lesson Modal -->
      <LeadsLeadTrialLessonModal
        v-model:open="trialLessonDialog"
        :lead="selectedLead"
        @created="loadLeads"
      />

      <!-- Convert to Student Modal -->
      <LeadsConvertLeadStudentModal
        v-model:open="convertToStudentDialog"
        :lead="selectedLead"
        @converted="loadLeads"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const UCheckbox = resolveComponent("UCheckbox");
const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UPopover = resolveComponent("UPopover");

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
const isDeleting = ref(false);
const isBulkDeleting = ref(false);
const isBulkArchiving = ref(false);

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalLeads = ref(0);

const totalPages = computed(() =>
  Math.ceil(totalLeads.value / itemsPerPage.value),
);
const paginationStart = computed(
  () => (currentPage.value - 1) * itemsPerPage.value + 1,
);
const paginationEnd = computed(() =>
  Math.min(currentPage.value * itemsPerPage.value, totalLeads.value),
);

// Filters
const search = ref("");
const filterStatus = ref("");
const filterSource = ref("");
const startDate = ref("");
const endDate = ref("");

// Modals
const viewLeadDialog = ref(false);
const editLeadDialog = ref(false);
const changeStatusDialog = ref(false);
const trialLessonDialog = ref(false);
const convertToStudentDialog = ref(false);
const showPassword = ref(false);
const deletePopoverOpen = ref<Record<string, boolean>>({});

const selectedLead = ref<Lead | null>(null);
const rowSelection = ref({});
const table = useTemplateRef<{ tableApi?: any }>("table");

// Table columns with render functions
const columns: TableColumn<Lead>[] = [
  {
    id: "select",
    header: ({ table }): any =>
      h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
          ? "indeterminate"
          : table.getIsAllPageRowsSelected(),
        "onUpdate:modelValue": (value: boolean | "indeterminate") =>
          table.toggleAllPageRowsSelected(!!value),
        "aria-label": "Select all",
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        modelValue: row.getIsSelected(),
        "onUpdate:modelValue": (value: boolean | "indeterminate") =>
          row.toggleSelected(!!value),
        "aria-label": "Select row",
      }),
  },
  {
    accessorKey: "first_name",
    header: "Ism",
    cell: ({ row }) => {
      return h("div", {}, [
        h(
          "div",
          { class: "font-medium" },
          `${row.original.first_name} ${row.original.last_name}`,
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
        () => getStatusDisplay(row.original.status),
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
    header: ({ column }) => {
      const isSorted = column.getIsSorted();

      return h(UButton, {
        color: "neutral",
        variant: "ghost",
        label: "Yaratilgan",
        icon: isSorted
          ? isSorted === "asc"
            ? "i-lucide-arrow-up-narrow-wide"
            : "i-lucide-arrow-down-wide-narrow"
          : "i-lucide-arrow-up-down",
        class: "-mx-2.5",
        onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
      });
    },
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      const leadId = row.original.id;
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
          UPopover,
          {
            open: deletePopoverOpen.value[leadId] || false,
            "onUpdate:open": (value: boolean) => {
              deletePopoverOpen.value[leadId] = value;
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
                  "Bu leadni butunlay o'chiradi va barcha bog'langan ma'lumotlarni olib tashlaydi.",
                ),
                h("div", { class: "flex justify-end gap-2 mt-3" }, [
                  h(UButton, {
                    color: "neutral",
                    variant: "subtle",
                    label: "Bekor qilish",
                    size: "sm",
                    onClick: () => {
                      deletePopoverOpen.value[leadId] = false;
                    },
                  }),
                  h(UButton, {
                    color: "red",
                    label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                    loading: isDeleting.value,
                    size: "sm",
                    onClick: async () => {
                      await confirmDeleteLead(row.original);
                      deletePopoverOpen.value[leadId] = false;
                    },
                  }),
                ]),
              ]),
          },
        ),
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
            }),
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
  })),
);

// Using server-side filtering, so filteredLeads just returns leads
const filteredLeads = computed(() => leads.value);

const selectedRowsCount = computed((): number => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows.length || 0;
});

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
      label: "Arxivlash",
      icon: "i-lucide-archive",
      onSelect: () => archiveLead(lead),
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
      `/leads?${params.toString()}`,
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
      "/users/teachers",
    );
    teachers.value = response.data || [];
  } catch (error) {
    console.error("Failed to load teachers:", error);
  }
};

const confirmDeleteLead = async (lead: Lead) => {
  isDeleting.value = true;
  try {
    await api.delete(apiService.value, `/leads/${lead.id}`);
    toast.add({
      title: "Muvaffaqiyatli",
      description: "Lead o'chirildi",
      color: "success",
    });
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

// Action handlers
const viewLead = async (lead: Lead) => {
  selectedLead.value = lead;
  viewLeadDialog.value = true;
};

const editLead = (lead: Lead) => {
  selectedLead.value = lead;
  editLeadDialog.value = true;
};

const editFromView = (lead: Lead) => {
  viewLeadDialog.value = false;
  selectedLead.value = lead;
  editLeadDialog.value = true;
};

const changeLeadStatus = (lead: Lead) => {
  selectedLead.value = lead;
  changeStatusDialog.value = true;
};

const scheduleTrialLesson = (lead: Lead) => {
  selectedLead.value = lead;
  trialLessonDialog.value = true;
};

const convertToStudent = (lead: Lead) => {
  selectedLead.value = lead;
  convertToStudentDialog.value = true;
};

const archiveLead = async (lead: Lead) => {
  try {
    await api.patch(apiService.value, `/leads/${lead.id}/archive`, {});
    toast.add({
      title: "Muvaffaqiyatli",
      description: "Lead arxivlandi",
      color: "success",
    });
    loadLeads();
  } catch (error) {
    console.error("Failed to archive lead:", error);
    toast.add({
      title: "Xatolik",
      description: "Lead arxivlashda xatolik yuz berdi",
      color: "error",
    });
  }
};

const bulkDeleteLeads = async () => {
  const selectedRows =
    table.value?.tableApi?.getFilteredSelectedRowModel().rows || [];
  if (selectedRows.length === 0) return;

  isBulkDeleting.value = true;
  try {
    const deletePromises = selectedRows.map((row: any) =>
      api.delete(apiService.value, `/leads/${row.original.id}`),
    );
    await Promise.all(deletePromises);

    toast.add({
      title: "Muvaffaqiyatli",
      description: `${selectedRows.length} ta lead o'chirildi`,
      color: "success",
    });

    rowSelection.value = {};
    loadLeads();
  } catch (error) {
    console.error("Failed to bulk delete leads:", error);
    toast.add({
      title: "Xatolik",
      description: "Leadlarni o'chirishda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isBulkDeleting.value = false;
  }
};

const bulkArchiveLeads = async () => {
  const selectedRows =
    table.value?.tableApi?.getFilteredSelectedRowModel().rows || [];
  if (selectedRows.length === 0) return;

  isBulkArchiving.value = true;
  try {
    const archivePromises = selectedRows.map((row: any) =>
      api.patch(apiService.value, `/leads/${row.original.id}/archive`, {}),
    );
    await Promise.all(archivePromises);

    toast.add({
      title: "Muvaffaqiyatli",
      description: `${selectedRows.length} ta lead arxivlandi`,
      color: "success",
    });

    rowSelection.value = {};
    loadLeads();
  } catch (error) {
    console.error("Failed to bulk archive leads:", error);
    toast.add({
      title: "Xatolik",
      description: "Leadlarni arxivlashda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isBulkArchiving.value = false;
  }
};

const refreshLeads = () => {
  loadLeads();
};

const exportLeadsToExcel = async () => {
  try {
    const XLSX = await import("xlsx");

    const data = filteredLeads.value.map((lead) => ({
      Ism: lead.first_name,
      Familiya: lead.last_name,
      Telefon: lead.phone,
      Holat: lead.status,
      Manba: lead.source,
      Kurs: getCourseTitle(lead.course_id || ""),
      Yaratilgan: formatDate(lead.createdAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leadlar");

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Ism
      { wch: 15 }, // Familiya
      { wch: 15 }, // Telefon
      { wch: 20 }, // Holat
      { wch: 20 }, // Manba
      { wch: 25 }, // Kurs
      { wch: 15 }, // Yaratilgan
    ];
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(
      workbook,
      `leads_${new Date().toISOString().split("T")[0]}.xlsx`,
    );

    toast.add({
      title: "Muvaffaqiyatli",
      description: "Leadlar Excel faylga eksport qilindi",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to export leads:", error);
    toast.add({
      title: "Xatolik",
      description: "Leadlarni eksport qilishda xatolik yuz berdi",
      color: "error",
    });
  }
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
