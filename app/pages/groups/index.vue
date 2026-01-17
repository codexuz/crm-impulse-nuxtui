<template>
  <UDashboardPanel id="groups">
    <template #header>
      <UDashboardNavbar title="Guruhlar" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          Talabalar guruhlari va dars jadvallarini boshqarish
        </template>

        <template #right>
          <GroupsAddGroupModal
            :courses="courses"
            :teachers="teachers"
            @submit="loadGroups"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Guruhlarni qidirish..."
            class="w-64"
          />
        </template>

        <template #right>
          <USelectMenu
            v-model="filterCourse"
            :items="courseOptions"
            value-key="value"
            placeholder="Kurs"
            class="w-45"
          >
            <template #label>
              {{
                courseOptions.find((c) => c.value === filterCourse)?.label ||
                "Kurs"
              }}
            </template>
          </USelectMenu>

          <USelectMenu
            v-model="filterTeacher"
            :items="teacherOptions"
            value-key="value"
            placeholder="O'qituvchi"
            class="w-45"
          >
            <template #label>
              {{
                teacherOptions.find((t) => t.value === filterTeacher)?.label ||
                "O'qituvchi"
              }}
            </template>
          </USelectMenu>

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
        <!-- Groups Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Guruhlar ro'yxati</h3>
          </template>

          <UTable
            :data="groups"
            :columns="columns"
            :loading="isLoading"
            :empty="'Guruhlar topilmadi'"
          />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                <span class="font-medium">{{ totalItems }}</span> ta guruh
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

      <!-- Edit Group Modal -->
      <GroupsEditGroupModal
        v-model:open="editDialog"
        :group="editingGroup"
        :courses="courses"
        :teachers="teachers"
        @updated="loadGroups"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Group, Course, Teacher } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import { h, resolveComponent } from "vue";

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UPopover = resolveComponent("UPopover");

const { apiService } = useAuth();
const toast = useToast();
const route = useRoute();
const router = useRouter();

// Groups data
const groups = ref<Group[]>([]);
const courses = ref<Course[]>([]);
const teachers = ref<Teacher[]>([]);
const isLoading = ref(true);
const page = ref(1);
const limit = ref(10);
const totalItems = ref(0);
const totalPages = ref(1);

// Filters and search
const search = ref("");
const filterCourse = ref("all");
const filterTeacher = ref("all");

// Dialogs
const editDialog = ref(false);
const editingGroup = ref<Group | null>(null);
const groupToDelete = ref<Group | null>(null);
const deletePopoverOpen = ref<Record<string, boolean>>({});
const isDeleting = ref(false);

