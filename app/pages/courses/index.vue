<template>
  <UDashboardPanel id="courses">
    <template #header>
      <UDashboardNavbar title="Kurslar" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          Til kurslarini va darajalarini boshqarish
        </template>

        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="Yangi kurs qo'shish"
            @click="openNewCourseDialog"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Kurslarni qidirish..."
            class="w-64"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div>
        <!-- Courses Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Kurslar ro'yxati</h3>
          </template>

          <UTable
            ref="table"
            v-model:sort="sort"
            :data="filteredCourses"
            :columns="columns"
            :loading="isLoading"
            :empty="'Kurslar topilmadi'"
          />

          <template #footer>
            <div class="text-sm text-gray-500">
              Jami <span class="font-medium">{{ totalItems }}</span> kurs
            </div>
          </template>
        </UCard>
      </div>

      <!-- Create/Edit Course Modal -->
      <UModal v-model:open="courseDialog" :ui="{ width: 'sm:max-w-[500px]' }">
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ isEditing ? "Kursni tahrirlash" : "Yangi kurs yaratish" }}
          </h3>
        </template>

        <template #body>
          <div class="space-y-4">
            <div>
              <UFormField  label="Kurs nomi" required>
                <UInput
                  v-model="formData.title"
                  placeholder="Masalan: Elementary (A2)"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div>
              <UFormField  label="Daraja" required>
                <USelect
                  v-model="formData.level"
                  :items="['A1', 'A2', 'B1', 'B2', 'C1']"
                  placeholder="Darajani tanlang"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div>
              <UFormField  label="Ta'rif (ixtiyoriy)">
                <UTextarea
                  v-model="formData.description"
                  placeholder="Kurs ta'rifini kiriting"
                  :rows="3"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div>
              <UFormField class="w-full">
                <UCheckbox v-model="formData.isActive" label="Kurs faol" />
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
              @click="courseDialog = false"
            />
            <UButton
              :label="isEditing ? 'Yangilash' : 'Yaratish'"
              :loading="isSaving"
              @click="saveCourse"
            />
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

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API and auth setup
const { apiService } = useAuth();
const toast = useToast();
const table = useTemplateRef("table");
const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UPopover = resolveComponent("UPopover");

// State variables
const courses = ref<Course[]>([]);
const isLoading = ref(true);
const error = ref("");
const courseDialog = ref(false);
const deleteDialog = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const selectedCourse = ref<Course | null>(null);

// Pagination and filtering
const page = ref(1);
const limit = ref(10);
const totalItems = ref(0);
const totalPages = ref(1);
const search = ref("");
const sort = ref({ column: "title", direction: "asc" as const });
const deletePopoverOpen = ref<Record<string, boolean>>({});

const formData = ref({
  id: "",
  title: "",
  level: "",
  description: "",
  isActive: true,
});

