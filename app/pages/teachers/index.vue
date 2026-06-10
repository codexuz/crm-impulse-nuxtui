<template>
  <UDashboardPanel id="teachers">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UNavigationMenu :items="teacherNavItems" highlight />
        </template>

        <template #description>
          O'qituvchi hisoblarini va ma'lumotlarini boshqarish
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" :label="addButtonLabel" @click="openAddDialog" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput v-model="search" icon="i-lucide-search" placeholder="Qidirish..." class="w-56" />
          <USelectMenu v-model="roleFilter" :items="roleFilterItems" class="w-44" />
          <USelectMenu v-model="archivedFilter" :items="archivedFilterItems" class="w-44" />
        </template>

        <template #right>
          <USelectMenu v-model="limit" :items="[5, 10, 20, 30, 50]" class="w-24">
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
            <h3 class="text-base font-semibold">{{ roleFilter?.label ?? "O'qituvchilar" }} ro'yxati</h3>
          </template>

          <UTable ref="table" v-model:sort="sort" :data="teachers" :columns="columns" :loading="isLoading"
            :empty="'O\'qituvchilar topilmadi'" />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                <span class="font-medium">{{ totalItems }}</span> o'qituvchi
              </div>

              <UPagination :model-value="page" :total="totalItems" :items-per-page="limit" show-last show-first
                @update:page="(p: number) => (page = p)" />
            </div>
          </template>
        </UCard>
      </div>

      <!-- Add Teacher Modal -->
      <UModal v-model:open="addDialog" :ui="{ width: 'sm:max-w-[425px]' }">
        <template #header>
          <h3 class="text-lg font-semibold">{{ addButtonLabel }}</h3>
        </template>

        <template #body>
          <div class="space-y-4">
            <div>
              <UFormField label="Ism" required>
                <UInput v-model="newTeacher.first_name" placeholder="Ism" />
              </UFormField>
            </div>

            <div>
              <UFormField label="Familiya" required>
                <UInput v-model="newTeacher.last_name" placeholder="Familiya" />
              </UFormField>
            </div>

            <div>
              <UFormField label="Login" required>
                <UInput v-model="newTeacher.username" placeholder="Login" />
              </UFormField>
            </div>

            <div>
              <UFormField label="Telefon" required>
                <UInput v-model="newTeacher.phone" v-maska data-maska="+998 ## ### ## ##" placeholder="+998 xx xxx xx xx" />
              </UFormField>
            </div>

            <div>
              <UFormField label="Parol" required>
                <UInput v-model="newTeacher.password" :type="showPassword ? 'text' : 'password'" placeholder="Parol">
                  <template #trailing>
                    <UButton variant="ghost" :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" size="xs"
                      @click="showPassword = !showPassword" />
                  </template>
                </UInput>
              </UFormField>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="subtle" label="Bekor qilish" @click="addDialog = false" />
            <UButton :label="isLoading ? 'Yaratilmoqda...' : 'O\'qituvchi yaratish'" :loading="isLoading"
              @click="addTeacher" />
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
              <UAvatar :alt="`${selectedTeacher.first_name} ${selectedTeacher.last_name}`" size="lg">
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
              <UBadge :variant="selectedTeacher.is_active ? 'solid' : 'outline'" class="ml-auto">
                {{ selectedTeacher.is_active ? "Faol" : "Faol emas" }}
              </UBadge>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="font-medium text-sm mb-2">Aloqa ma'lumotlari</h4>
                <div class="space-y-1">
                  <div class="flex">
                    <span class="text-gray-500 w-20">Telefon:</span>
                    <span>{{ formatPhone(selectedTeacher.phone) }}</span>
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
            <UButton color="neutral" variant="subtle" label="Yopish" @click="viewDialog = false" />
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
              <UFormField label="Ism" required>
                <UInput v-model="editingTeacher.first_name" placeholder="Ism" />
              </UFormField>
            </div>

            <div>
              <UFormField label="Familiya" required>
                <UInput v-model="editingTeacher.last_name" placeholder="Familiya" />
              </UFormField>
            </div>

            <div>
              <UFormField label="Login" required>
                <UInput v-model="editingTeacher.username" placeholder="Login" />
              </UFormField>
            </div>

            <div>
              <UFormField label="Telefon" required>
                <UInput v-model="editingTeacher.phone" v-maska data-maska="+998 ## ### ## ##" placeholder="+998 xx xxx xx xx" />
              </UFormField>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="subtle" label="Bekor qilish" @click="editDialog = false" />
            <UButton :label="isUpdating ? 'Yangilanmoqda...' : 'Yangilash'" :loading="isUpdating"
              @click="updateTeacher" />
          </div>
        </template>
      </UModal>
      <!-- QR Code Modal -->
      <UModal v-model:open="qrDialog" :ui="{ width: 'sm:max-w-[400px]' }">
        <template #header>
          <h3 class="text-lg font-semibold">O'qituvchi QR kodi</h3>
        </template>

        <template #body>
          <div class="flex flex-col items-center justify-center p-4 gap-4">
            <div v-if="qrLoading" class="flex items-center justify-center h-64">
              <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
            </div>
            <img v-if="!qrLoading && qrDataUrl" :src="qrDataUrl" alt="QR kod" class="max-w-full h-auto border rounded-lg shadow-sm" />
            <p v-if="!qrLoading" class="text-sm text-gray-500 text-center">
              Ushbu QR kod o'qituvchi davomadi uchun. Uni Telegram bot orqali skanerlash mumkin.
            </p>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="subtle" label="Yopish" @click="qrDialog = false" />
            <UButton icon="i-lucide-download" label="Yuklab olish" :disabled="qrLoading" @click="downloadQr" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn, NavigationMenuItem } from "@nuxt/ui";
