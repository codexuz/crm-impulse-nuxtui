<template>
  <UDashboardPanel id="attendance">
    <template #header>
      <UDashboardNavbar title="Davomat boshqaruvi" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          Barcha guruhlar uchun talabalar davomatini kuzatish va boshqarish
        </template>

        <template #right>
          <!-- Add Attendance Modal -->
          <LeadsAddAttendanceModal
            :teachers="teachers"
            :groups="groups"
            :group-students="groupStudents"
            :status-form-options="statusFormOptions"
            @submit="loadAttendance"
            @load-group-students="loadGroupStudents"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="filters.query"
            icon="i-lucide-search"
            placeholder="Talaba, guruh yoki holat bo'yicha qidirish..."
            class="w-64"
          />
        </template>

        <template #right>
          <USelectMenu
            v-model="filters.teacherId"
            :items="teacherOptions"
            value-key="value"
            placeholder="O'qituvchi"
            class="w-45"
          >
            <template #label>
              {{
                teacherOptions.find((t) => t.value === filters.teacherId)
                  ?.label || "O'qituvchi"
              }}
            </template>
          </USelectMenu>

          <USelectMenu
            v-model="filters.groupId"
            :items="groupOptions"
            value-key="value"
            placeholder="Guruh"
            class="w-45"
          >
            <template #label>
              {{
                groupOptions.find((g) => g.value === filters.groupId)?.label ||
                "Guruh"
              }}
            </template>
          </USelectMenu>

          <USelectMenu
            v-model="filters.status"
            :items="statusOptions"
            value-key="value"
            placeholder="Holat"
            class="w-40"
          >
            <template #label>
              {{
                statusOptions.find((s) => s.value === filters.status)?.label ||
                "Holat"
              }}
            </template>
          </USelectMenu>

          <UInput
            v-model="filters.startDate"
            type="date"
            placeholder="Boshlanish"
            class="w-48"
          />

          <UInput
            v-model="filters.endDate"
            type="date"
            placeholder="Tugash"
            class="w-48"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div>
        <!-- Attendance Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Davomat yozuvlari</h3>
          </template>

          <UTable
            :data="attendanceRecords"
            :columns="columns"
            :loading="pending"
            :empty="'Davomat yozuvlari topilmadi'"
          />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                <span class="font-medium">{{ totalRecords }}</span> ta yozuv
              </div>

              <UPagination
                :model-value="currentPage"
                :total="totalRecords"
                :items-per-page="filters.limit"
                show-last
                show-first
                @update:page="(p: number) => (currentPage = p)"
              />
            </div>
          </template>
        </UCard>
      </div>

      <!-- Edit Attendance Modal -->
      <LeadsEditAttendanceModal
        v-model:open="isEditModalOpen"
        :record="editingRecord"
        :teachers="teachers"
        :groups="groups"
        :group-students="groupStudents"
        :status-form-options="statusFormOptions"
        @updated="loadAttendance"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, h, resolveComponent } from "vue";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

// Resolve components for render functions
const UIcon = resolveComponent("UIcon");
const UAvatar = resolveComponent("UAvatar");
const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UPopover = resolveComponent("UPopover");

