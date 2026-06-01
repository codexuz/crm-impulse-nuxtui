<template>
  <UDashboardPanel id="staff">
    <template #header>
      <UDashboardNavbar title="" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UNavigationMenu :items="staffNavItems" highlight />
        </template>

        <template #description>
          Adminlar va yordamchi o'qituvchilar — davomat uchun QR kodlar
        </template>

        <template #right>
          <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" :loading="isLoading"
            @click="loadStaff">
            Yangilash
          </UButton>
          <UButton icon="i-lucide-plus" label="Yordamchi o'qituvchi qo'shish" @click="openAddDialog" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput v-model="search" icon="i-lucide-search" placeholder="Xodimlarni qidirish..." class="w-64" />
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
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Xodimlar ro'yxati</h3>
          </template>

          <UTable :data="staff" :columns="columns" :loading="isLoading" :empty="'Xodimlar topilmadi'" />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                <span class="font-medium">{{ totalItems }}</span> ta xodim
              </div>

              <UPagination :model-value="page" :total="totalItems" :items-per-page="limit" show-last show-first
                @update:page="(p: number) => (page = p)" />
            </div>
          </template>
        </UCard>
      </div>

      <!-- QR Code Modal -->
      <UModal v-model:open="qrDialog" :ui="{ width: 'sm:max-w-[400px]' }">
        <template #header>
          <h3 class="text-lg font-semibold">Xodim QR kodi</h3>
        </template>

        <template #body>
          <div class="flex flex-col items-center justify-center p-4 gap-4">
            <div v-if="qrLoading" class="flex items-center justify-center h-64">
              <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
            </div>
            <template v-if="!qrLoading && qrDataUrl">
              <p class="font-medium text-center">
                {{ selectedStaffForQr?.first_name }} {{ selectedStaffForQr?.last_name }}
              </p>
              <img :src="qrDataUrl" alt="QR kod" class="max-w-full h-auto border rounded-lg shadow-sm" />
            </template>
            <p v-if="!qrLoading" class="text-sm text-gray-500 text-center">
              Ushbu QR kod xodim davomati uchun. Uni Telegram bot orqali skanerlash mumkin.
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

      <!-- Add Support Teacher Modal -->
      <UModal v-model:open="addDialog" :ui="{ width: 'sm:max-w-[425px]' }">
        <template #header>
          <h3 class="text-lg font-semibold">Yangi yordamchi o'qituvchi qo'shish</h3>
        </template>

        <template #body>
          <div class="space-y-4">
            <UFormField label="Ism" required>
              <UInput v-model="newStaff.first_name" placeholder="Ism" />
            </UFormField>

            <UFormField label="Familiya" required>
              <UInput v-model="newStaff.last_name" placeholder="Familiya" />
            </UFormField>

            <UFormField label="Login" required>
              <UInput v-model="newStaff.username" placeholder="Login" />
            </UFormField>

            <UFormField label="Telefon">
              <UInput v-model="newStaff.phone" v-maska data-maska="+998 ## ### ## ##"
                placeholder="+998 xx xxx xx xx" />
            </UFormField>

            <UFormField label="Parol" required>
              <UInput v-model="newStaff.password" :type="showPassword ? 'text' : 'password'" placeholder="Parol">
                <template #trailing>
                  <UButton variant="ghost" :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" size="xs"
                    @click="showPassword = !showPassword" />
                </template>
              </UInput>
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="subtle" label="Bekor qilish" @click="addDialog = false" />
            <UButton :label="isCreating ? 'Yaratilmoqda...' : 'Yaratish'" :loading="isCreating" @click="addStaff" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, h, resolveComponent } from "vue";
import type { TableColumn, NavigationMenuItem } from "@nuxt/ui";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import { useStaffAttendance } from "~/composables/useStaffAttendance";

definePageMeta({
  layout: "default",
  middleware: "auth",
});

const { apiService } = useAuth();
const { formatPhone } = usePhoneFormatter();
const { getTeacherStaticQr } = useStaffAttendance();
const toast = useToast();

const staffNavItems: NavigationMenuItem[] = [
  {
    label: "Davomat yozuvlari",
    icon: "i-lucide-fingerprint",
    to: "/staff-attendance",
  },
  {
    label: "Xodimlar",
    icon: "i-lucide-users",
    to: "/staff-attendance/staff",
  },
];

interface StaffRole {
  name: string;
}

interface StaffMember {
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  phone: string;
  is_active: boolean;
  roles?: StaffRole[];
  created_at?: string;
}

const UAvatar = resolveComponent("UAvatar");
const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");

const staff = ref<StaffMember[]>([]);
const search = ref("");
const isLoading = ref(false);

// Create state
const addDialog = ref(false);
const isCreating = ref(false);
const showPassword = ref(false);
const newStaff = ref({
  first_name: "",
  last_name: "",
  username: "",
  phone: "",
  password: "",
});

// QR state
const qrDialog = ref(false);
const qrLoading = ref(false);
const qrDataUrl = ref<string>("");
const selectedStaffForQr = ref<StaffMember | null>(null);

