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

            <div class="flex gap-2">
              <UBadge :color="profile ? 'success' : 'neutral'" variant="subtle" size="lg">
                {{ profile ? 'Profil sozlangan' : 'Profil yo\'q' }}
              </UBadge>
              <UButton v-if="!profile" icon="i-lucide-plus" size="sm" @click="ensureProfile">
                Profil yaratish
              </UButton>
              <UButton v-if="profile" color="error" variant="ghost" icon="i-lucide-trash-2" size="sm"
                :loading="isDeleting" @click="removeProfile">
                Profilni o'chirish
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Shifts management -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold">Ish smenalari</h3>
              <UButton icon="i-lucide-plus" size="sm" :disabled="!profile" @click="openAddShift">
                Smena qo'shish
              </UButton>
            </div>
          </template>

          <div v-if="!profile" class="py-6 text-center text-sm text-muted">
            Smena qo'shish uchun avval profil yarating.
          </div>

          <div v-else-if="shifts.length === 0 && !shiftsLoading" class="py-6 text-center text-sm text-muted">
            Hech qanday smena yo'q. "Smena qo'shish" tugmasini bosing.
          </div>

          <div v-else class="divide-y divide-default">
            <div v-if="shiftsLoading" class="flex justify-center py-8">
              <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-primary" />
            </div>

            <div v-for="shift in shifts" :key="shift.id"
              class="flex items-center justify-between py-3 px-1 gap-4">
              <div class="flex items-center gap-3 min-w-0">
                <UBadge v-if="shift.name" color="primary" variant="subtle" size="sm">
                  {{ shiftNameLabels[shift.name] || shift.name }}
                </UBadge>
                <UBadge :color="shift.is_active ? 'success' : 'neutral'" variant="subtle" size="sm">
                  {{ dayLabels[shift.day_of_week] || shift.day_of_week }}
                </UBadge>
                <div class="flex items-center gap-1 text-sm font-medium">
                  <UIcon name="i-lucide-log-in" class="size-4 text-green-500" />
                  {{ shift.in_time.slice(0, 5) }}
                  <span class="text-muted mx-1">—</span>
                  <UIcon name="i-lucide-log-out" class="size-4 text-red-400" />
                  {{ shift.out_time ? shift.out_time.slice(0, 5) : '?' }}
                </div>
                <span v-if="shift.grace_period_minutes > 0" class="text-xs text-muted">
                  +{{ shift.grace_period_minutes }} daq. chegirma
                </span>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="xs" square
                  @click="openEditShift(shift)" />
                <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="xs" square
                  @click="deleteShift(shift.id)" />
              </div>
            </div>
          </div>
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
              <UPagination :model-value="currentPage" :total="totalRecords" :items-per-page="limit"
                show-last show-first @update:page="(p: number) => (currentPage = p)" />
            </div>
          </template>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Add / Edit Shift Modal -->
  <UModal v-model:open="shiftDialog" :ui="{ width: 'sm:max-w-[440px]' }">
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ editingShift ? 'Smenani tahrirlash' : 'Yangi smena qo\'shish' }}
      </h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <UFormField label="Smena nomi">
          <USelectMenu v-model="shiftForm.name" :items="shiftNameOptions" value-key="value" class="w-full">
            <template #label>
              {{ shiftNameLabels[shiftForm.name] || '—' }}
            </template>
          </USelectMenu>
        </UFormField>

        <UFormField label="Kun" required>
          <USelectMenu v-model="shiftForm.day_of_week" :items="dayOptions" value-key="value" class="w-full">
            <template #label>
              {{ dayLabels[shiftForm.day_of_week] || shiftForm.day_of_week }}
            </template>
          </USelectMenu>
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Kirish vaqti" required>
            <UInput v-model="shiftForm.in_time" type="time" icon="i-lucide-log-in" class="w-full" />
          </UFormField>

          <UFormField label="Chiqish vaqti">
            <UInput v-model="shiftForm.out_time" type="time" icon="i-lucide-log-out" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Chegirma (daqiqa)">
          <UInput v-model.number="shiftForm.grace_period_minutes" type="number" min="0"
            placeholder="0" class="w-full" />
        </UFormField>

        <UFormField label="Holat">
          <div class="flex items-center gap-2">
            <USwitch v-model="shiftForm.is_active" />
            <span class="text-sm">{{ shiftForm.is_active ? 'Faol' : 'Faol emas' }}</span>
          </div>
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton color="neutral" variant="subtle" label="Bekor qilish" @click="shiftDialog = false" />
        <UButton :label="isSavingShift ? 'Saqlanmoqda...' : 'Saqlash'" :loading="isSavingShift"
          @click="saveShift" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, h, resolveComponent } from "vue";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import { useStaffAttendance } from "~/composables/useStaffAttendance";
