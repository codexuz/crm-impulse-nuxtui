<template>
  <UDashboardPanel id="compensated-lessons">
    <template #header>
      <UDashboardNavbar title="Qoplangan darslar" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          Talabalarning qoplangan darslarini kuzatish va boshqarish
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #right>
          <UInput
            v-model="filters.start_date"
            type="date"
            placeholder="Boshlanish sanasi"
            class="w-48"
          />

          <UInput
            v-model="filters.end_date"
            type="date"
            placeholder="Tugash sanasi"
            class="w-48"
          />
          <USelectMenu
            v-model="filters.teacherId"
            :items="teacherOptions"
            value-key="value"
            placeholder="O'qituvchi"
            class="w-48"
          >
            <template #label>
              {{
                teacherOptions.find((t) => t.value === filters.teacherId)
                  ?.label || "O'qituvchi"
              }}
            </template>
          </USelectMenu>

          <USelectMenu
            v-model="filters.compensated"
            :items="compensatedOptions"
            value-key="value"
            placeholder="Holat"
            class="w-40"
          >
            <template #label>
              {{
                compensatedOptions.find((c) => c.value === filters.compensated)
                  ?.label || "Holat"
              }}
            </template>
          </USelectMenu>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div>
        <!-- Compensated Lessons Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Qoplangan darslar ro'yxati</h3>
          </template>

          <UTable
            :data="compensatedLessons"
            :columns="columns"
            :loading="pending"
            :empty="'Qoplangan darslar topilmadi'"
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

      <!-- Edit Compensated Lesson Modal -->
      <UModal v-model:open="isEditModalOpen">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Qoplangan darsni tahrirlash</h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              square
              @click="isEditModalOpen = false"
            />
          </div>
        </template>
        <template #body>
          <div v-if="editingRecord" class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">Holat</label>
              <USelectMenu
                v-model="editForm.compensated"
                :items="[
                  { value: true, label: 'Qoplangan' },
                  { value: false, label: 'Qoplanmagan' },
                ]"
                value-key="value"
                option-attribute="label"
                placeholder="Holatni tanlang"
              />
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block"
                >Amal qilish muddati</label
              >
              <UInput v-model="editForm.valid_until" type="date" />
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block"
                >Kim tomonidan qoplandi</label
              >
              <USelectMenu
                v-model="editForm.compensated_by"
                :items="[
                  { value: 'main_teacher', label: 'Asosiy o\'qituvchi' },
                  { value: 'support_teacher', label: 'Yordamchi o\'qituvchi' },
                ]"
                value-key="value"
                option-attribute="label"
                placeholder="Tanlang"
              />
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="outline"
              @click="isEditModalOpen = false"
            >
              Bekor qilish
            </UButton>
            <UButton color="primary" :loading="isSaving" @click="saveEdit">
              Saqlash
            </UButton>
          </div>
        </template>
      </UModal>
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
interface CompensatedLesson {
  id: string;
  teacher_id: string;
  student_id: string;
  attendance_id: string;
  compensated: boolean;
  compensated_by: string | null;
  valid_until: string;
  created_at: string;
  teacher?: {
    user_id: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  student?: {
    user_id: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  attendance?: {
    id: string;
    group_id: string;
    student_id: string;
    teacher_id: string;
    branch_id: string | null;
    status: string;
    note: string;
    date: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface Teacher {
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
const compensatedLessons = ref<CompensatedLesson[]>([]);
const teachers = ref<Teacher[]>([]);

const pending = ref(false);
const error = ref<string | null>(null);
const totalRecords = ref(0);
const currentPage = ref(1);

// Filters
const filters = ref({
  teacherId: "all",
  compensated: "all",
  start_date: "",
  end_date: "",
  limit: 10,
});

// Modal states
const isEditModalOpen = ref(false);
const isDeleting = ref(false);
const isSaving = ref(false);
const deletePopoverOpen = ref<Record<string, boolean>>({});

// Edit form
const editingRecord = ref<CompensatedLesson | null>(null);
const editForm = ref({
  compensated: false,
  compensated_by: "",
  valid_until: "",
});

// Table columns
const columns = [
  {
    accessorKey: "teacher",
    header: "O'qituvchi",
    cell: ({ row }: any) => {
      const teacher = row.original.teacher;
      return h("div", { class: "flex items-center gap-3" }, [
        h(UAvatar, {
          alt: `${teacher?.first_name || ""} ${teacher?.last_name || ""}`,
          size: "sm",
        }),
        h("div", {}, [
          h(
            "p",
            { class: "font-medium" },
            `${teacher?.first_name || ""} ${teacher?.last_name || ""}`,
          ),
          h("p", { class: "text-xs text-gray-500" }, teacher?.phone || ""),
        ]),
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
          h("p", { class: "text-xs text-gray-500" }, student?.phone || ""),
        ]),
      ]);
    },
  },
  {
    accessorKey: "attendance",
    header: "Dars sanasi",
    cell: ({ row }: any) => {
      const attendance = row.original.attendance;
      return h("div", { class: "flex items-center gap-2" }, [
        h(UIcon, {
          name: "i-heroicons-calendar-days",
          class: "w-4 h-4 text-gray-400",
        }),
        h("div", {}, [
          h(
            "p",
            { class: "font-medium" },
            attendance?.date ? formatDate(attendance.date) : "Noma'lum",
          ),
          h("p", { class: "text-xs text-gray-500" }, attendance?.note || ""),
        ]),
      ]);
    },
  },
  {
    accessorKey: "compensated",
    header: "Holat",
    cell: ({ row }: any) => {
      return h(
        UBadge,
        {
          color: row.original.compensated ? "green" : "yellow",
          variant: "subtle",
        },
        () => (row.original.compensated ? "Qoplangan" : "Qoplanmagan"),
      );
    },
  },
  {
    accessorKey: "valid_until",
    header: "Amal qilish muddati",
    cell: ({ row }: any) => {
      return h(
        "div",
        { class: "flex items-center gap-2" },
        row.original.valid_until
          ? [
              h(UIcon, {
                name: "i-heroicons-calendar-days",
                class: "w-4 h-4 text-gray-400",
              }),
              h("span", {}, formatDate(row.original.valid_until)),
            ]
          : "—",
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Yaratilgan",
    cell: ({ row }: any) => {
      return h(
        "div",
        { class: "text-sm text-gray-500" },
        formatDate(row.original.created_at),
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
                  "Bu qoplangan dars yozuvini butunlay o'chiradi. Bu amalni qaytarib bo'lmaydi.",
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

const compensatedOptions = [
  { value: "all", label: "Barcha holatlar" },
  { value: "true", label: "Qoplangan" },
  { value: "false", label: "Qoplanmagan" },
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
const loadCompensatedLessons = async () => {
  pending.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: filters.value.limit.toString(),
    });

    if (filters.value.teacherId !== "all")
      params.append("teacher_id", filters.value.teacherId);
    if (filters.value.compensated !== "all")
      params.append("compensated", filters.value.compensated);
    if (filters.value.start_date)
      params.append("start_date", filters.value.start_date);
    if (filters.value.end_date)
      params.append("end_date", filters.value.end_date);

    const response = await api.get<{
      data: CompensatedLesson[];
      total: number;
      currentPage: number;
      totalPages: number;
    }>(
      apiService.value,
      `/compensate-lessons/all-teachers?${params.toString()}`,
    );

    compensatedLessons.value = response.data || [];
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

// URL param updates
const updateUrlParams = () => {
  const query: Record<string, string> = {
    page: currentPage.value.toString(),
    limit: filters.value.limit.toString(),
  };

  if (filters.value.teacherId !== "all")
    query.teacherId = filters.value.teacherId;
  if (filters.value.compensated !== "all")
    query.compensated = filters.value.compensated;
  if (filters.value.start_date) query.start_date = filters.value.start_date;
  if (filters.value.end_date) query.end_date = filters.value.end_date;

  router.push({ query });
};

// Helper functions
const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const openEditModal = (record: CompensatedLesson) => {
  editingRecord.value = record;
  editForm.value = {
    compensated: record.compensated,
    compensated_by: record.compensated_by || "",
    valid_until: record.valid_until || "",
  };
  isEditModalOpen.value = true;
};

const saveEdit = async () => {
  if (!editingRecord.value) return;

  isSaving.value = true;
  try {
    await api.patch(
      apiService.value,
      `/compensate-lessons/${editingRecord.value.id}`,
      {
        teacher_id: editingRecord.value.teacher_id,
        student_id: editingRecord.value.student_id,
        attendance_id: editingRecord.value.attendance_id,
        compensated: editForm.value.compensated,
        compensated_by: editForm.value.compensated_by || null,
        valid_until: editForm.value.valid_until,
      },
    );

    toast.add({
      title: "Muvaffaqiyat",
      description: "Qoplangan dars tahrirlandi",
      color: "success",
    });

    isEditModalOpen.value = false;
    await loadCompensatedLessons();
  } catch (err: any) {
    toast.add({
      title: "Xatolik",
      description: err.message || "Tahrirlashda xatolik",
      color: "error",
    });
  } finally {
    isSaving.value = false;
  }
};

const deleteRecord = async (record: CompensatedLesson) => {
  isDeleting.value = true;
  try {
    await api.delete(apiService.value, `/compensate-lessons/${record.id}`);

    toast.add({
      title: "Muvaffaqiyat",
      description: "Qoplangan dars o'chirildi",
      color: "success",
    });

    await loadCompensatedLessons();
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

// Watchers
watch(currentPage, () => {
  updateUrlParams();
  loadCompensatedLessons();
});

watch(
  () => filters.value.limit,
  () => {
    currentPage.value = 1;
    updateUrlParams();
    loadCompensatedLessons();
  },
);

watch(
  [
    () => filters.value.teacherId,
    () => filters.value.compensated,
    () => filters.value.start_date,
    () => filters.value.end_date,
  ],
  () => {
    currentPage.value = 1;
    updateUrlParams();
    loadCompensatedLessons();
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
  if (route.query.teacherId) {
    filters.value.teacherId = route.query.teacherId as string;
  }
  if (route.query.compensated) {
    filters.value.compensated = route.query.compensated as string;
  }
  if (route.query.start_date) {
    filters.value.start_date = route.query.start_date as string;
  }
  if (route.query.end_date) {
    filters.value.end_date = route.query.end_date as string;
  }

  await loadTeachers();
  await loadCompensatedLessons();
});

definePageMeta({
  middleware: ["auth"],
});
</script>