// Table columns with render functions
const columns: TableColumn<Course>[] = [
  {
    accessorKey: "title",
    header: "Nomi",
    cell: ({ row }) => {
      return h("div", { class: "flex items-center gap-2" }, [
        h("i", { class: "i-lucide-book text-primary h-4 w-4" }),
        h("span", { class: "font-medium" }, row.original.title),
      ]);
    },
  },
  {
    accessorKey: "level",
    header: "Daraja",
  },
  {
    accessorKey: "isActive",
    header: "Holat",
    cell: ({ row }) => {
      return h(
        UBadge,
        { variant: row.original.isActive ? "solid" : "subtle" },
        () => (row.original.isActive ? "Faol" : "Faol emas"),
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Yaratilgan",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    accessorKey: "updatedAt",
    header: "Yangilangan",
    cell: ({ row }) => formatDate(row.original.updatedAt),
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      const courseId = row.original.id;
      return h("div", { class: "flex items-center gap-1" }, [
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-pencil",
          size: "sm",
          square: true,
          onClick: () => editCourse(row.original),
        }),
        h(
          UPopover,
          {
            open: deletePopoverOpen.value[courseId] || false,
            "onUpdate:open": (value: boolean) => {
              deletePopoverOpen.value[courseId] = value;
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
                  "Bu kursni butunlay o'chiradi va barcha bog'langan ma'lumotlarni olib tashlaydi.",
                ),
                h("div", { class: "flex justify-end gap-2 mt-3" }, [
                  h(UButton, {
                    color: "neutral",
                    variant: "subtle",
                    label: "Bekor qilish",
                    size: "sm",
                    onClick: () => {
                      deletePopoverOpen.value[courseId] = false;
                    },
                  }),
                  h(UButton, {
                    color: "error",
                    label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                    loading: isDeleting.value,
                    size: "sm",
                    onClick: async () => {
                      selectedCourse.value = row.original;
                      await deleteCourse();
                      deletePopoverOpen.value[courseId] = false;
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
                  label: row.original.isActive
                    ? "Faolsizlantirish"
                    : "Faollashtirish",
                  icon: row.original.isActive
                    ? "i-lucide-eye-off"
                    : "i-lucide-eye",
                  onSelect: () => toggleCourseStatus(row.original),
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

// Computed properties
const filteredCourses = computed(() => {
  if (!search.value) return courses.value;

  const searchLower = search.value.toLowerCase();
  return courses.value.filter(
    (course) =>
      course.title.toLowerCase().includes(searchLower) ||
      course.level.toLowerCase().includes(searchLower),
  );
});

// Load courses on component mount
onMounted(async () => {
  await loadCourses();
});

// Fetch courses from API
const loadCourses = async () => {
  isLoading.value = true;
  error.value = "";

  try {
    const response = await api.get<{ data: any[] }>(apiService.value, "/courses");

    // Store courses and exclude units array
    courses.value = response?.data.map((course: any) => {
      // Create a new object without the units property
      const { units, ...courseWithoutUnits } = course;
      return courseWithoutUnits;
    });

    totalItems.value = courses.value.length;
  } catch (err) {
    console.error("Error loading courses:", err);
    error.value = "Kurslarni yuklashda xatolik. Iltimos, qayta urinib ko'ring.";
    toast.add({
      title: "Xatolik",
      description:
        "Kurslarni yuklashda xatolik. Iltimos, qayta urinib ko'ring.",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

// Format date for display
const formatDate = (dateString: string) => {
  if (!dateString) return "Mavjud emas";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Dialog functions
const openNewCourseDialog = () => {
  isEditing.value = false;
  formData.value = {
    id: "",
    title: "",
    level: "",
    description: "",
    isActive: true,
  };
  courseDialog.value = true;
};

const editCourse = (course: Course) => {
  isEditing.value = true;
  selectedCourse.value = course;
  formData.value = {
    id: course.id,
    title: course.title,
    level: course.level,
    description: course.description || "",
    isActive: course.isActive,
  };
  courseDialog.value = true;
};

const viewCourseDetails = (course: Course) => {
  navigateTo(`/courses/${course.id}`);
};

const confirmDeleteCourse = async (course: Course) => {
  selectedCourse.value = course;
  deleteDialog.value = true;
};

// API actions
const saveCourse = async () => {
  if (!formData.value.title || !formData.value.level) {
    toast.add({
      title: "Validatsiya xatosi",
      description: "Nomi va daraja majburiy maydonlardir.",
      color: "error",
    });
    return;
  }

  isSaving.value = true;

  try {
    let response;

    if (isEditing.value) {
      // Update existing course
      response = await api.patch<Course>(
        apiService.value,
        `/courses/${formData.value.id}`,
        formData.value,
      );

      // Update the course in the local array
      const index = courses.value.findIndex((c) => c.id === formData.value.id);
      if (index !== -1) {
        courses.value[index] = { ...response };
      }

      toast.add({
        title: "Muvaffaqiyat",
        description: "Kurs muvaffaqiyatli yangilandi.",
        color: "success",
      });
    } else {
      // Create new course
      response = await api.post<Course>(
        apiService.value,
        "/courses",
        formData.value,
      );

      // Add the new course to the local array
      courses.value.push({ ...response });

      toast.add({
        title: "Muvaffaqiyat",
        description: "Yangi kurs muvaffaqiyatli yaratildi.",
        color: "success",
      });
    }

    courseDialog.value = false;
    totalItems.value = courses.value.length;
  } catch (err) {
    console.error("Error saving course:", err);
    toast.add({
      title: "Xatolik",
      description: isEditing.value
        ? "Kursni yangilashda xatolik. Iltimos, qayta urinib ko'ring."
        : "Kurs yaratishda xatolik. Iltimos, qayta urinib ko'ring.",
      color: "error",
    });
  } finally {
    isSaving.value = false;
  }
};

const toggleCourseStatus = async (course: Course) => {
  try {
    const updatedCourse = await api.patch<Course>(
      apiService.value,
      `/courses/${course.id}`,
      { isActive: !course.isActive },
    );

    // Update the course in the local array
    const index = courses.value.findIndex((c) => c.id === course.id);
    if (index !== -1 && updatedCourse) {
      const courseToUpdate = courses.value[index];
      if (courseToUpdate) {
        courseToUpdate.isActive = updatedCourse.isActive;

        toast.add({
          title: "Muvaffaqiyat",
          description: updatedCourse.isActive
            ? "Kurs muvaffaqiyatli faollashtirildi."
            : "Kurs muvaffaqiyatli faolsizlantirildi.",
          color: "success",
        });
      }
    }
  } catch (err) {
    console.error("Error toggling course status:", err);
    toast.add({
      title: "Xatolik",
      description:
        "Kurs holatini yangilashda xatolik. Iltimos, qayta urinib ko'ring.",
      color: "error",
    });
  }
};

const deleteCourse = async () => {
  if (!selectedCourse.value) return;

  isDeleting.value = true;

  try {
    await api.delete(apiService.value, `/courses/${selectedCourse.value.id}`);

    // Remove the course from the local array
    courses.value = courses.value.filter(
      (c) => c.id !== selectedCourse.value?.id,
    );

    toast.add({
      title: "Muvaffaqiyat",
      description: "Kurs muvaffaqiyatli o'chirildi.",
      color: "success",
    });

    deleteDialog.value = false;
    totalItems.value = courses.value.length;
  } catch (err) {
    console.error("Error deleting course:", err);
    toast.add({
      title: "Xatolik",
      description: "Kursni o'chirishda xatolik. Iltimos, qayta urinib ko'ring.",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
};

// Debounce search
let searchTimeout: NodeJS.Timeout | null = null;
watch(search, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    // Search is handled by computed property
  }, 300);
});
</script>