// Define types
interface Attendance {
  id: string;
  group_id: string;
  student_id: string;
  teacher_id: string;
  status: "present" | "absent";
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    user_id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  teacher?: {
    user_id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  group?: {
    id: string;
    name: string;
    teacher_id: string;
  };
}

interface Teacher {
  user_id: string;
  first_name: string;
  last_name: string;
}

interface Group {
  id: string;
  name: string;
  teacher_id: string;
}

interface Student {
  user_id: string;
  first_name: string;
  last_name: string;
}

// Composables
const { apiService } = useAuth();
const toast = useToast();
const route = useRoute();
const router = useRouter();

// State
const attendanceRecords = ref<Attendance[]>([]);
const teachers = ref<Teacher[]>([]);
const groups = ref<Group[]>([]);
const students = ref<Student[]>([]);
const groupStudents = ref<Record<string, Student[]>>({});

const pending = ref(false);
const error = ref<string | null>(null);
const totalRecords = ref(0);
const currentPage = ref(1);

// Filters
const filters = ref({
  query: "",
  teacherId: "all",
  groupId: "all",
  status: "all",
  startDate: "",
  endDate: "",
  limit: 10,
});

// Modal states
const isEditModalOpen = ref(false);
const isDeleting = ref(false);
const loadingStudents = ref(false);
const deletePopoverOpen = ref<Record<string, boolean>>({});

// Form data
const editingRecord = ref<Attendance | null>(null);

// Table columns
const columns = [
  {
    accessorKey: "date",
    header: "Sana",
    cell: ({ row }: any) => {
      return h("div", { class: "flex items-center gap-2" }, [
        h(UIcon, {
          name: "i-heroicons-calendar-days",
          class: "w-4 h-4 text-gray-400",
        }),
        h("span", { class: "font-medium" }, formatDate(row.original.date)),
      ]);
    },
  },
  {
    accessorKey: "student",
    header: "Talaba",
    cell: ({ row }: any) => {
      const student = row.original.student;
      return h("div", { class: "flex items-center gap-3" }, [
        h(UAvatar, {
          alt: `${student?.first_name || ""} ${student?.last_name || ""}`,
          size: "sm",
        }),
        h("div", {}, [
          h(
            "p",
            { class: "font-medium" },
            `${student?.first_name || ""} ${student?.last_name || ""}`,
          ),
        ]),
      ]);
    },
  },
  {
    accessorKey: "group",
    header: "Guruh",
    cell: ({ row }: any) => {
      return h(
        UBadge,
        { color: "blue", variant: "subtle" },
        () => row.original.group?.name || "Noma'lum",
      );
    },
  },
  {
    accessorKey: "teacher",
    header: "O'qituvchi",
    cell: ({ row }: any) => {
      const teacher = row.original.teacher;
      return h("div", { class: "flex items-center gap-2" }, [
        h(UAvatar, {
          alt: `${teacher?.first_name || ""} ${teacher?.last_name || ""}`,
          size: "xs",
        }),
        h(
          "span",
          { class: "text-sm" },
          `${teacher?.first_name || ""} ${teacher?.last_name || ""}`,
        ),
      ]);
    },
  },
  {
    accessorKey: "status",
    header: "Holat",
    cell: ({ row }: any) => {
      return h(
        UBadge,
        {
          color: getStatusColor(row.original.status),
          variant: "subtle",
        },
        () => getStatusLabel(row.original.status),
      );
    },
  },
  {
    accessorKey: "note",
    header: "Izoh",
    cell: ({ row }: any) => {
      const note = row.original.note || "—";
      return h(
        "div",
        {
          class: "max-w-xs truncate",
          title: row.original.note || "",
        },
        note,
      );
    },
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }: any) => {
      const recordId = row.original.id;
      return h("div", { class: "flex gap-1" }, [
        h(UButton, {
          icon: "i-heroicons-pencil-square",
          size: "sm",
          color: "primary",
          variant: "ghost",
          onClick: () => openEditModal(row.original),
        }),
        h(
          UPopover,
          {
            open: deletePopoverOpen.value[recordId] || false,
            "onUpdate:open": (value: boolean) => {
              deletePopoverOpen.value[recordId] = value;
            },
          },
          {
            default: () =>
              h(UButton, {
                color: "error",
                variant: "ghost",
                icon: "i-heroicons-trash",
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
                  "Bu davomat yozuvini butunlay o'chiradi. Bu amalni qaytarib bo'lmaydi.",
                ),
                h("div", { class: "flex justify-end gap-2 mt-3" }, [
                  h(UButton, {
                    color: "neutral",
                    variant: "subtle",
                    label: "Bekor qilish",
                    size: "sm",
                    onClick: () => {
                      deletePopoverOpen.value[recordId] = false;
                    },
                  }),
                  h(UButton, {
                    color: "red",
                    label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                    loading: isDeleting.value,
                    size: "sm",
                    onClick: async () => {
                      await deleteRecord(row.original);
                      deletePopoverOpen.value[recordId] = false;
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

// Computed
const teacherOptions = computed(() => {
  return [
    { value: "all", label: "Barcha o'qituvchilar" },
    ...teachers.value.map((t) => ({
      value: t.user_id,
      label: `${t.first_name} ${t.last_name}`,
    })),
  ];
});

const groupOptions = computed(() => {
  const filteredGroups =
    filters.value.teacherId && filters.value.teacherId !== "all"
      ? groups.value.filter((g) => g.teacher_id === filters.value.teacherId)
      : groups.value;

  return [
    { value: "all", label: "Barcha guruhlar" },
    ...filteredGroups.map((g) => ({
      value: g.id,
      label: g.name,
    })),
  ];
});

const statusOptions = [
  { value: "all", label: "Barcha holatlar" },
  { value: "present", label: "Keldi" },
  { value: "absent", label: "Kelmadi" },
];

const statusFormOptions = [
  { value: "present", label: "Keldi" },
  { value: "absent", label: "Kelmadi" },
];

const paginationStart = computed(() => {
  return totalRecords.value === 0
    ? 0
    : (currentPage.value - 1) * filters.value.limit + 1;
});

const paginationEnd = computed(() => {
  return Math.min(currentPage.value * filters.value.limit, totalRecords.value);
});

// Methods
const loadAttendance = async () => {
  pending.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: filters.value.limit.toString(),
    });

    if (filters.value.query) params.append("query", filters.value.query);
    if (filters.value.teacherId !== "all")
      params.append("teacherId", filters.value.teacherId);
    if (filters.value.groupId !== "all")
      params.append("groupId", filters.value.groupId);
    if (filters.value.status !== "all")
      params.append("status", filters.value.status);
    if (filters.value.startDate)
      params.append("startDate", filters.value.startDate);
    if (filters.value.endDate) params.append("endDate", filters.value.endDate);

    const response = await api.get<{
      data: Attendance[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, `/attendance?${params.toString()}`);

    attendanceRecords.value = response.data || [];
    totalRecords.value = response.total || 0;
  } catch (err: any) {
    error.value = err.message || "Ma'lumotlarni yuklashda xatolik";
    toast.add({
      title: "Xatolik",
      description: err.message || "Ma'lumotlarni yuklashda xatolik",
      color: "error",
    });
  } finally {
    pending.value = false;
  }
};

const loadTeachers = async () => {
  try {
    const response = await api.get<{
      data: Teacher[];
    }>(apiService.value, "/users/teachers?page=1&limit=1000");
    teachers.value = response.data || [];
  } catch (err) {
    console.error("Failed to load teachers:", err);
  }
};

const loadGroups = async () => {
  try {
    const response = await api.get<{
      data: Group[];
    }>(apiService.value, "/groups?page=1&limit=1000");
    groups.value = response.data || [];
  } catch (err) {
    console.error("Failed to load groups:", err);
  }
};

const loadGroupStudents = async (groupId: string) => {
  if (groupStudents.value[groupId]) return;

  loadingStudents.value = true;
  try {
    const response = await api.get<any[]>(
      apiService.value,
      `/group-students/group/${groupId}`,
    );

    const studentList = response
      .filter((gs) => gs.student)
      .map((gs) => ({
        user_id: gs.student.user_id,
        first_name: gs.student.first_name,
        last_name: gs.student.last_name,
      }));

    groupStudents.value[groupId] = studentList;
  } catch (err) {
    console.error("Failed to load group students:", err);
    toast.add({
      title: "Xatolik",
      description: "Guruh talabalarini yuklashda xatolik",
      color: "error",
    });
  } finally {
    loadingStudents.value = false;
  }
};

// URL param updates
const updateUrlParams = () => {
  const query: Record<string, string> = {
    page: currentPage.value.toString(),
    limit: filters.value.limit.toString(),
  };

  if (filters.value.query) query.search = filters.value.query;
  if (filters.value.teacherId !== "all")
    query.teacherId = filters.value.teacherId;
  if (filters.value.groupId !== "all") query.groupId = filters.value.groupId;
  if (filters.value.status !== "all") query.status = filters.value.status;
  if (filters.value.startDate) query.startDate = filters.value.startDate;
  if (filters.value.endDate) query.endDate = filters.value.endDate;

  router.push({ query });
};

const applyFilters = () => {
  currentPage.value = 1;
  updateUrlParams();
  loadAttendance();
};

const clearFilters = () => {
  filters.value = {
    query: "",
    teacherId: "all",
    groupId: "all",
    status: "all",
    startDate: "",
    endDate: "",
    limit: 10,
  };
  currentPage.value = 1;
  updateUrlParams();
  loadAttendance();
};

const openEditModal = (record: Attendance) => {
  editingRecord.value = record;
  isEditModalOpen.value = true;
};

const deleteRecord = async (record: Attendance) => {
  isDeleting.value = true;
  try {
    await api.delete(apiService.value, `/attendance/${record.id}`);

    toast.add({
      title: "Muvaffaqiyat",
      description: "Davomat yozuvi o'chirildi",
      color: "success",
    });

    await loadAttendance();
  } catch (err: any) {
    toast.add({
      title: "Xatolik",
      description: err.message || "O'chirishda xatolik",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
};

// Helper functions
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    present: "green",
    absent: "red",
  };
  return colors[status] || "gray";
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    present: "Keldi",
    absent: "Kelmadi",
  };
  return labels[status] || status;
};

// Watchers
watch(currentPage, () => {
  updateUrlParams();
  loadAttendance();
});

watch(
  () => filters.value.limit,
  () => {
    currentPage.value = 1;
    updateUrlParams();
    loadAttendance();
  },
);

watch(
  [
    () => filters.value.query,
    () => filters.value.teacherId,
    () => filters.value.groupId,
    () => filters.value.status,
    () => filters.value.startDate,
    () => filters.value.endDate,
  ],
  () => {
    currentPage.value = 1;
    updateUrlParams();
    loadAttendance();
  },
);

// Initialize
onMounted(async () => {
  // Read URL params
  if (route.query.page) {
    currentPage.value = parseInt(route.query.page as string) || 1;
  }
  if (route.query.limit) {
    filters.value.limit = parseInt(route.query.limit as string) || 10;
  }
  if (route.query.search) {
    filters.value.query = route.query.search as string;
  }
  if (route.query.teacherId) {
    filters.value.teacherId = route.query.teacherId as string;
  }
  if (route.query.groupId) {
    filters.value.groupId = route.query.groupId as string;
  }
  if (route.query.status) {
    filters.value.status = route.query.status as string;
  }
  if (route.query.startDate) {
    filters.value.startDate = route.query.startDate as string;
  }
  if (route.query.endDate) {
    filters.value.endDate = route.query.endDate as string;
  }

  await Promise.all([loadTeachers(), loadGroups()]);
  await loadAttendance();
});
</script>