// Table columns with render functions
const columns: TableColumn<Group>[] = [
  {
    accessorKey: "name",
    header: "Guruh nomi",
    cell: ({ row }) => {
      return h("div", { class: "flex items-center gap-2" }, [
        h(
          UBadge,
          { color: "blue", variant: "subtle", size: "md" },
          () => row.original.name,
        ),
      ]);
    },
  },
  {
    accessorKey: "level",
    header: "Kurs",
    cell: ({ row }) => {
      const course = courses.value.find((c) => c.id === row.original.level_id);
      return course
        ? h("span", { class: "text-sm" }, `${course.title} (${course.level})`)
        : h("span", { class: "text-gray-400 text-sm" }, "Noma'lum");
    },
  },
  {
    accessorKey: "teacher",
    header: "O'qituvchi",
    cell: ({ row }) => {
      const teacher = teachers.value.find(
        (t) => t.user_id === row.original.teacher_id,
      );
      return teacher
        ? h(
            "span",
            { class: "font-medium text-sm" },
            `${teacher.first_name} ${teacher.last_name}`,
          )
        : h("span", { class: "text-gray-400 text-sm" }, "Tayinlanmagan");
    },
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
      const groupId = row.original.id;
      return h("div", { class: "flex items-center gap-1" }, [
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-pencil",
          size: "sm",
          square: true,
          onClick: () => editGroup(row.original),
        }),
        h(
          UPopover,
          {
            open: deletePopoverOpen.value[groupId] || false,
            "onUpdate:open": (value: boolean) => {
              deletePopoverOpen.value[groupId] = value;
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
                  "Bu guruhni butunlay o'chiradi va barcha bog'langan talabalar ro'yxati hamda davomat yozuvlari ham o'chiriladi.",
                ),
                h("div", { class: "flex justify-end gap-2 mt-3" }, [
                  h(UButton, {
                    color: "neutral",
                    variant: "subtle",
                    label: "Bekor qilish",
                    size: "sm",
                    onClick: () => {
                      deletePopoverOpen.value[groupId] = false;
                    },
                  }),
                  h(UButton, {
                    color: "red",
                    label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                    loading: isDeleting.value,
                    size: "sm",
                    onClick: async () => {
                      await confirmDelete(row.original);
                      deletePopoverOpen.value[groupId] = false;
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
                  label: "Talabalarni boshqarish",
                  icon: "i-lucide-users",
                  onSelect: () => navigateTo(`/groups/${row.original.id}/students`),
                },
                {
                  label: "Davomatni olish",
                  icon: "i-lucide-clipboard-check",
                  onSelect: () =>
                    navigateTo(`/attendance/group/${row.original.id}`),
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

// Computed
const courseOptions = computed(() => [
  { value: "all", label: "Barcha kurslar" },
  ...courses.value.map((c) => ({
    value: c.id,
    label: `${c.title} (${c.level})`,
  })),
]);

const teacherOptions = computed(() => [
  { value: "all", label: "Barcha o'qituvchilar" },
  ...teachers.value.map((t) => ({
    value: t.user_id,
    label: `${t.first_name} ${t.last_name}`,
  })),
]);

const paginationStart = computed(() => {
  return totalItems.value === 0 ? 0 : (page.value - 1) * limit.value + 1;
});

const paginationEnd = computed(() => {
  return Math.min(page.value * limit.value, totalItems.value);
});

// Methods
const loadGroups = async () => {
  isLoading.value = true;
  try {
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: limit.value.toString(),
    });

    if (search.value) {
      params.append("query", search.value);
    }

    if (filterCourse.value !== "all") {
      params.append("level_id", filterCourse.value);
    }

    if (filterTeacher.value !== "all") {
      params.append("teacher_id", filterTeacher.value);
    }

    const response = await api.get<{
      data: Group[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, `/groups?${params.toString()}`);

    groups.value = response.data || [];
    totalItems.value = response.total || 0;
    totalPages.value = response.totalPages || 1;
  } catch (error) {
    console.error("Failed to load groups:", error);
    toast.add({
      title: "Xatolik",
      description: "Guruhlarni yuklashda xatolik. Qaytadan urinib ko'ring.",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const loadCourses = async () => {
  try {
    const response = await api.get<Course[]>(apiService.value, "/courses");
    courses.value = (response || []).filter((course) => course.isActive);
  } catch (error) {
    console.error("Failed to load courses:", error);
  }
};

const loadTeachers = async () => {
  try {
    const params = new URLSearchParams({
      page: "1",
      limit: "1000",
    });

    const response = await api.get<{
      data: Teacher[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, `/users/teachers?${params.toString()}`);

    teachers.value = response.data || [];
  } catch (error) {
    console.error("Failed to load teachers:", error);
  }
};

const editGroup = (group: Group) => {
  editingGroup.value = group;
  editDialog.value = true;
};

const confirmDelete = async (group: Group) => {
  isDeleting.value = true;
  try {
    await api.delete(apiService.value, `/groups/${group.id}`);

    toast.add({
      title: "Muvaffaqiyat",
      description: "Guruh muvaffaqiyatli o'chirildi",
      color: "success",
    });

    await loadGroups();
  } catch (error) {
    console.error("Failed to delete group:", error);
    toast.add({
      title: "Xatolik",
      description: "Guruhni o'chirishda xatolik. Qaytadan urinib ko'ring.",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
};

// Helper functions
const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const updateUrlParams = () => {
  const query: Record<string, string> = {
    page: page.value.toString(),
    limit: limit.value.toString(),
  };

  if (search.value) {
    query.query = search.value;
  }
  if (filterCourse.value !== "all") {
    query.level_id = filterCourse.value;
  }
  if (filterTeacher.value !== "all") {
    query.teacher_id = filterTeacher.value;
  }

  router.push({ query });
};

// Debounce search
let searchTimeout: NodeJS.Timeout | null = null;
watch(search, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    page.value = 1;
    loadGroups();
    updateUrlParams();
  }, 300);
});

// Watch filters
watch([filterCourse, filterTeacher], () => {
  page.value = 1;
  loadGroups();
  updateUrlParams();
});

// Watch page and limit
watch(page, () => {
  loadGroups();
  updateUrlParams();
});

watch(limit, () => {
  page.value = 1;
  loadGroups();
  updateUrlParams();
});

// Initialize
onMounted(async () => {
  // Read URL params
  if (route.query.page) {
    page.value = parseInt(route.query.page as string) || 1;
  }
  if (route.query.limit) {
    limit.value = parseInt(route.query.limit as string) || 10;
  }
  if (route.query.query) {
    search.value = route.query.query as string;
  }
  if (route.query.level_id) {
    filterCourse.value = route.query.level_id as string;
  }
  if (route.query.teacher_id) {
    filterTeacher.value = route.query.teacher_id as string;
  }

  await Promise.all([loadCourses(), loadTeachers()]);
  await loadGroups();
});
</script>
