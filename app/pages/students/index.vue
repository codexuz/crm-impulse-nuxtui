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
                @update:page="(p: number) => page = p"
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
import type { Student, GroupStudent } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const UAvatar = resolveComponent("UAvatar");
const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");

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

// Selected student data
const selectedStudent = ref<Student | null>(null);
const isUpdating = ref(false);
const isDeleting = ref(false);
const editingStudent = ref<Partial<Student> | null>(null);
const studentToDelete = ref<Student | null>(null);
const studentGroups = ref<any[]>([]);

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
              }
        ),
        h(
          "span",
          { class: "font-medium" },
          `${row.original.first_name} ${row.original.last_name}`
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
            () => (row.original as any).level.title
          )
        : h("span", { class: "text-gray-400 text-sm" }, "Yo'q");
    },
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      return h(
        UDropdownMenu,
        {
          items: [
            [
              {
                label: "Ko'rish",
                icon: "i-lucide-eye",
                click: () => viewStudent(row.original),
              },
              {
                label: "Tahrirlash",
                icon: "i-lucide-pencil",
                click: () => editStudent(row.original),
              },
            ],
            [
              {
                label: row.original.is_active
                  ? "Faolsizlantirish"
                  : "Faollashtirish",
                icon: row.original.is_active
                  ? "i-lucide-user-x"
                  : "i-lucide-user-check",
                click: () => toggleStudentStatus(row.original),
              },
              {
                label: "Guruhlarni ko'rish",
                icon: "i-lucide-users-2",
                click: () => viewStudentGroups(row.original),
              },
            ],
            [
              {
                label: "O'chirish",
                icon: "i-lucide-trash-2",
                click: () => deleteStudent(row.original),
                class: "text-red-600 dark:text-red-400",
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
          })
      );
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
      data
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
  selectedStudent.value = student;
  viewDialog.value = true;

  try {
    const response = await api.get<GroupStudent[]>(
      apiService.value,
      `/group-students/student/${student.user_id}`
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
  editingStudent.value = { ...student };

  if (!(editingStudent.value as any).level_id) {
    (editingStudent.value as any).level_id = "none";
  }

  editDialog.value = true;
};

const updateStudent = async () => {
  if (!editingStudent.value || !editingStudent.value.user_id) return;

  isUpdating.value = true;
  try {
    const studentData: any = { ...editingStudent.value };

    if (studentData.level_id === "none") {
      studentData.level_id = "";
    }

    const response = await api.patch<Student>(
      apiService.value,
      `/users/${editingStudent.value.user_id}`,
      studentData
    );

    const index = students.value.findIndex(
      (s) => s.user_id === response.user_id
    );
    if (index !== -1) {
      students.value[index] = {
        ...response,
      };
    }

    toast.add({
      title: "Muvaffaqiyat",
      description: "Talaba muvaffaqiyatli yangilandi",
      color: "success",
    });

    editDialog.value = false;
  } catch (error) {
    console.error("Failed to update student:", error);
    toast.add({
      title: "Xatolik",
      description:
        "Talabani yangilashda xatolik. Iltimos, qayta urinib ko'ring.",
      color: "error",
    });
  } finally {
    isUpdating.value = false;
  }
};

const toggleStudentStatus = async (student: Student) => {
  try {
    const endpoint = student.is_active
      ? `/users/${student.user_id}/deactivate`
      : `/users/${student.user_id}/activate`;

    await api.patch<Student>(apiService.value, endpoint, {});

    const index = students.value.findIndex(
      (s) => s.user_id === student.user_id
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

const viewStudentGroups = (student: Student) => {
  navigateTo(`/groups/student/${student.user_id}`);
};

const deleteStudent = (student: Student) => {
  studentToDelete.value = student;
  confirmDialog.value = true;
};

const confirmDelete = async () => {
  if (!studentToDelete.value) return;

  isDeleting.value = true;
  try {
    await api.delete<void>(
      apiService.value,
      `/users/${studentToDelete.value.user_id}`
    );

    // Reload students from server
    await loadStudents();

    toast.add({
      title: "Muvaffaqiyat",
      description: "Talaba muvaffaqiyatli o'chirildi",
      color: "success",
    });

    confirmDialog.value = false;
    studentToDelete.value = null;
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
    const response = await api.get<any[]>(apiService.value, "/courses");
    courses.value = response || [];
  } catch (error) {
    console.error("Failed to load courses:", error);
    toast.add({
      title: "Xatolik",
      description:
        "Kurslarni yuklashda xatolik. Iltimos, qayta urinib ko'ring.",
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
