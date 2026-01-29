<template>
  <UDashboardPanel id="archived-students">
    <template #header>
      <UDashboardNavbar title="Arxiv talabalar" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          Arxivlangan talaba hisoblarini boshqarish
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
            <h3 class="text-base font-semibold">
              Arxivlangan talabalar ro'yxati
            </h3>
          </template>

          <UTable
            :data="students"
            :columns="columns"
            :loading="isLoading"
            :empty="'Arxivlangan talabalar topilmadi'"
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

      
  <!-- View Student Modal -->

  <UModal v-model:open="viewDialog" :ui="{ width: 'sm:max-w-3xl' }">
      <template #header>
        <h3 class="text-base font-semibold">Talaba ma'lumotlari</h3>
      </template>
      
      <template #body>
      <div v-if="selectedStudent" class="space-y-4">
        <div class="flex items-center gap-4">
          <UAvatar
            :alt="`${selectedStudent.first_name} ${selectedStudent.last_name}`"
            size="xl"
          >
            {{
              getInitials(selectedStudent.first_name, selectedStudent.last_name)
            }}
          </UAvatar>
          <div class="flex-1">
            <h3 class="text-lg font-semibold">
              {{ selectedStudent.first_name }} {{ selectedStudent.last_name }}
            </h3>
            <p class="text-gray-500">{{ selectedStudent.username }}</p>
          </div>
          <UBadge :color="selectedStudent.is_active ? 'green' : 'gray'">
            {{ selectedStudent.is_active ? "Faol" : "Nofaol" }}
          </UBadge>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium text-sm mb-2">Aloqa ma'lumotlari</h4>
            <div class="space-y-2 text-sm">
              <div class="flex">
                <span class="text-gray-500 w-20">Telefon:</span>
                <span>{{ selectedStudent.phone }}</span>
              </div>
              <div class="flex">
                <span class="text-gray-500 w-20">Email:</span>
                <span>{{ selectedStudent.email || "Berilmagan" }}</span>
              </div>
              <div class="flex">
                <span class="text-gray-500 w-20">Kurs:</span>
                <UBadge
                  v-if="getStudentCourse(selectedStudent)"
                  variant="subtle"
                >
                  {{ getStudentCourse(selectedStudent)?.title }}
                </UBadge>
                <span v-else>Yo'q</span>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-2">Tizim ma'lumotlari</h4>
            <div class="space-y-2 text-sm">
              <div class="flex">
                <span class="text-gray-500 w-20">ID:</span>
                <span class="text-xs font-mono">{{
                  selectedStudent.user_id
                }}</span>
              </div>
              <div class="flex">
                <span class="text-gray-500 w-20">Rollar:</span>
                <div class="flex gap-1 flex-wrap">
                  <UBadge
                    v-for="role in selectedStudent.roles"
                    :key="typeof role === 'string' ? role : role.id"
                    size="xs"
                    variant="subtle"
                  >
                    {{ typeof role === "string" ? role : role.name }}
                  </UBadge>
                </div>
              </div>
              <div class="flex">
                <span class="text-gray-500 w-20">Yaratilgan:</span>
                <span>{{ formatDate(selectedStudent?.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 class="font-medium text-sm mb-2">Profil statistikasi</h4>
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div class="text-sm text-gray-500">Ballar</div>
              <div class="text-2xl font-semibold">
                {{ selectedStudent.student_profile?.points || 0 }}
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div class="text-sm text-gray-500">Tangalar</div>
              <div class="text-2xl font-semibold">
                {{ selectedStudent.student_profile?.coins || 0 }}
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div class="text-sm text-gray-500">Izchillik</div>
              <div class="text-2xl font-semibold">
                {{ selectedStudent.student_profile?.streaks || 0 }} kun
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 class="font-medium text-sm mb-2">Yozilgan guruhlar</h4>
          <div class="space-y-2">
            <div
              v-if="studentGroups.length === 0"
              class="text-sm text-gray-500"
            >
              Hech qanday guruhga yozilmagan
            </div>
            <div
              v-for="group in studentGroups"
              :key="group.id"
              class="flex justify-between items-center p-2 rounded-md bg-gray-50 dark:bg-gray-800"
            >
              <div>
                <div class="font-medium">{{ group.name }}</div>
                <div class="text-xs text-gray-500">
                  Yozilgan: {{ formatDate(group.enrolled_at) }}
                </div>
              </div>
              <UBadge>{{ group.status }}</UBadge>
            </div>
          </div>
        </div>
      </div>
     </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="outline"
            label="Yopish"
            @click="viewDialog = false"
          />
        </div>
      </template>
  </UModal>


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

definePageMeta({
  middleware: ["auth"],
});

const { apiService } = useAuth();
const toast = useToast();
const router = useRouter();
const route = useRoute();

// Students data
const students = ref<Student[]>([]);
const courses = ref<any[]>([]);
const isLoading = ref(true);
const page = ref(1);
const limit = ref(10);
const totalItems = ref(0);
const totalPages = ref(1);
const showPassword = ref(false);

// Filters and search
const search = ref("");
const filters = reactive({
  active: true,
  inactive: true,
});

// Selected student data
const selectedStudent = ref<Student | null>(null);
const viewDialog = ref(false);
const editDialog = ref(false);
const confirmDialog = ref(false);
const isUpdating = ref(false);
const isDeleting = ref(false);
const editingStudent = ref<Partial<Student> | null>(null);
const studentToDelete = ref<Student | null>(null);
const studentGroups = ref<any[]>([]);
const deletePopoverOpen = ref<Record<string, boolean>>({});

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
            alt: `${row.original.first_name} ${row.original.last_name}`,
            size: "sm",
          },
          () => getInitials(row.original.first_name, row.original.last_name)
        ),
        h("div", {}, [
          h(
            "div",
            { class: "font-medium" },
            `${row.original.first_name} ${row.original.last_name}`
          ),
          h("div", { class: "text-xs text-gray-500" }, row.original.username),
        ]),
      ]);
    },
  },
  {
    accessorKey: "phone",
    header: "Telefon",
  },
  {
    accessorKey: "level_id",
    header: "Kurs",
    cell: ({ row }) => {
      const course = getStudentCourse(row.original);
      if (course) {
        return h(UBadge, { variant: "subtle" }, () => course.title);
      }
      return h("span", { class: "text-gray-500 text-sm" }, "Yo'q");
    },
  },
  {
    accessorKey: "is_active",
    header: "Holat",
    cell: ({ row }) => {
      return h(
        UBadge,
        {
          color: row.original.is_active ? "green" : "gray",
        },
        () => (row.original.is_active ? "Faol" : "Nofaol")
      );
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
          onClick: () => viewStudent(row.original),
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
                  "Ishonchingiz komilmi?"
                ),
                h(
                  "p",
                  { class: "text-sm text-gray-600" },
                  "Bu talabaning hisobini butunlay o'chiradi va \nbarcha bog'langan ma'lumotlarni olib tashlaydi."
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
                      await deleteStudent(row.original);
                      deletePopoverOpen.value[studentId] = false;
                    },
                  }),
                ]),
              ]),
          }
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
            })
        ),
      ]);
    },
  },
];

