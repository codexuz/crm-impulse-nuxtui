<template>
  <UDashboardPanel id="group-students">
    <template #header>
      <UDashboardNavbar
        :title="`Guruh talabalari - ${groupName}`"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            @click="navigateTo(`/groups`)"
          />
        </template>

        <template #description>
          Guruhga yozilgan talabalarni boshqarish
        </template>

        <template #right>
          <GroupsAddStudentToGroupModal
            :group-id="groupId"
            @submit="handleAddStudent"
          />
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
            v-model="statusFilter"
            :items="statusOptions"
            value-key="value"
            placeholder="Holat bo'yicha filtr"
            class="w-48"
          >
            <template #label>
              {{
                statusOptions.find((s) => s.value === statusFilter)?.label ||
                "Barcha holatlar"
              }}
            </template>
          </USelectMenu>

          <USelectMenu v-model="limit" :items="[10, 20, 30, 50]" class="w-24">
            <template #label> {{ limit }} ta </template>
          </USelectMenu>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div>
        <!-- Students Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Guruh talabalari ro'yxati</h3>
          </template>

          <UTable
            :data="paginatedStudents"
            :columns="columns"
            :loading="isLoading"
            :empty="'Bu guruhda talabalar topilmadi'"
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

      <!-- Status Change Modal -->
      <GroupsChangeStudentStatusModal
        v-model:open="statusDialog"
        :group-student="selectedGroupStudent"
        @updated="loadGroupStudents"
      />

      <!-- Student Details Modal -->
      <GroupsViewGroupStudentModal
        v-model:open="studentDetailsDialog"
        :student="selectedStudent"
        :group-student="selectedGroupStudent"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { GroupStudent, Student } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const UAvatar = resolveComponent("UAvatar");
const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UPopover = resolveComponent("UPopover");

const { apiService } = useAuth();
const toast = useToast();
const route = useRoute();
const router = useRouter();

// Route params
const groupId = computed(() => route.params.groupId as string);

// Data
const groupStudents = ref<GroupStudent[]>([]);
const isLoading = ref(true);
const groupName = ref("");
const search = ref("");
const statusFilter = ref("all");
const page = ref(1);
const limit = ref(10);

// Status options
const statusOptions = [
  { value: "all", label: "Barcha holatlar" },
  { value: "active", label: "Faol" },
  { value: "removed", label: "O'chirilgan" },
  { value: "completed", label: "Tugatgan" },
  { value: "frozen", label: "Muzlatilgan" },
];

// Dialogs
const statusDialog = ref(false);
const studentDetailsDialog = ref(false);
const selectedGroupStudent = ref<GroupStudent | null>(null);
const selectedStudent = ref<Student | null>(null);
const deletePopoverOpen = ref<Record<string, boolean>>({});

// Table columns with render functions
const columns: TableColumn<GroupStudent>[] = [
  {
    accessorKey: "student",
    header: "Talaba",
    cell: ({ row }) => {
      const student = row.original.student;
      if (!student) return h("span", { class: "text-gray-400" }, "N/A");

      return h("div", { class: "flex items-center gap-3" }, [
        h(
          UAvatar,
          {
            src: student.avatar_url,
            alt: `${student.first_name} ${student.last_name}`,
            size: "sm",
          },
          student.avatar_url
            ? undefined
            : {
                fallback: () =>
                  getInitials(student.first_name, student.last_name),
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
            student.phone || student.username,
          ),
        ]),
      ]);
    },
  },
  {
    accessorKey: "status",
    header: "Holat",
    cell: ({ row }) => {
      const status = row.original.status;
      return h(
        UBadge,
        {
          color: getStatusColor(status),
          variant: "subtle",
        },
        () => getStatusLabel(status),
      );
    },
  },
  {
    accessorKey: "enrolled_at",
    header: "Ro'yxatga olindi",
    cell: ({ row }) => formatDate(row.original.enrolled_at),
  },
  {
    accessorKey: "createdAt",
    header: "Yaratildi",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      const studentId = row.original.id;
      return h("div", { class: "flex items-center gap-1" }, [
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-eye",
          size: "sm",
          square: true,
          onClick: () => viewStudentDetails(row.original),
        }),
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-edit-3",
          size: "sm",
          square: true,
          onClick: () => changeStudentStatus(row.original),
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
                icon: "i-lucide-user-minus",
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
                  "Bu talabani guruhdan butunlay o'chiradi.",
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
                    label: "O'chirish",
                    size: "sm",
                    onClick: async () => {
                      await removeStudentFromGroup(row.original);
                      deletePopoverOpen.value[studentId] = false;
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

// Computed properties
const filteredGroupStudents = computed(() => {
  let result = [...groupStudents.value];

  // Apply search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    result = result.filter((groupStudent) => {
      if (!groupStudent.student) return false;

      return (
        groupStudent.student.first_name.toLowerCase().includes(searchLower) ||
        groupStudent.student.last_name.toLowerCase().includes(searchLower) ||
        groupStudent.student.username?.toLowerCase().includes(searchLower) ||
        `${groupStudent.student.first_name} ${groupStudent.student.last_name}`
          .toLowerCase()
          .includes(searchLower)
      );
    });
  }

  // Apply status filter
  if (statusFilter.value !== "all") {
    result = result.filter(
      (groupStudent) => groupStudent.status === statusFilter.value,
    );
  }

  return result;
});

