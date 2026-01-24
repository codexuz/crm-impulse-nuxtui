<template>
  <UDashboardPanel id="parents">
    <template #header>
      <UDashboardNavbar title="Ota-onalar" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          Talabalar ota-onalari ma'lumotlarini boshqarish
        </template>

        <template #right>
          <StudentsAddParentModal @submit="addParent" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="parentName"
            icon="i-lucide-user"
            placeholder="Ota-ona ismi..."
            class="w-48"
          />
          <UInput
            v-model="parentPhone"
            icon="i-lucide-phone"
            placeholder="Telefon raqami..."
            class="w-48"
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
        <!-- Parents Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Ota-onalar ro'yxati</h3>
          </template>

          <UTable
            ref="table"
            v-model:sort="sort"
            :data="parents"
            :columns="columns"
            :loading="isLoading"
            :empty="'Ota-onalar topilmadi'"
          />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                <span class="font-medium">{{ totalItems }}</span> ota-ona
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
      <!-- View Parent Modal -->
      <StudentsViewParentModal
        v-model:open="viewDialog"
        :parent="selectedParent"
        @edit="editParent"
      />

      <!-- Edit Parent Modal -->
      <StudentsEditParentModal
        v-model:open="editDialog"
        :parent="editingParent"
        @updated="loadParents"
      />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { StudentParent } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const UAvatar = resolveComponent("UAvatar");
const UButton = resolveComponent("UButton");
const UPopover = resolveComponent("UPopover");

const { apiService } = useAuth();
const toast = useToast();
const table = useTemplateRef("table");

// Parents data
const parents = ref<StudentParent[]>([]);
const isLoading = ref(true);
const page = ref(1);
const limit = ref(10);
const totalItems = ref(0);
const totalPages = ref(1);
const sort = ref({ column: "full_name", direction: "asc" as const });

// Filters and search
const parentName = ref("");
const parentPhone = ref("");
const studentName = ref("");

// Dialogs
const viewDialog = ref(false);
const editDialog = ref(false);

// Selected parent data
const selectedParent = ref<StudentParent | null>(null);
const isDeleting = ref(false);
const editingParent = ref<StudentParent | null>(null);
const deletePopoverOpen = ref<Record<string, boolean>>({});