// New student form
const newStudent = reactive({
  first_name: "",
  last_name: "",
  username: "",
  phone: "",
  password: "",
  level_id: "none",
});

// Computed
const paginationStart = computed(() => {
  return totalItems.value === 0 ? 0 : (page.value - 1) * limit.value + 1;
});

const paginationEnd = computed(() => {
  return Math.min(page.value * limit.value, totalItems.value);
});

// Helper functions
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

const getStudentCourse = (student: Student) => {
  if (!student.level_id) return null;
  return courses.value.find((course) => course.id === student.level_id) || null;
};

// Methods
const loadStudents = async () => {
  isLoading.value = true;
  try {
    // Build query parameters for API
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: limit.value.toString(),
    });

    // Add search query if present
    if (search.value) {
      params.append("query", search.value);
    }

    const response = await api.get<{
      data: Student[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, `/users/students/archived?${params.toString()}`);

    students.value = response.data || [];
    totalItems.value = response.total || 0;
    totalPages.value = response.totalPages || 1;
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

const addStudent = async () => {
  isLoading.value = true;
  try {
    // Create a copy of newStudent to prepare for submission
    const studentData = { ...newStudent };

    // Set level_id to empty string if it's 'none'
    if (studentData.level_id === "none") {
      studentData.level_id = "";
    }

    // In a real app this would use a specific endpoint to create a student
    const response = await api.post<Student>(
      apiService.value,
      "/auth/register",
      studentData
    );

    students.value.push({
      ...response,
      is_active: true,
    });

    totalItems.value = students.value.length;
    toast.add({
      title: "Muvaffaqiyat",
      description: "Talaba muvaffaqiyatli yaratildi",
      color: "success",
    });

    // Reset form
    Object.keys(newStudent).forEach((key) => {
      newStudent[key as keyof typeof newStudent] = "";
    });
    // Set level_id specifically to none after reset
    newStudent.level_id = "none";
  } catch (error) {
    console.error("Failed to create student:", error);
    toast.add({
      title: "Xatolik",
      description:
        "Talabani yaratishda xatolik. Iltimos, qayta urinib ko'ring.",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const viewStudent = async (student: Student) => {
  selectedStudent.value = student;
  viewDialog.value = true;

  // Load student groups
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

  // Close view dialog if open
  viewDialog.value = false;

  // Clone student data for editing
  editingStudent.value = { ...student };

  // Set level_id to "none" if it's empty or null
  if (!editingStudent.value.level_id) {
    editingStudent.value.level_id = "none";
  }

  editDialog.value = true;
};

const updateStudent = async () => {
  if (!editingStudent.value || !editingStudent.value.user_id) return;

  isUpdating.value = true;
  try {
    // Create a copy of editingStudent to prepare for submission
    const studentData = { ...editingStudent.value };

    // Set level_id to empty string if it's 'none'
    if (studentData.level_id === "none") {
      studentData.level_id = "";
    }

    const response = await api.patch<Student>(
      apiService.value,
      `/users/${editingStudent.value.user_id}`,
      studentData
    );

    // Reload students list to get fresh data
    await loadStudents();

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

    // Reload students list to get fresh data
    await loadStudents();

    toast.add({
      title: "Muvaffaqiyat",
      description: `Talaba ${
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

const deleteStudent = async (student: Student) => {
  isDeleting.value = true;
  try {
    await api.delete<void>(apiService.value, `/users/${student.user_id}`);

    // Remove student from list
    students.value = students.value.filter(
      (s) => s.user_id !== student.user_id
    );
    totalItems.value = students.value.length;

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

// Load students on component mount
onMounted(() => {
  // Get the pagination parameters from URL
  if (route.query.page) {
    page.value = parseInt(route.query.page as string) || 1;
  }
  if (route.query.limit) {
    limit.value = parseInt(route.query.limit as string) || 10;
  }

  // Handle search from URL
  if (route.query.query) {
    search.value = route.query.query as string;
  }

  loadStudents();
  loadCourses();
});

// Watchers
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

watch(page, () => {
  loadStudents();
  updateUrlParams();
});

watch(limit, () => {
  page.value = 1;
  loadStudents();
  updateUrlParams();
});

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
</script>