import { useStaffProfile } from "~/composables/useStaffProfile";
import type {
  StaffProfile,
  StaffShift,
  DayOfWeek,
  ShiftName,
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
const {
  getProfileByStaffId,
  createProfile,
  deleteProfile,
  getShifts,
  addShift,
  updateShift,
  removeShift,
} = useStaffProfile();
const toast = useToast();

const UIcon = resolveComponent("UIcon");
const UAvatar = resolveComponent("UAvatar");
const UBadge = resolveComponent("UBadge");

interface StaffRole { name: string }
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
const shifts = ref<StaffShift[]>([]);
const isLoading = ref(false);
const isDeleting = ref(false);
const shiftsLoading = ref(false);

// Shift form
const shiftDialog = ref(false);
const isSavingShift = ref(false);
const editingShift = ref<StaffShift | null>(null);
const defaultShiftForm = () => ({
  name: "" as ShiftName | "",
  day_of_week: "every_day" as DayOfWeek,
  in_time: "09:00",
  out_time: "",
  grace_period_minutes: 0,
  is_active: true,
});
const shiftForm = ref(defaultShiftForm());

const dayLabels: Record<string, string> = {
  monday: "Dushanba",
  tuesday: "Seshanba",
  wednesday: "Chorshanba",
  thursday: "Payshanba",
  friday: "Juma",
  saturday: "Shanba",
  sunday: "Yakshanba",
  every_day: "Har kuni",
  odd: "Toq kunlar (D/Ch/J)",
  even: "Juft kunlar (S/P/Sh)",
};

const dayOptions = Object.entries(dayLabels).map(([value, label]) => ({ value, label }));

const shiftNameLabels: Record<string, string> = {
  morning: "Ertalabki",
  evening: "Kechki",
};

const shiftNameOptions = Object.entries(shiftNameLabels).map(([value, label]) => ({ value, label }));

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
const currentPage = usePaginationState("page", 1);
const limit = usePaginationState("limit", 10);
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
      h(UBadge, { color: row.original.type === "in" ? "info" : row.original.type === "absent" ? "error" : "neutral", variant: "subtle" },
        () => ({ in: "Kirish", out: "Chiqish", absent: "Kelmadi" }[row.original.type as string] ?? row.original.type),
      ),
  },
  {
    accessorKey: "group",
    header: "Guruh",
    cell: ({ row }: any) =>
      h(UBadge, { color: row.original.group ? "primary" : "neutral", variant: "subtle" },
        () => row.original.group?.name || "—",
      ),
  },
  {
    accessorKey: "status",
    header: "Holat",
    cell: ({ row }: any) =>
      h(UBadge, { color: getStatusColor(row.original.status), variant: "subtle" },
        () => getStatusLabel(row.original.status),
      ),
  },
  {
    accessorKey: "minutes_late",
    header: "Kechikish",
    cell: ({ row }: any) =>
      h("span",
        { class: row.original.minutes_late > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400" },
        row.original.minutes_late > 0 ? `${row.original.minutes_late} daq.` : "—",
      ),
  },
  {
    accessorKey: "fine_amount",
    header: "Jarima",
    cell: ({ row }: any) =>
      h("span",
        { class: row.original.fine_amount > 0 ? "font-medium text-red-600 dark:text-red-400" : "text-gray-400" },
        row.original.fine_amount > 0 ? formatMoney(row.original.fine_amount) : "—",
      ),
  },
];

// ---------------------------------------------------------------------------
// Profile actions
// ---------------------------------------------------------------------------

async function ensureProfile() {
  try {
    profile.value = await createProfile({ staff_id: staffId.value });
    await loadShifts();
    toast.add({ title: "Profil yaratildi", color: "success" });
  } catch (err: any) {
    toast.add({ title: "Xatolik", description: err.message, color: "error" });
  }
}