// Table columns with render functions
const columns: TableColumn<StudentParent>[] = [
  {
    accessorKey: "full_name",
    header: "To'liq ismi",
    cell: ({ row }) => {
      return h("div", { class: "flex items-center gap-3" }, [
        h(
          UAvatar,
          {
            alt: row.original.full_name,
            size: "sm",
          },
          {
            fallback: () => row.original.full_name.charAt(0).toUpperCase(),
          },
        ),
        h("span", { class: "font-medium" }, row.original.full_name),
      ]);
    },
  },
  {
    accessorKey: "phone_number",
    header: "Telefon",
  },
  {
    accessorKey: "additional_number",
    header: "Qo'shimcha raqam",
    cell: ({ row }) => row.original.additional_number || "Yo'q",
  },
  {
    accessorKey: "student",
    header: "Talaba",
    cell: ({ row }) => {
      if (row.original.student) {
        return `${row.original.student.first_name} ${row.original.student.last_name}`;
      }
      return h("span", { class: "text-gray-400 text-sm" }, "Yo'q");
    },
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      const parentId = row.original.id;
      return h("div", { class: "flex items-center gap-1" }, [
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-eye",
          size: "sm",
          square: true,
          onClick: () => {
            viewParent(row.original);
          },
        }),
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-pencil",
          size: "sm",
          square: true,
          onClick: () => editParent(row.original),
        }),
        h(
          UPopover,
          {
            open: deletePopoverOpen.value[parentId] || false,
            "onUpdate:open": (value: boolean) => {
              deletePopoverOpen.value[parentId] = value;
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
                  "Bu ota-ona ma'lumotlarini butunlay o'chiradi.",
                ),
                h("div", { class: "flex justify-end gap-2 mt-3" }, [
                  h(UButton, {
                    color: "neutral",
                    variant: "subtle",
                    label: "Bekor qilish",
                    size: "sm",
                    onClick: () => {
                      deletePopoverOpen.value[parentId] = false;
                    },
                  }),
                  h(UButton, {
                    color: "red",
                    label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                    loading: isDeleting.value,
                    size: "sm",
                    onClick: async () => {
                      await confirmDelete(row.original);
                      deletePopoverOpen.value[parentId] = false;
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

const paginationStart = computed(() => {
  return totalItems.value === 0 ? 0 : (page.value - 1) * limit.value + 1;
});

const paginationEnd = computed(() => {
  return Math.min(page.value * limit.value, totalItems.value);
});

// Methods
const loadParents = async () => {
  isLoading.value = true;
  try {
    // Build query parameters
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: limit.value.toString(),
    });

    if (parentName.value) {
      params.append("parent_name", parentName.value);
    }
    if (parentPhone.value) {
      params.append("parent_phone", parentPhone.value);
    }
    if (studentName.value) {
      params.append("student_name", studentName.value);
    }

    const url = `/student-parents?${params.toString()}`;
    console.log("Loading parents from:", url);

    const response = await api.get<{
      data: StudentParent[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, url);

    console.log("Loaded parents:", response);

    parents.value = response.data;
    totalItems.value = response.total;
    totalPages.value = response.totalPages;

    console.log("Total parents:", totalItems.value);
  } catch (error) {
    console.error("Failed to load parents:", error);
    toast.add({
      title: "Xatolik",
      description:
        "Ota-onalarni yuklashda xatolik. Iltimos, qayta urinib ko'ring.",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const addParent = async (parentData: any) => {
  isLoading.value = true;
  try {
    const response = await api.post<StudentParent>(
      apiService.value,
      "/student-parents",
      parentData,
    );

    // Reload parents from server
    await loadParents();

    toast.add({
      title: "Muvaffaqiyat",
      description: "Ota-ona muvaffaqiyatli qo'shildi",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to create parent:", error);
    toast.add({
      title: "Xatolik",
      description: "Ota-ona qo'shishda xatolik. Iltimos, qayta urinib ko'ring.",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const viewParent = async (parent: StudentParent) => {
  console.log("viewParent called with:", parent);
  selectedParent.value = parent;
  viewDialog.value = true;
};

const editParent = (parent: StudentParent | null) => {
  if (!parent) return;

  viewDialog.value = false;
  editingParent.value = parent;
  editDialog.value = true;
};

const confirmDelete = async (parent: StudentParent) => {
  isDeleting.value = true;
  try {
    await api.delete<void>(apiService.value, `/student-parents/${parent.id}`);

    // Reload parents from server
    await loadParents();

    toast.add({
      title: "Muvaffaqiyat",
      description: "Ota-ona muvaffaqiyatli o'chirildi",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to delete parent:", error);
    toast.add({
      title: "Xatolik",
      description:
        "Ota-onani o'chirishda xatolik. Iltimos, qayta urinib ko'ring.",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  const route = useRoute();
  if (route.query.page) {
    page.value = parseInt(route.query.page as string) || 1;
  }
  if (route.query.limit) {
    limit.value = parseInt(route.query.limit as string) || 10;
  }
  if (route.query.parent_name) {
    parentName.value = route.query.parent_name as string;
  }
  if (route.query.parent_phone) {
    parentPhone.value = route.query.parent_phone as string;
  }
  if (route.query.student_name) {
    studentName.value = route.query.student_name as string;
  }

  loadParents();
});

const route = useRoute();
const router = useRouter();

const updateUrlParams = () => {
  const query: Record<string, string> = {
    page: page.value.toString(),
    limit: limit.value.toString(),
  };

  if (parentName.value) {
    query.parent_name = parentName.value;
  }
  if (parentPhone.value) {
    query.parent_phone = parentPhone.value;
  }
  if (studentName.value) {
    query.student_name = studentName.value;
  }

  router.push({ query });
};

// Debounce search to avoid too many API calls
let searchTimeout: NodeJS.Timeout | null = null;
const handleSearchChange = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    page.value = 1;
    loadParents();
    updateUrlParams();
  }, 300);
};

watch(parentName, handleSearchChange);
watch(parentPhone, handleSearchChange);
watch(studentName, handleSearchChange);

// Reload when page or limit changes
watch(page, () => {
  loadParents();
  updateUrlParams();
});

watch(limit, () => {
  page.value = 1;
  loadParents();
  updateUrlParams();
});
</script>
