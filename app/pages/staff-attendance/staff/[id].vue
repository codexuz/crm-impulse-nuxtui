<template>
  <UDashboardPanel id="staff-profile">
    <template #header>
      <UDashboardNavbar title="Xodim profili" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" @click="useRouter().back()" />
        </template>

        <template #right>
          <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" :loading="isLoading" @click="loadAll">
            Yangilash
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="isLoading && !staff" class="flex items-center justify-center py-20">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
      </div>

      <div v-else class="space-y-6">
        <!-- Profile header -->
        <UCard>
          <div class="flex flex-col md:flex-row md:items-center gap-6">
            <div class="flex items-center gap-4 flex-1">
              <UAvatar :src="staff?.avatar_url || undefined"
                :alt="`${staff?.first_name || ''} ${staff?.last_name || ''}`" size="2xl">
                <template #fallback>
                  <span class="text-xl font-semibold">{{ initials }}</span>
                </template>
              </UAvatar>

              <div class="space-y-2">
                <h2 class="text-xl font-bold">
                  {{ staff?.first_name }} {{ staff?.last_name }}
                </h2>
                <div class="flex items-center gap-3 text-sm text-muted">
                  <span v-if="staff?.username">@{{ staff?.username }}</span>
                  <span v-if="staff?.phone">{{ formatPhone(staff.phone) }}</span>
                </div>
                <div v-if="roles.length" class="flex flex-wrap gap-1">
                  <UBadge v-for="r in roles" :key="r" :color="r === 'admin' ? 'primary' : 'info'" variant="subtle">
                    {{ roleLabels[r] || r }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Work time (staff profile) -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold">Ish vaqti</h3>
              <UBadge :color="profile ? 'success' : 'neutral'" variant="subtle">
                {{ profile ? 'Sozlangan' : 'Sozlanmagan' }}
              </UBadge>
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-sm text-muted">
              Davomat uchun kutilayotgan kelish va ketish vaqtlari. Kelish vaqtiga nisbatan kechikish jarima hisoblanadi.
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Kelish vaqti (kirish)">
                <UInput v-model="form.in_time" type="time" icon="i-lucide-log-in" class="w-full" />
              </UFormField>

              <UFormField label="Ketish vaqti (chiqish)">
                <UInput v-model="form.out_time" type="time" icon="i-lucide-log-out" class="w-full" />
              </UFormField>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton v-if="profile" color="error" variant="ghost" icon="i-lucide-trash-2"
                :label="isDeleting ? 'O\'chirilmoqda...' : 'Tozalash'" :loading="isDeleting" @click="removeProfile" />
              <UButton icon="i-lucide-save" :label="isSaving ? 'Saqlanmoqda...' : 'Saqlash'" :loading="isSaving"
                @click="saveProfile" />
            </div>
          </template>
        </UCard>

        <!-- Attendance history -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Davomat tarixi</h3>
          </template>

          <UTable :data="records" :columns="columns" :loading="recordsPending" :empty="'Davomat yozuvlari topilmadi'" />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                Jami <span class="font-medium">{{ totalRecords }}</span> ta yozuv
              </div>
              <UPagination :model-value="currentPage" :total="totalRecords" :items-per-page="limit" show-last show-first
                @update:page="(p: number) => (currentPage = p)" />
            </div>
          </template>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, h, resolveComponent } from "vue";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import { useStaffAttendance } from "~/composables/useStaffAttendance";
import { useStaffProfile } from "~/composables/useStaffProfile";
import type {
  StaffProfile,
  StaffAttendanceRecord,
  StaffAttendanceStatus,
} from "~/types/attendance";

definePageMeta({
  layout: "default",
  middleware: "auth",
});

const route = useRoute();
const staffId = computed(() => route.params.id as string);

const { apiService } = useAuth();
const { formatPhone } = usePhoneFormatter();
const { getAllAttendances } = useStaffAttendance();
const { getProfileByStaffId, createProfile, updateProfile, deleteProfile } =
  useStaffProfile();
const toast = useToast();

const UIcon = resolveComponent("UIcon");
const UAvatar = resolveComponent("UAvatar");
const UBadge = resolveComponent("UBadge");

interface StaffRole {
  name: string;
}
interface StaffMember {
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  phone: string;
  avatar_url?: string | null;
  is_active?: boolean;
  roles?: StaffRole[];
}

const staff = ref<StaffMember | null>(null);
const profile = ref<StaffProfile | null>(null);
const isLoading = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);

const form = ref<{ in_time: string; out_time: string }>({
  in_time: "",
  out_time: "",
});

const roleLabels: Record<string, string> = {
  admin: "Admin",
  support_teacher: "Yordamchi o'qituvchi",
  teacher: "O'qituvchi",
};

const roles = computed(() => (staff.value?.roles || []).map((r) => r.name));

const initials = computed(() => {
  const first = staff.value?.first_name?.charAt(0) || "";
  const last = staff.value?.last_name?.charAt(0) || "";
  return (first + last).toUpperCase() || "?";
});

// Attendance history
const records = ref<StaffAttendanceRecord[]>([]);
const totalRecords = ref(0);
const currentPage = ref(1);
const limit = ref(10);
const recordsPending = ref(false);