const totalItems = computed(() => filteredGroupStudents.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / limit.value));

const paginatedStudents = computed(() => {
  const start = (page.value - 1) * limit.value;
  const end = start + limit.value;
  return filteredGroupStudents.value.slice(start, end);
});

const paginationStart = computed(() => {
  return totalItems.value === 0 ? 0 : (page.value - 1) * limit.value + 1;
});

const paginationEnd = computed(() => {
  return Math.min(page.value * limit.value, totalItems.value);
});

// Methods
const loadGroupStudents = async () => {
  isLoading.value = true;
  try {
    // Load group students with nested student and group data
    const response = await api.get<GroupStudent[]>(
      apiService.value,
      `/group-students/group/${groupId.value}`,
    );
    groupStudents.value = response;

    // Get group name from first item if available
    if (response.length > 0 && response[0]?.group?.name) {
      groupName.value = response[0]?.group?.name;
    } else {
      // Fallback: Get group info separately
      await loadGroupInfo();
    }
  } catch (error) {
    console.error("Failed to load group students:", error);
    toast.add({
      title: "Xatolik",
      description: "Guruh talabalarini yuklashda xatolik",
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
    groupName.value = "Bu guruh";
  }
};

const handleAddStudent = async () => {
  await loadGroupStudents();
};

const changeStudentStatus = (groupStudent: GroupStudent) => {
  selectedGroupStudent.value = groupStudent;
  statusDialog.value = true;
};

const viewStudentDetails = (groupStudent: GroupStudent) => {
  if (!groupStudent.student) {
    toast.add({
      title: "Xatolik",
      description: "Talaba ma'lumotlari topilmadi",
      color: "error",
    });
    return;
  }

  // Convert the nested student to full Student type
  selectedStudent.value = {
    user_id: groupStudent.student.user_id,
    username: groupStudent.student.username,
    first_name: groupStudent.student.first_name,
    last_name: groupStudent.student.last_name,
    phone: groupStudent.student.phone || "",
    roles: [],
    is_active: true,
    created_at: new Date().toISOString(),
  };

  selectedGroupStudent.value = groupStudent;
  studentDetailsDialog.value = true;
};

const removeStudentFromGroup = async (groupStudent: GroupStudent) => {
  try {
    // Use fetch directly for delete to handle 204 No Content
    const response = await fetch(
      `${apiService.value.baseUrl}/group-students/${groupStudent.id}`,
      {
        method: "DELETE",
        headers: apiService.value.headers,
      },
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    // Reload the list to get fresh data
    await loadGroupStudents();

    toast.add({
      title: "Muvaffaqiyat",
      description: "Talaba guruhdan muvaffaqiyatli o'chirildi",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to remove student from group:", error);
    toast.add({
      title: "Xatolik",
      description: "Talabani guruhdan o'chirishda xatolik",
      color: "error",
    });
  }
};

// Helper functions
const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("uz-UZ");
};

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: "Faol",
    removed: "O'chirilgan",
    completed: "Tugatgan",
    frozen: "Muzlatilgan",
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    active: "green",
    removed: "red",
    completed: "blue",
    frozen: "gray",
  };
  return colorMap[status] || "gray";
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

  if (statusFilter.value !== "all") {
    query.status = statusFilter.value;
  }

  router.push({ query });
};

// Load data on component mount
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
  if (route.query.status) {
    statusFilter.value = route.query.status as string;
  }

  await loadGroupStudents();
});

// Debounce search to avoid too many rerenders
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

// Update URL when filters change
watch([page, limit, statusFilter], () => {
  updateUrlParams();
});
</script>
