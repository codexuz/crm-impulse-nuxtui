<template>
  <UDashboardPanel id="students">
    <template #header>
      <UDashboardNavbar title="Talabalar" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          Talaba hisoblarini va ro'yxatdan o'tishni boshqarish
        </template>

        <template #right>
          <StudentsAddStudentModal @submit="addStudent" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Talabalarni qidirish..."
            class="w-64"
          />
        </template>

        <template #right>
          <USelectMenu
            v-model="limit"
            :items="[5, 10, 20, 30, 50]"
            class="w-24"
          >
            <template #label> {{ limit }} ta </template>
          </USelectMenu>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="">
        <!-- Students Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Talabalar ro'yxati</h3>
          </template>

          <UTable
            ref="table"
            v-model:sort="sort"
            :data="students"
            :columns="columns"
            :loading="isLoading"
            :empty="'Talabalar topilmadi'"
          />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                <span class="font-medium">{{ totalItems }}</span> talaba
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
      <!-- View Student Modal -->
      <StudentsViewStudentModal
        v-model:open="viewDialog"
        :student="selectedStudent"
        :student-groups="studentGroups"
        @edit="editStudent"
      />

      <!-- Edit Student Modal -->
      <StudentsEditStudentModal
        v-model:open="editDialog"
        :student="editingStudent"
        @updated="loadStudents"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Student, GroupStudent } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const UAvatar = resolveComponent("UAvatar");
const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UPopover = resolveComponent("UPopover");

const { apiService } = useAuth();
const toast = useToast();
const table = useTemplateRef("table");

// Students data
const students = ref<Student[]>([]);
const courses = ref<any[]>([]);
const isLoading = ref(true);
const page = ref(1);
const limit = ref(10);
const totalItems = ref(0);
const totalPages = ref(1);
const showPassword = ref(false);
const sort = ref({ column: "first_name", direction: "asc" as const });

// Filters and search
const search = ref("");

// Dialogs
const addStudentDialog = ref(false);
const viewDialog = ref(false);
const editDialog = ref(false);
const confirmDialog = ref(false);

// Debug viewDialog changes
watch(viewDialog, (newVal) => {
  console.log("viewDialog changed to:", newVal);
});

// Selected student data
const selectedStudent = ref<Student | null>(null);
const isUpdating = ref(false);
const isDeleting = ref(false);
const editingStudent = ref<Student | null>(null);
const studentToDelete = ref<Student | null>(null);
const studentGroups = ref<any[]>([]);
const deletePopoverOpen = ref<Record<string, boolean>>({});

// New student form
const newStudent = reactive({
  first_name: "",
  last_name: "",
  username: "",
  phone: "",
  password: "",
  level_id: "none",
});

// Table columns with render functions
const columns: TableColumn<Student>[] = [
  {
    accessorKey: "first_name",
    header: "Ism",
    cell: ({ row }) => {
      return h("div", { class: "flex items-center gap-3" }, [
        h(
          UAvatar,
          {
            src: row.original.avatar_url,
            alt: `${row.original.first_name} ${row.original.last_name}`,
            size: "sm",
          },
          row.original.avatar_url
            ? undefined
            : {
                fallback: () =>
                  getInitials(row.original.first_name, row.original.last_name),
              },
        ),
        h(
          "span",
          { class: "font-medium" },
          `${row.original.first_name} ${row.original.last_name}`,
        ),
      ]);
    },
  },
  {
    accessorKey: "username",
    header: "Username",
    cell: ({ row }) => `@${row.original.username}`,
  },
  {
    accessorKey: "phone",
    header: "Telefon",
  },
  {
    accessorKey: "level.title",
    header: "Kurs",
    cell: ({ row }) => {
      return (row.original as any).level
        ? h(
            UBadge,
            { variant: "subtle" },
            () => (row.original as any).level.title,
          )
        : h("span", { class: "text-gray-400 text-sm" }, "Yo'q");
    },
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      const studentId = row.original.user_id;
      return h("div", { class: "flex items-center gap-1" }, [
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-eye",
          size: "sm",
          square: true,
          onClick: () => {
            console.log("View clicked for:", row.original);
            viewStudent(row.original);
          },
        }),
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-pencil",
          size: "sm",
          square: true,
          onClick: () => editStudent(row.original),
        }),
        h(
          UPopover,
          {
            open: deletePopoverOpen.value[studentId] || false,
            "onUpdate:open": (value: boolean) => {
              deletePopoverOpen.value[studentId] = value;
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
                  "Bu talabaning hisobini butunlay o'chiradi va \nbarcha bog'langan ma'lumotlarni olib tashlaydi.",
                ),
                h("div", { class: "flex justify-end gap-2 mt-3" }, [
                  h(UButton, {
                    color: "neutral",
                    variant: "subtle",
                    label: "Bekor qilish",
                    size: "sm",
                    onClick: () => {
                      deletePopoverOpen.value[studentId] = false;
                    },
                  }),
                  h(UButton, {
                    color: "red",
                    label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                    loading: isDeleting.value,
                    size: "sm",
                    onClick: async () => {
                      await confirmDelete(row.original);
                      deletePopoverOpen.value[studentId] = false;
                    },
                  }),
                ]),
              ]),
          },
        ),
        h(
          UDropdownMenu,
          {
            items: [
              [
                {
                  label: row.original.is_active
                    ? "Faolsizlantirish"
                    : "Faollashtirish",
                  icon: row.original.is_active
                    ? "i-lucide-user-x"
                    : "i-lucide-user-check",
                  onSelect: () => toggleStudentStatus(row.original),
                },
              ],
            ],
          },
          () =>
            h(UButton, {
              color: "neutral",
              variant: "ghost",
              icon: "i-lucide-more-vertical",
              size: "sm",
            }),
        ),
      ]);
    },
  },
];