const columns = [
  {
    accessorKey: "date",
    header: "Sana",
    cell: ({ row }: any) =>
      h("div", { class: "flex items-center gap-2" }, [
        h(UIcon, { name: "i-heroicons-calendar-days", class: "w-4 h-4 text-gray-400" }),
        h("span", { class: "font-medium" }, formatDate(row.original.date)),
      ]),
  },
  {
    accessorKey: "createdAt",
    header: "Vaqt",
    cell: ({ row }: any) =>
      h("div", { class: "flex items-center gap-2" }, [
        h(UIcon, { name: "i-heroicons-clock", class: "w-4 h-4 text-gray-400" }),
        h("span", { class: "font-medium" }, formatTashkentTime(row.original.createdAt)),
      ]),
  },
  {
    accessorKey: "type",
    header: "Turi",
    cell: ({ row }: any) =>
      h(
        UBadge,
        { color: row.original.type === "in" ? "info" : "neutral", variant: "subtle" },
        () => (row.original.type === "in" ? "Kirish" : "Chiqish"),
      ),
  },
  {
    accessorKey: "group",
    header: "Guruh",
    cell: ({ row }: any) =>
      h(
        UBadge,
        { color: row.original.group ? "primary" : "neutral", variant: "subtle" },
        () => row.original.group?.name || "—",
      ),
  },
  {
    accessorKey: "status",
    header: "Holat",
    cell: ({ row }: any) =>
      h(
        UBadge,
        { color: getStatusColor(row.original.status), variant: "subtle" },
        () => getStatusLabel(row.original.status),
      ),
  },
  {
    accessorKey: "minutes_late",
    header: "Kechikish",
    cell: ({ row }: any) =>
      h(
        "span",
        { class: row.original.minutes_late > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400" },
        row.original.minutes_late > 0 ? `${row.original.minutes_late} daq.` : "—",
      ),
  },
  {
    accessorKey: "fine_amount",
    header: "Jarima",
    cell: ({ row }: any) =>
      h(
        "span",
        {
          class: row.original.fine_amount > 0
            ? "font-medium text-red-600 dark:text-red-400"
            : "text-gray-400",
        },
        row.original.fine_amount > 0 ? formatMoney(row.original.fine_amount) : "—",
      ),
  },
];

// Normalize a "HH:MM:SS" or "HH:MM" string to the "HH:MM" a time input expects.
function toInputTime(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 5);
}

async function loadStaff() {
  try {
    staff.value = await api.get<StaffMember>(apiService.value, `/users/${staffId.value}`);
  } catch (err: any) {
    toast.add({
      title: "Xatolik",
      description: err.message || "Xodim ma'lumotini yuklashda xatolik",
      color: "error",
    });
  }
}

async function loadProfile() {
  try {
    profile.value = await getProfileByStaffId(staffId.value);
    form.value.in_time = toInputTime(profile.value?.in_time);
    form.value.out_time = toInputTime(profile.value?.out_time);
  } catch (err: any) {
    toast.add({
      title: "Xatolik",
      description: err.message || "Ish vaqtini yuklashda xatolik",
      color: "error",
    });
  }
}

async function loadAttendance() {
  recordsPending.value = true;
  try {
    const response = await getAllAttendances({
      page: currentPage.value,
      limit: limit.value,
      teacherId: staffId.value,
    });
    records.value = response.data || [];
    totalRecords.value = response.total || 0;
  } catch (err: any) {
    toast.add({
      title: "Xatolik",
      description: err.message || "Davomat tarixini yuklashda xatolik",
      color: "error",
    });
  } finally {
    recordsPending.value = false;
  }
}

async function loadAll() {
  isLoading.value = true;
  try {
    await Promise.all([loadStaff(), loadProfile(), loadAttendance()]);
  } finally {
    isLoading.value = false;
  }
}

async function saveProfile() {
  isSaving.value = true;
  try {
    const payload = {
      in_time: form.value.in_time || undefined,
      out_time: form.value.out_time || undefined,
    };

    if (profile.value) {
      profile.value = await updateProfile(profile.value.id, payload);
    } else {
      profile.value = await createProfile({
        staff_id: staffId.value,
        ...payload,
      });
    }

    form.value.in_time = toInputTime(profile.value?.in_time);
    form.value.out_time = toInputTime(profile.value?.out_time);

    toast.add({
      title: "Muvaffaqiyat",
      description: "Ish vaqti saqlandi",
      color: "success",
    });
  } catch (err: any) {
    toast.add({
      title: "Xatolik",
      description: err.message || "Ish vaqtini saqlashda xatolik",
      color: "error",
    });
  } finally {
    isSaving.value = false;
  }
}

async function removeProfile() {
  if (!profile.value) return;
  isDeleting.value = true;
  try {
    await deleteProfile(profile.value.id);
    profile.value = null;
    form.value.in_time = "";
    form.value.out_time = "";
    toast.add({
      title: "Muvaffaqiyat",
      description: "Ish vaqti tozalandi",
      color: "success",
    });
  } catch (err: any) {
    toast.add({
      title: "Xatolik",
      description: err.message || "Ish vaqtini o'chirishda xatolik",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
}

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatTashkentTime = (dateString: string): string => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleTimeString("en-GB", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatMoney = (amount: number): string =>
  `${amount.toLocaleString("uz-UZ")} so'm`;

const getStatusColor = (status: StaffAttendanceStatus) => {
  const colors: Record<string, string> = {
    early: "info",
    on_time: "success",
    late: "error",
  };
  return colors[status] || "neutral";
};

const getStatusLabel = (status: StaffAttendanceStatus) => {
  const labels: Record<string, string> = {
    early: "Erta",
    on_time: "O'z vaqtida",
    late: "Kech",
  };
  return labels[status] || status;
};

watch(currentPage, loadAttendance);

onMounted(loadAll);
</script>