async function removeProfile() {
  if (!profile.value) return;
  isDeleting.value = true;
  try {
    await deleteProfile(profile.value.id);
    profile.value = null;
    shifts.value = [];
    toast.add({ title: "Profil o'chirildi", color: "success" });
  } catch (err: any) {
    toast.add({ title: "Xatolik", description: err.message, color: "error" });
  } finally {
    isDeleting.value = false;
  }
}

// ---------------------------------------------------------------------------
// Shift actions
// ---------------------------------------------------------------------------

function openAddShift() {
  editingShift.value = null;
  shiftForm.value = defaultShiftForm();
  shiftDialog.value = true;
}

function openEditShift(shift: StaffShift) {
  editingShift.value = shift;
  shiftForm.value = {
    name: shift.name ?? "",
    day_of_week: shift.day_of_week,
    in_time: shift.in_time.slice(0, 5),
    out_time: shift.out_time ? shift.out_time.slice(0, 5) : "",
    grace_period_minutes: shift.grace_period_minutes,
    is_active: shift.is_active,
  };
  shiftDialog.value = true;
}

async function saveShift() {
  if (!profile.value) return;
  isSavingShift.value = true;
  try {
    const payload = {
      name: shiftForm.value.name || undefined,
      day_of_week: shiftForm.value.day_of_week,
      in_time: shiftForm.value.in_time,
      out_time: shiftForm.value.out_time || undefined,
      grace_period_minutes: shiftForm.value.grace_period_minutes,
      is_active: shiftForm.value.is_active,
    };

    if (editingShift.value) {
      await updateShift(editingShift.value.id, payload);
    } else {
      await addShift(profile.value.id, payload);
    }

    await loadShifts();
    shiftDialog.value = false;
    toast.add({ title: "Smena saqlandi", color: "success" });
  } catch (err: any) {
    toast.add({ title: "Xatolik", description: err.message, color: "error" });
  } finally {
    isSavingShift.value = false;
  }
}

async function deleteShift(shiftId: string) {
  try {
    await removeShift(shiftId);
    shifts.value = shifts.value.filter((s) => s.id !== shiftId);
    toast.add({ title: "Smena o'chirildi", color: "success" });
  } catch (err: any) {
    toast.add({ title: "Xatolik", description: err.message, color: "error" });
  }
}

// ---------------------------------------------------------------------------
// Load helpers
// ---------------------------------------------------------------------------

async function loadStaff() {
  staff.value = await api.get<StaffMember>(apiService.value, `/users/${staffId.value}`);
}

async function loadProfile() {
  profile.value = await getProfileByStaffId(staffId.value);
}

async function loadShifts() {
  if (!profile.value) return;
  shiftsLoading.value = true;
  try {
    shifts.value = await getShifts(profile.value.id);
  } finally {
    shiftsLoading.value = false;
  }
}

async function loadAttendance() {
  recordsPending.value = true;
  try {
    const response = await getAllAttendances({ page: currentPage.value, limit: limit.value, teacherId: staffId.value });
    records.value = response.data || [];
    totalRecords.value = response.total || 0;
  } finally {
    recordsPending.value = false;
  }
}

async function loadAll() {
  isLoading.value = true;
  try {
    await Promise.all([loadStaff(), loadProfile()]);
    await Promise.all([loadShifts(), loadAttendance()]);
  } catch (err: any) {
    toast.add({ title: "Xatolik", description: err.message, color: "error" });
  } finally {
    isLoading.value = false;
  }
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

const formatDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });

const formatTashkentTime = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-GB", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit", hour12: false });
};

const formatMoney = (n: number) => `${n.toLocaleString("uz-UZ")} so'm`;

const getStatusColor = (s: StaffAttendanceStatus) =>
  ({ early: "info", on_time: "success", late: "error", excused: "warning" }[s] || "neutral");

const getStatusLabel = (s: StaffAttendanceStatus) =>
  ({ early: "Erta", on_time: "O'z vaqtida", late: "Kech", excused: "Ruxsatli" }[s] || s);

watch(currentPage, loadAttendance);
onMounted(loadAll);
</script>
