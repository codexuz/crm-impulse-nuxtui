<template>
  <UDashboardPanel id="teachers">
    <template #header>
      <UDashboardNavbar title="O'qituvchilar" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          O'qituvchi hisoblarini va ma'lumotlarini boshqarish
        </template>

        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="O'qituvchi qo'shish"
            @click="openAddDialog"
          />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="O'qituvchilarni qidirish..."
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
      <div>
        <!-- Teachers Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">O'qituvchilar ro'yxati</h3>
          </template>

          <UTable
            ref="table"
            v-model:sort="sort"
            :data="teachers"
            :columns="columns"
            :loading="isLoading"
            :empty="'O\'qituvchilar topilmadi'"
          />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                <span class="font-medium">{{ totalItems }}</span> o'qituvchi
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

      <!-- Add Teacher Modal -->
      <UModal v-model:open="addDialog" :ui="{ width: 'sm:max-w-[425px]' }">
        <template #header>
          <h3 class="text-lg font-semibold">Yangi o'qituvchi qo'shish</h3>
        </template>

        <template #body>
          <div class="space-y-4">
            <div>
              <UFormField  label="Ism" required>
                <UInput v-model="newTeacher.first_name" placeholder="Ism" />
              </UFormField>
            </div>

            <div>
              <UFormField  label="Familiya" required>
                <UInput v-model="newTeacher.last_name" placeholder="Familiya" />
              </UFormField>
            </div>

            <div>
              <UFormField  label="Login" required>
                <UInput v-model="newTeacher.username" placeholder="Login" />
              </UFormField>
            </div>

            <div>
              <UFormField  label="Telefon" required>
                <UInput
                  v-model="newTeacher.phone"
                  placeholder="+998 xx xxx xx xx"
                />
              </UFormField>
            </div>

            <div>
              <UFormField  label="Parol" required>
                <UInput
                  v-model="newTeacher.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Parol"
                >
                  <template #trailing>
                    <UButton
                      variant="ghost"
                      :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      size="xs"
                      @click="showPassword = !showPassword"
                    />
                  </template>
                </UInput>
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
              @click="addDialog = false"
            />
            <UButton
              :label="isLoading ? 'Yaratilmoqda...' : 'O\'qituvchi yaratish'"
              :loading="isLoading"
              @click="addTeacher"
            />
          </div>
        </template>
      </UModal>

      <!-- View Teacher Modal -->
      <UModal v-model:open="viewDialog" :ui="{ width: 'sm:max-w-[600px]' }">
        <template #header>
          <h3 class="text-lg font-semibold">O'qituvchi ma'lumotlari</h3>
        </template>

        <template #body>
          <div v-if="selectedTeacher" class="py-4">
            <div class="flex items-center gap-4 mb-4">
              <UAvatar
                :alt="`${selectedTeacher.first_name} ${selectedTeacher.last_name}`"
                size="lg"
              >
                <template #fallback>
                  {{
                    getInitials(
                      selectedTeacher.first_name,
                      selectedTeacher.last_name,
                    )
                  }}
                </template>
              </UAvatar>
              <div>
                <h3 class="text-lg font-semibold">
                  {{ selectedTeacher.first_name }}
                  {{ selectedTeacher.last_name }}
                </h3>
                <p class="text-gray-500">@{{ selectedTeacher.username }}</p>
              </div>
              <UBadge
                :variant="selectedTeacher.is_active ? 'solid' : 'outline'"
                class="ml-auto"
              >
                {{ selectedTeacher.is_active ? "Faol" : "Faol emas" }}
              </UBadge>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="font-medium text-sm mb-2">Aloqa ma'lumotlari</h4>
                <div class="space-y-1">
                  <div class="flex">
                    <span class="text-gray-500 w-20">Telefon:</span>
                    <span>{{ selectedTeacher.phone }}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 class="font-medium text-sm mb-2">Tizim ma'lumotlari</h4>
                <div class="space-y-1">
                  <div class="flex">
                    <span class="text-gray-500 w-20">ID:</span>
                    <span class="text-xs font-mono">{{
                      selectedTeacher.user_id
                    }}</span>
                  </div>
                  <div class="flex">
                    <span class="text-gray-500 w-20">Yaratilgan:</span>
                    <span>{{ formatDate(selectedTeacher.created_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="subtle"
              label="Yopish"
              @click="viewDialog = false"
            />
            <UButton label="Tahrirlash" @click="editTeacher(selectedTeacher)" />
          </div>
        </template>
      </UModal>

      <!-- Edit Teacher Modal -->
      <UModal v-model:open="editDialog" :ui="{ width: 'sm:max-w-[425px]' }">
        <template #header>
          <h3 class="text-lg font-semibold">O'qituvchini tahrirlash</h3>
        </template>

        <template #body>
          <div v-if="editingTeacher" class="space-y-4">
            <div>
              <UFormField  label="Ism" required>
                <UInput v-model="editingTeacher.first_name" placeholder="Ism" />
              </UFormField>
            </div>

            <div>
              <UFormField  label="Familiya" required>
                <UInput
                  v-model="editingTeacher.last_name"
                  placeholder="Familiya"
                />
              </UFormField>
            </div>

            <div>
              <UFormField  label="Login" required>
                <UInput v-model="editingTeacher.username" placeholder="Login" />
              </UFormField>
            </div>

            <div>
              <UFormField  label="Telefon" required>
                <UInput
                  v-model="editingTeacher.phone"
                  placeholder="+998 xx xxx xx xx"
                />
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
              @click="editDialog = false"
            />
            <UButton
              :label="isUpdating ? 'Yangilanmoqda...' : 'Yangilash'"
              :loading="isUpdating"
              @click="updateTeacher"
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

definePageMeta({
  layout: "default",
  middleware: "auth",
});

interface Teacher {
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  phone: string;
  is_active: boolean;
  roles?: any[];
  groupCount?: number;
  created_at?: string;
}

interface NewTeacher {
  first_name: string;
  last_name: string;
  username: string;
  phone: string;
  password: string;
}

const UAvatar = resolveComponent("UAvatar");
const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UPopover = resolveComponent("UPopover");

const { apiService } = useAuth();
const toast = useToast();

const teachers = ref<Teacher[]>([]);
const search = ref("");
const selectedTeacher = ref<Teacher | null>(null);
const editingTeacher = ref<Teacher | null>(null);
const deletePopoverOpen = ref<Record<string, boolean>>({});
const isDeleting = ref(false);

const newTeacher = ref<NewTeacher>({
  first_name: "",
  last_name: "",
  username: "",
  phone: "",
  password: "",
});

const isLoading = ref(false);
const isUpdating = ref(false);
const showPassword = ref(false);
const viewDialog = ref(false);
const editDialog = ref(false);
const addDialog = ref(false);

// Pagination state
const page = ref(1);
const limit = ref(10);
const totalItems = ref(0);
const totalPages = ref(1);
const sort = ref({ column: "first_name", direction: "asc" as const });

const route = useRoute();
const router = useRouter();

// Computed
const paginationStart = computed(() => (page.value - 1) * limit.value + 1);
const paginationEnd = computed(() =>
  Math.min(page.value * limit.value, totalItems.value),
);

// Table columns with render functions
const columns: TableColumn<Teacher>[] = [
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
          {
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
    header: "Login",
    cell: ({ row }) => `@${row.original.username}`,
  },
  {
    accessorKey: "phone",
    header: "Telefon",
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      return h(
        UBadge,
        {
          variant: row.original.is_active ? "solid" : "outline",
          color: row.original.is_active ? "primary" : "neutral",
        },
        () => (row.original.is_active ? "Faol" : "Faol emas"),
      );
    },
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      const teacherId = row.original.user_id;
      return h("div", { class: "flex items-center gap-1" }, [
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-eye",
          size: "sm",
          square: true,
          onClick: () => viewTeacher(row.original),
        }),
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-pencil",
          size: "sm",
          square: true,
          onClick: () => editTeacher(row.original),
        }),
        h(
          UPopover,
          {
            open: deletePopoverOpen.value[teacherId] || false,
            "onUpdate:open": (value: boolean) => {
              deletePopoverOpen.value[teacherId] = value;
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
                  "Bu o'qituvchining hisobini butunlay o'chiradi va barcha bog'langan ma'lumotlarni olib tashlaydi.",
                ),
                h("div", { class: "flex justify-end gap-2 mt-3" }, [
                  h(UButton, {
                    color: "neutral",
                    variant: "subtle",
                    label: "Bekor qilish",
                    size: "sm",
                    onClick: () => {
                      deletePopoverOpen.value[teacherId] = false;
                    },
                  }),
                  h(UButton, {
                    color: "error",
                    label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                    loading: isDeleting.value,
                    size: "sm",
                    onClick: async () => {
                      await confirmDelete(row.original);
                      deletePopoverOpen.value[teacherId] = false;
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

// Functions
async function loadTeachers() {
  try {
    isLoading.value = true;

    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: limit.value.toString(),
    });

    if (search.value) {
      params.append("query", search.value);
    }

    const response = await api.get<{
      data: Teacher[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, `/users/teachers?${params.toString()}`);

    teachers.value = response.data;
    totalItems.value = response.total;
    totalPages.value = response.totalPages;
  } catch (error: any) {
    console.error("Failed to load teachers:", error);
    toast.add({
      title: "Xatolik",
      description: "O'qituvchilarni yuklashda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
}

function openAddDialog() {
  newTeacher.value = {
    first_name: "",
    last_name: "",
    username: "",
    phone: "",
    password: "",
  };
  addDialog.value = true;
}

async function addTeacher() {
  try {
    isLoading.value = true;
    await api.post<Teacher>(apiService.value, "/users", {
      ...newTeacher.value,
      roles: ["teacher"],
    });

    await loadTeachers();

    toast.add({
      title: "Muvaffaqiyat",
      description: "O'qituvchi muvaffaqiyatli yaratildi",
      color: "success",
    });
    addDialog.value = false;
  } catch (error: any) {
    console.error("Failed to create teacher:", error);
    toast.add({
      title: "Xatolik",
      description: error.message || "O'qituvchi yaratishda xatolik",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
}

function viewTeacher(teacher: Teacher) {
  selectedTeacher.value = teacher;
  viewDialog.value = true;
}

function editTeacher(teacher: Teacher | null) {
  if (!teacher) return;
  editingTeacher.value = { ...teacher };
  viewDialog.value = false;
  editDialog.value = true;
}

async function updateTeacher() {
  if (!editingTeacher.value) return;

  try {
    isUpdating.value = true;
    await api.patch<Teacher>(
      apiService.value,
      `/users/${editingTeacher.value.user_id}`,
      editingTeacher.value,
    );

    await loadTeachers();

    toast.add({
      title: "Muvaffaqiyat",
      description: "O'qituvchi muvaffaqiyatli yangilandi",
      color: "success",
    });
    editDialog.value = false;
    editingTeacher.value = null;
  } catch (error: any) {
    console.error("Failed to update teacher:", error);
    toast.add({
      title: "Xatolik",
      description: error.message || "O'qituvchini yangilashda xatolik",
      color: "error",
    });
  } finally {
    isUpdating.value = false;
  }
}

async function confirmDelete(teacher: Teacher) {
  isDeleting.value = true;
  try {
    await api.delete<void>(apiService.value, `/users/${teacher.user_id}`);

    await loadTeachers();

    toast.add({
      title: "Muvaffaqiyat",
      description: "O'qituvchi muvaffaqiyatli o'chirildi",
      color: "success",
    });
  } catch (error: any) {
    console.error("Failed to delete teacher:", error);
    toast.add({
      title: "Xatolik",
      description: "O'qituvchini o'chirishda xatolik",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
}

async function toggleTeacherStatus(teacher: Teacher) {
  try {
    const endpoint = teacher.is_active
      ? `/users/${teacher.user_id}/deactivate`
      : `/users/${teacher.user_id}/activate`;

    await api.patch<Teacher>(apiService.value, endpoint, {});

    await loadTeachers();

    toast.add({
      title: "Muvaffaqiyat",
      description: `O'qituvchi ${teacher.is_active ? "faolsizlantirildi" : "faollashtirildi"}`,
      color: "success",
    });
  } catch (error: any) {
    console.error("Failed to toggle teacher status:", error);
    toast.add({
      title: "Xatolik",
      description: "O'qituvchi statusini o'zgartirishda xatolik",
      color: "error",
    });
  }
}

function viewTeacherGroups(teacher: Teacher) {
  navigateTo(`/teachers/${teacher.user_id}/groups`);
}

function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";
  return (first + last).toUpperCase();
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const updateUrlParams = () => {
  const query: Record<string, string> = {
    page: page.value.toString(),
    limit: limit.value.toString(),
  };

  if (search.value) {
    query.search = search.value;
  }

  router.push({ query });
};

// Load data on mount
onMounted(() => {
  if (route.query.page) {
    page.value = parseInt(route.query.page as string) || 1;
  }
  if (route.query.limit) {
    limit.value = parseInt(route.query.limit as string) || 10;
  }
  if (route.query.search) {
    search.value = route.query.search as string;
  }

  loadTeachers();
});

// Debounce search to avoid too many API calls
let searchTimeout: NodeJS.Timeout | null = null;
watch(search, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    page.value = 1;
    loadTeachers();
    updateUrlParams();
  }, 300);
});

// Reload when page or limit changes
watch(page, () => {
  loadTeachers();
  updateUrlParams();
});

watch(limit, () => {
  page.value = 1;
  loadTeachers();
  updateUrlParams();
});
</script>