// QRCode is imported dynamically in showTeacherQr to avoid SSR/canvas timing issues
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import { useFinancialAccess } from "~/composables/useFinancialAccess";
import { useStaffAttendance } from "~/composables/useStaffAttendance";

const { apiService } = useAuth();
const { hasFinancialAccess } = useFinancialAccess();
const { formatPhone } = usePhoneFormatter();
const { getTeacherStaticQr } = useStaffAttendance();

const teacherNavItems = computed<NavigationMenuItem[]>(() => [
  {
    label: 'O\'qituvchilar',
    icon: 'i-lucide-users',
    to: '/teachers'
  },
  ...(hasFinancialAccess.value
    ? [
      {
        label: 'Profillar',
        icon: 'i-lucide-user-cog',
        to: '/teachers/profile'
      },
      {
        label: 'Oyliklar',
        icon: 'i-lucide-wallet',
        to: '/salaries'
      }
    ]
    : []),
]);

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

const toast = useToast();

const roleFilterItems = [
  { label: "O'qituvchilar", value: "teacher" },
  { label: "Yordamchi o'qituvchilar", value: "support_teacher" },
];
const roleFilter = ref(roleFilterItems[0]);

const archivedFilterItems = [
  { label: "Faollar", value: "false" },
  { label: "Arxivlanganlar", value: "true" },
];
const archivedFilter = ref(archivedFilterItems[0]);

const addButtonLabel = computed(() =>
  roleFilter.value?.value === "support_teacher"
    ? "Yordamchi qo'shish"
    : "O'qituvchi qo'shish",
);