// Pagination
const page = ref(1);
const limit = ref(10);
const totalItems = ref(0);
const totalPages = ref(1);

const paginationStart = computed(() =>
  totalItems.value === 0 ? 0 : (page.value - 1) * limit.value + 1,
);
const paginationEnd = computed(() =>
  Math.min(page.value * limit.value, totalItems.value),
);

const roleLabels: Record<string, string> = {
  admin: "Admin",
  support_teacher: "Yordamchi o'qituvchi",
};

const columns: TableColumn<StaffMember>[] = [
  {
    accessorKey: "first_name",
    header: "Ism",
    cell: ({ row }) =>
      h("div", { class: "flex items-center gap-3" }, [
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
      ]),
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
    accessorKey: "roles",
    header: "Lavozim",
    cell: ({ row }) => {
      const roles = row.original.roles || [];
      if (!roles.length) return "—";
      return h(
        "div",
        { class: "flex flex-wrap gap-1" },
        roles.map((r) =>
          h(
            UBadge,
            {
              color: r.name === "admin" ? "primary" : "info",
              variant: "subtle",
            },
            () => roleLabels[r.name] || r.name,
          ),
        ),
      );
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) =>
      h(
        UBadge,
        {
          variant: row.original.is_active ? "solid" : "outline",
          color: row.original.is_active ? "primary" : "neutral",
        },
        () => (row.original.is_active ? "Faol" : "Faol emas"),
      ),
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) =>
      h("div", { class: "flex items-center gap-1" }, [
        h(UButton, {
          variant: "ghost",
          color: "neutral",
          icon: "i-lucide-clock",
          size: "sm",
          square: true,
          title: "Ish vaqti / profil",
          onClick: () => navigateTo(`/staff-attendance/staff/${row.original.user_id}`),
        }),
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-qr-code",
          size: "sm",
          square: true,
          title: "QR kod",
          onClick: () => showStaffQr(row.original),
        }),
      ]),
  },
];

async function loadStaff() {
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
      data: StaffMember[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, `/users/staff?${params.toString()}`);

    staff.value = response.data;
    totalItems.value = response.total;
    totalPages.value = response.totalPages;
  } catch (error: any) {
    console.error("Failed to load staff:", error);
    toast.add({
      title: "Xatolik",
      description: "Xodimlarni yuklashda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
}

function openAddDialog() {
  newStaff.value = {
    first_name: "",
    last_name: "",
    username: "",
    phone: "",
    password: "",
  };
  showPassword.value = false;
  addDialog.value = true;
}

async function addStaff() {
  try {
    isCreating.value = true;
    const data = {
      ...newStaff.value,
      phone: newStaff.value.phone ? newStaff.value.phone.replace(/\s+/g, "") : "",
    };
    await api.post(apiService.value, "/users/support-teachers", data);

    await loadStaff();

    toast.add({
      title: "Muvaffaqiyat",
      description: "Yordamchi o'qituvchi muvaffaqiyatli yaratildi",
      color: "success",
    });
    addDialog.value = false;
  } catch (error: any) {
    console.error("Failed to create support teacher:", error);
    toast.add({
      title: "Xatolik",
      description: error.message || "Yordamchi o'qituvchi yaratishda xatolik",
      color: "error",
    });
  } finally {
    isCreating.value = false;
  }
}

async function showStaffQr(member: StaffMember) {
  selectedStaffForQr.value = member;
  qrDataUrl.value = "";
  qrDialog.value = true;
  qrLoading.value = true;

  try {
    const data = await getTeacherStaticQr(member.user_id);
    if (data && data.bot_url) {
      const QRCodeModule = await import("qrcode");
      qrDataUrl.value = await QRCodeModule.toDataURL(data.bot_url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    }
  } catch (error) {
    console.error("Failed to generate QR:", error);
    toast.add({
      title: "Xatolik",
      description: "QR kodni yaratishda xatolik yuz berdi",
      color: "error",
    });
    qrDialog.value = false;
  } finally {
    qrLoading.value = false;
  }
}

async function downloadQr() {
  if (!qrDataUrl.value || !selectedStaffForQr.value) return;

  const fileName = `staff-qr-${selectedStaffForQr.value.username}.png`;
  const isTauri =
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

  if (isTauri) {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeFile } = await import("@tauri-apps/plugin-fs");

      const filePath = await save({
        filters: [{ name: "Image", extensions: ["png"] }],
        defaultPath: fileName,
      });

      if (filePath) {
        const parts = qrDataUrl.value.split(",");
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
          title: "Muvaffaqiyat",
          description: "QR kod muvaffaqiyatli saqlandi",
          color: "success",
        });
      }
    } catch (error) {
      console.error("Failed to save QR in Tauri:", error);
      toast.add({
        title: "Xatolik",
        description: "QR kodni saqlashda xatolik yuz berdi",
        color: "error",
      });
    }
  } else {
    const link = document.createElement("a");
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

onMounted(loadStaff);

// Debounce search
let searchTimeout: NodeJS.Timeout | null = null;
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1;
    loadStaff();
  }, 300);
});

watch(page, loadStaff);

watch(limit, () => {
  page.value = 1;
  loadStaff();
});
</script>