const paginationStart = computed(() => {
  return totalItems.value === 0 ? 0 : (page.value - 1) * limit.value + 1;
});

const paginationEnd = computed(() => {
  return Math.min(page.value * limit.value, totalItems.value);
});

// Methods
const loadStudents = async () => {
  isLoading.value = true;
  try {
    // Build query parameters
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: limit.value.toString(),
    });

    if (search.value) {
      params.append("query", search.value);
    }

    const url = `/users/students?${params.toString()}`;
    console.log("Loading students from:", url);
    console.log("Query params:", {
      page: page.value,
      limit: limit.value,
      query: search.value,
    });

    const response = await api.get<{
      data: Student[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, url);

    console.log("Loaded students:", response);

    students.value = response.data;
    totalItems.value = response.total;
    totalPages.value = response.totalPages;

    console.log("Total students:", totalItems.value);
    console.log("Students array:", students.value);
  } catch (error) {
    console.error("Failed to load students:", error);
    toast.add({
      title: "Xatolik",
      description:
        "Talabalarni yuklashda xatolik. Iltimos, qayta urinib ko'ring.",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const addStudent = async (studentData: any) => {
  isLoading.value = true;
  try {
    const data: any = { ...studentData };

    if (data.level_id === "none") {
      data.level_id = "";
    }

    const response = await api.post<Student>(
      apiService.value,
      "/auth/register",
      data,
    );

    // Reload students from server
    await loadStudents();

    toast.add({
      title: "Muvaffaqiyat",
      description: "Talaba muvaffaqiyatli yaratildi",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to create student:", error);
    toast.add({
      title: "Xatolik",
      description: "Talaba yaratishda xatolik. Iltimos, qayta urinib ko'ring.",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const viewStudent = async (student: Student) => {
  console.log("viewStudent called with:", student);
  selectedStudent.value = student;
  viewDialog.value = true;
  console.log("viewDialog set to:", viewDialog.value);

  try {
    const response = await api.get<GroupStudent[]>(
      apiService.value,
      `/group-students/student/${student.user_id}`,
    );
    studentGroups.value = response;
  } catch (error) {
    console.error("Failed to load student groups:", error);
    studentGroups.value = [];
  }
};

const editStudent = (student: Student | null) => {
  if (!student) return;

  viewDialog.value = false;
  editingStudent.value = student;
  editDialog.value = true;
};

const toggleStudentStatus = async (student: Student) => {
  try {
    const endpoint = student.is_active
      ? `/users/${student.user_id}/deactivate`
      : `/users/${student.user_id}/activate`;

    await api.patch<Student>(apiService.value, endpoint, {});

    const index = students.value.findIndex(
      (s) => s.user_id === student.user_id,
    );
    if (index !== -1) {
      students.value[index] = {
        ...students.value[index],
        is_active: !student.is_active,
      } as Student;
    }

    toast.add({
      title: "Muvaffaqiyat",
      description: `Talaba muvaffaqiyatli ${
        student.is_active ? "faolsizlantirildi" : "faollashtirildi"
      }`,
      color: "success",
    });
  } catch (error) {
    console.error("Failed to toggle student status:", error);
    toast.add({
      title: "Xatolik",
      description:
        "Talaba holatini yangilashda xatolik. Iltimos, qayta urinib ko'ring.",
      color: "error",
    });
  }
};


const deleteStudent = (student: Student) => {
  studentToDelete.value = student;
  confirmDialog.value = true;
};

const confirmDelete = async (student: Student) => {
  isDeleting.value = true;
  try {
    await api.delete<void>(apiService.value, `/users/${student.user_id}`);

    // Reload students from server
    await loadStudents();

    toast.add({
      title: "Muvaffaqiyat",
      description: "Talaba muvaffaqiyatli o'chirildi",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to delete student:", error);
    toast.add({
      title: "Xatolik",
      description:
        "Talabani o'chirishda xatolik. Iltimos, qayta urinib ko'ring.",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
};

// Helper functions
const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "Mavjud emas";
  return new Date(dateString).toLocaleDateString();
};

const loadCourses = async () => {
  try {
    const response = await api.get<{ data: any[] }>(apiService.value, "/courses");
    courses.value = response.data || [];
  } catch (error) {
    console.error("Failed to load courses:", error);
   toast.add({
      title: "Xatolik",
      description: "Kurslarni yuklashda xatolik yuz berdi",
      color: "error",
    });
  }
};

const getStudentCourse = (student: Student | null) => {
  if (!student) return null;
  // Server now returns level object directly
  return (student as any).level || null;
};

onMounted(() => {
  const route = useRoute();
  if (route.query.page) {
    page.value = parseInt(route.query.page as string) || 1;
  }
  if (route.query.limit) {
    limit.value = parseInt(route.query.limit as string) || 10;
  }
  if (route.query.search) {
    search.value = route.query.search as string;
  }

  loadStudents();
  loadCourses();
});

const route = useRoute();
const router = useRouter();

const updateUrlParams = () => {
  const query: Record<string, string> = {
    page: page.value.toString(),
    limit: limit.value.toString(),
  };

  if (search.value) {
    query.query = search.value;
  }

  router.push({ query });
};

// Debounce search to avoid too many API calls
let searchTimeout: NodeJS.Timeout | null = null;
watch(search, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    page.value = 1;
    loadStudents();
  }, 300);
});

// Reload when page or limit changes
watch(page, () => {
  loadStudents();
  updateUrlParams();
});

watch(limit, () => {
  page.value = 1;
  loadStudents();
  updateUrlParams();
});
</script>