const teachers = ref<Teacher[]>([]);
const search = ref("");
const selectedTeacher = ref<Teacher | null>(null);
const editingTeacher = ref<Teacher | null>(null);
const deletePopoverOpen = ref<Record<string, boolean>>({});
const hardDeletePopoverOpen = ref<Record<string, boolean>>({});
const isDeleting = ref(false);
const isHardDeleting = ref(false);
const isUnarchiving = ref<string | null>(null);

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
const qrDialog = ref(false);
const qrLoading = ref(false);
const qrDataUrl = ref<string>('');
const selectedTeacherForQr = ref<Teacher | null>(null);

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
    cell: ({ row }) => formatPhone(row.original.phone),
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
          icon: "i-lucide-qr-code",
          size: "sm",
          square: true,
          onClick: () => showTeacherQr(row.original),
        }),
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
        row.original.is_active
          ? h(
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
                    color: "warning",
                    variant: "ghost",
                    icon: "i-lucide-archive",
                    size: "sm",
                    square: true,
                    title: "Arxivlash",
                  }),
                content: () =>
                  h("div", { class: "p-4 max-w-sm space-y-3" }, [
                    h("h4", { class: "font-semibold text-sm" }, "Arxivlash?"),
                    h(
                      "p",
                      { class: "text-sm text-gray-600" },
                      "O'qituvchi faolsizlantiriladi (qayta tiklash mumkin).",
                    ),
                    h("div", { class: "flex justify-end gap-2 mt-3" }, [
                      h(UButton, {
                        color: "neutral",
                        variant: "subtle",
                        label: "Bekor qilish",
                        size: "sm",
                        onClick: () => { deletePopoverOpen.value[teacherId] = false; },
                      }),
                      h(UButton, {
                        color: "warning",
                        label: isDeleting.value ? "Arxivlanmoqda..." : "Arxivlash",
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
            )
          : h(UButton, {
              color: "success",
              variant: "ghost",
              icon: "i-lucide-archive-restore",
              size: "sm",
              square: true,
              title: "Arxivdan chiqarish",
              loading: isUnarchiving.value === teacherId,
              onClick: () => unarchiveTeacher(row.original),
            }),
        h(
          UPopover,
          {
            open: hardDeletePopoverOpen.value[teacherId] || false,
            "onUpdate:open": (value: boolean) => {
              hardDeletePopoverOpen.value[teacherId] = value;
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
                title: "Butunlay o'chirish (hard)",
              }),
            content: () =>
              h("div", { class: "p-4 max-w-sm space-y-3" }, [
                h("h4", { class: "font-semibold text-sm" }, "Butunlay o'chirilsinmi?"),
                h(
                  "p",
                  { class: "text-sm text-red-600" },
                  "Bu amal qaytarib bo'lmaydi! Barcha ma'lumotlar o'chiriladi.",
                ),
                h("div", { class: "flex justify-end gap-2 mt-3" }, [
                  h(UButton, {
                    color: "neutral",
                    variant: "subtle",
                    label: "Bekor qilish",
                    size: "sm",
                    onClick: () => { hardDeletePopoverOpen.value[teacherId] = false; },
                  }),
                  h(UButton, {
                    color: "error",
                    label: isHardDeleting.value ? "O'chirilmoqda..." : "Butunlay o'chirish",
                    loading: isHardDeleting.value,
                    size: "sm",
                    onClick: async () => {
                      await confirmHardDelete(row.original);
                      hardDeletePopoverOpen.value[teacherId] = false;
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
    params.append("is_archived", archivedFilter.value?.value ?? "false");
    params.append("role", roleFilter.value?.value ?? "teacher");

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
    const data = {
      ...newTeacher.value,
      phone: newTeacher.value.phone ? newTeacher.value.phone.replace(/\s+/g, "") : "",
      role: roleFilter.value?.value ?? "teacher",
    };
    await api.post<Teacher>(apiService.value, "/users/teachers", data);

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
    const updateData = {
      ...editingTeacher.value,
      phone: editingTeacher.value.phone ? editingTeacher.value.phone.replace(/\s+/g, "") : ""
    };

    await api.patch<Teacher>(
      apiService.value,
      `/users/${editingTeacher.value.user_id}`,
      updateData,
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

async function unarchiveTeacher(teacher: Teacher) {
  isUnarchiving.value = teacher.user_id;
  try {
    await api.patch<Teacher>(apiService.value, `/users/${teacher.user_id}/activate`, {});
    await loadTeachers();
    toast.add({
      title: "Muvaffaqiyat",
      description: "O'qituvchi arxivdan chiqarildi",
      color: "success",
    });
  } catch (error: any) {
    console.error("Failed to unarchive teacher:", error);
    toast.add({
      title: "Xatolik",
      description: "Arxivdan chiqarishda xatolik",
      color: "error",
    });
  } finally {
    isUnarchiving.value = null;
  }
}

async function confirmHardDelete(teacher: Teacher) {
  isHardDeleting.value = true;
  try {
    await api.delete<void>(apiService.value, `/users/${teacher.user_id}/hard`);
    await loadTeachers();
    toast.add({
      title: "Muvaffaqiyat",
      description: "O'qituvchi butunlay o'chirildi",
      color: "success",
    });
  } catch (error: any) {
    console.error("Failed to hard delete teacher:", error);
    toast.add({
      title: "Xatolik",
      description: "O'qituvchini o'chirishda xatolik",
      color: "error",
    });
  } finally {
    isHardDeleting.value = false;
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

async function showTeacherQr(teacher: Teacher) {
  selectedTeacherForQr.value = teacher;
  qrDataUrl.value = '';
  qrDialog.value = true;
  qrLoading.value = true;

  try {
    const data = await getTeacherStaticQr(teacher.user_id);
    if (data && data.bot_url) {
      const QRCodeModule = await import('qrcode');
      qrDataUrl.value = await QRCodeModule.toDataURL(data.bot_url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    }
  } catch (error) {
    console.error('Failed to generate QR:', error);
    toast.add({
      title: 'Xatolik',
      description: 'QR kodni yaratishda xatolik yuz berdi',
      color: 'error',
    });
    qrDialog.value = false;
  } finally {
    qrLoading.value = false;
  }
}

async function downloadQr() {
  if (!qrDataUrl.value || !selectedTeacherForQr.value) return;

  const fileName = `teacher-qr-${selectedTeacherForQr.value.username}.png`;
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  if (isTauri) {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeFile } = await import('@tauri-apps/plugin-fs');

      const filePath = await save({
        filters: [{ name: 'Image', extensions: ['png'] }],
        defaultPath: fileName,
      });

      if (filePath) {
        const parts = qrDataUrl.value.split(',');
        const base64 = parts[1];

        if (!base64) {
          throw new Error("Base64 ma'lumotlari topilmadi");
        }

        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        await writeFile(filePath, bytes);
        toast.add({
          title: 'Muvaffaqiyat',
          description: 'QR kod muvaffaqiyatli saqlandi',
          color: 'success',
        });
      }
    } catch (error) {
      console.error('Failed to save QR in Tauri:', error);
      toast.add({
        title: 'Xatolik',
        description: 'QR kodni saqlashda xatolik yuz berdi',
        color: 'error',
      });
    }
  } else {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = qrDataUrl.value;
    link.click();
  }
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
  query.is_archived = archivedFilter.value?.value ?? "false";
  query.role = roleFilter.value?.value ?? "teacher";

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
  if (route.query.is_archived) {
    archivedFilter.value = archivedFilterItems.find(i => i.value === route.query.is_archived) ?? archivedFilterItems[0];
  }
  if (route.query.role) {
    roleFilter.value = roleFilterItems.find(i => i.value === route.query.role) ?? roleFilterItems[0];
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

watch(archivedFilter, () => {
  page.value = 1;
  loadTeachers();
  updateUrlParams();
});

watch(roleFilter, () => {
  page.value = 1;
  loadTeachers();
  updateUrlParams();
});
</script>
