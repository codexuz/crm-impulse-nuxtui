<template>
  <UDashboardPanel id="staff-permissions">
    <template #header>
      <UDashboardNavbar title="" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UNavigationMenu :items="staffNavItems" highlight />
        </template>

        <template #description>
          Xodimlar uchun ruxsatlar — kelmaslik, kech kelish yoki erta ketishga
        </template>

        <template #right>
          <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" :loading="isLoading" @click="load">
            Yangilash
          </UButton>
          <UButton icon="i-lucide-plus" label="Yangi ruxsat" @click="openAdd" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <USelectMenu v-model="filters.status" :items="statusFilterOptions" value-key="value" class="w-44">
            <template #label>
              {{ statusFilterOptions.find((s) => s.value === filters.status)?.label || "Holat" }}
            </template>
          </USelectMenu>
          <USelectMenu v-model="filters.type" :items="typeFilterOptions" value-key="value" class="w-44">
            <template #label>
              {{ typeFilterOptions.find((t) => t.value === filters.type)?.label || "Turi" }}
            </template>
          </USelectMenu>
        </template>
        <template #right>
          <UInput v-model="filters.date" type="date" class="w-44" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div v-if="isLoading && !items.length" class="flex justify-center py-20">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
      </div>

      <div v-else class="space-y-4">
        <UCard v-for="p in items" :key="p.id">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <!-- Left -->
            <div class="space-y-2 min-w-0">
              <div class="flex flex-wrap gap-2 items-center">
                <UBadge :color="statusColor(p.status)" variant="solid" size="sm">
                  {{ statusLabel(p.status) }}
                </UBadge>
                <UBadge :color="typeColor(p.type)" variant="subtle" size="sm">
                  {{ typeLabel(p.type) }}
                </UBadge>
                <span class="text-sm font-medium">
                  {{ staffName(p) }}
                </span>
              </div>

              <div class="flex flex-wrap gap-4 text-sm">
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-calendar" class="size-4 text-muted" />
                  <span class="font-medium">
                    {{ formatDate(p.start_date) }}<template v-if="p.end_date !== p.start_date"> → {{ formatDate(p.end_date) }}</template>
                  </span>
                </div>
                <div v-if="p.permitted_time" class="flex items-center gap-1">
                  <UIcon name="i-lucide-clock" class="size-4 text-muted" />
                  <span class="text-muted">Ruxsat vaqti:</span>
                  <span class="font-medium">{{ p.permitted_time }}</span>
                </div>
              </div>

              <p v-if="p.reason" class="text-sm text-muted">
                <span class="font-medium text-default">Sabab:</span> {{ p.reason }}
              </p>
              <p v-if="p.review_note" class="text-xs text-muted">
                <span class="font-medium">Izoh:</span> {{ p.review_note }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 shrink-0">
              <template v-if="p.status === 'pending'">
                <UButton color="success" variant="soft" icon="i-lucide-check" size="sm"
                  @click="openReview(p, 'approved')">
                  Tasdiqlash
                </UButton>
                <UButton color="error" variant="soft" icon="i-lucide-x" size="sm"
                  @click="openReview(p, 'rejected')">
                  Rad etish
                </UButton>
                <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="sm" square
                  title="Tahrirlash" @click="openEdit(p)" />
              </template>
              <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="sm" square
                title="O'chirish" :loading="deletingId === p.id" @click="remove(p.id)" />
            </div>
          </div>
        </UCard>

        <div v-if="!isLoading && items.length === 0"
          class="flex flex-col items-center justify-center py-20 gap-3 text-muted">
          <UIcon name="i-lucide-calendar-off" class="size-12 opacity-30" />
          <p>Ruxsatlar topilmadi. "Yangi ruxsat" tugmasini bosing.</p>
        </div>

        <div v-if="totalItems > limit" class="flex items-center justify-between pt-4">
          <div class="text-sm text-muted">
            Jami <span class="font-medium">{{ totalItems }}</span> ta ruxsat
          </div>
          <UPagination :model-value="page" :total="totalItems" :items-per-page="limit" show-last show-first
            @update:page="(p: number) => { page = p; load() }" />
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Add / Edit Modal -->
  <UModal v-model:open="dialog" :ui="{ width: 'sm:max-w-[520px]' }">
    <template #header>
      <h3 class="text-lg font-semibold">{{ editing ? 'Ruxsatni tahrirlash' : 'Yangi ruxsat' }}</h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <UFormField label="Xodim" required>
          <USelectMenu v-model="form.staff_id" :items="staffOptions" value-key="value"
            :loading="staffLoading" placeholder="Xodimni tanlang" searchable class="w-full">
            <template #label>
              {{ staffOptions.find((s) => s.value === form.staff_id)?.label || 'Xodimni tanlang' }}
            </template>
          </USelectMenu>
        </UFormField>

        <UFormField label="Ruxsat turi" required>
          <USelectMenu v-model="form.type" :items="typeOptions" value-key="value" class="w-full">
            <template #label>
              {{ typeOptions.find((t) => t.value === form.type)?.label }}
            </template>
          </USelectMenu>
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Boshlanish sanasi" required>
            <UInput v-model="form.start_date" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Tugash sanasi">
            <UInput v-model="form.end_date" type="date" class="w-full" />
          </UFormField>
        </div>

        <UFormField v-if="form.type !== 'full_day'"
          :label="form.type === 'late_arrival' ? 'Ruxsat etilgan kelish vaqti' : 'Ruxsat etilgan chiqish vaqti'" required>
          <UInput v-model="form.permitted_time" type="time" class="w-full" />
        </UFormField>

        <UFormField label="Sabab">
          <UTextarea v-model="form.reason" :rows="3" placeholder="Ruxsat sababi..." class="w-full" />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton color="neutral" variant="subtle" label="Bekor qilish" @click="dialog = false" />
        <UButton :label="isSaving ? 'Saqlanmoqda...' : 'Saqlash'" :loading="isSaving" @click="save" />
      </div>
    </template>
  </UModal>

  <!-- Review Modal -->
  <UModal v-model:open="reviewDialog" :ui="{ width: 'sm:max-w-[460px]' }">
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ reviewDecision === 'approved' ? 'Ruxsatni tasdiqlash' : 'Ruxsatni rad etish' }}
      </h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <p v-if="reviewTarget" class="text-sm text-muted">
          <span class="font-medium text-default">{{ staffName(reviewTarget) }}</span> —
          {{ typeLabel(reviewTarget.type) }},
          {{ formatDate(reviewTarget.start_date) }}<template v-if="reviewTarget.end_date !== reviewTarget.start_date"> → {{ formatDate(reviewTarget.end_date) }}</template>
        </p>
        <UFormField label="Izoh (ixtiyoriy)">
          <UTextarea v-model="reviewNote" :rows="2" placeholder="Qaror izohi..." class="w-full" />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton color="neutral" variant="subtle" label="Bekor qilish" @click="reviewDialog = false" />
        <UButton :color="reviewDecision === 'approved' ? 'success' : 'error'"
          :label="isReviewing ? 'Saqlanmoqda...' : (reviewDecision === 'approved' ? 'Tasdiqlash' : 'Rad etish')"
          :loading="isReviewing" @click="submitReview" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import type { NavigationMenuItem } from "@nuxt/ui";
import { useStaffAttendance } from "~/composables/useStaffAttendance";
import { useAuth } from "~/composables/useAuth";
import { api } from "~/lib/api";
import type {
  StaffPermission,
  StaffPermissionType,
  StaffPermissionStatus,
  CreateStaffPermissionDto,
} from "~/types/attendance";

definePageMeta({ layout: "default", middleware: "auth" });

const {
  getPermissions,
  createPermission,
  updatePermission,
  reviewPermission,
  deletePermission,
} = useStaffAttendance();
const { apiService } = useAuth();
const toast = useToast();

const staffNavItems: NavigationMenuItem[] = [
  { label: "Davomat yozuvlari", icon: "i-lucide-fingerprint", to: "/staff-attendance" },
  { label: "Xodimlar", icon: "i-lucide-users", to: "/staff-attendance/staff" },
  { label: "Hisobot", icon: "i-lucide-bar-chart-2", to: "/staff-attendance/summary" },
  { label: "Ruxsatlar", icon: "i-lucide-calendar-check", to: "/staff-attendance/permissions" },
  { label: "Jarima qoidalari", icon: "i-lucide-shield-alert", to: "/staff-attendance/policies" },
];

// ---------------------------------------------------------------------------
// Labels / colors
// ---------------------------------------------------------------------------

const typeOptions = [
  { value: "full_day", label: "Kelmaslik (to'liq kun)" },
  { value: "late_arrival", label: "Kech kelish" },
  { value: "early_leave", label: "Erta ketish" },
];

const typeFilterOptions = [{ value: "all", label: "Barcha turlar" }, ...typeOptions];

const statusFilterOptions = [
  { value: "all", label: "Barcha holatlar" },
  { value: "pending", label: "Kutilmoqda" },
  { value: "approved", label: "Tasdiqlangan" },
  { value: "rejected", label: "Rad etilgan" },
];

const typeLabel = (t: StaffPermissionType) =>
  typeOptions.find((o) => o.value === t)?.label || t;
const typeColor = (t: StaffPermissionType) =>
  t === "full_day" ? "warning" : t === "late_arrival" ? "info" : "primary";

const statusLabel = (s: StaffPermissionStatus) =>
  ({ pending: "Kutilmoqda", approved: "Tasdiqlangan", rejected: "Rad etilgan" })[s] || s;
const statusColor = (s: StaffPermissionStatus) =>
  ({ pending: "warning", approved: "success", rejected: "error" })[s] || "neutral";

const staffName = (p: StaffPermission) =>
  p.staff ? `${p.staff.first_name} ${p.staff.last_name}`.trim() : "—";

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

const items = ref<StaffPermission[]>([]);
const isLoading = ref(false);
const deletingId = ref<string | null>(null);
const page = ref(1);
const limit = ref(20);
const totalItems = ref(0);

const filters = ref({ status: "all" as string, type: "all" as string, date: "" as string });

async function load() {
  isLoading.value = true;
  try {
    const res = await getPermissions({
      page: page.value,
      limit: limit.value,
      status: (filters.value.status === "all" ? undefined : filters.value.status) as any,
      type: (filters.value.type === "all" ? undefined : filters.value.type) as any,
      date: filters.value.date || undefined,
    });
    items.value = res.data;
    totalItems.value = res.total;
  } catch (err: any) {
    toast.add({ title: "Xatolik", description: err.message, color: "error" });
  } finally {
    isLoading.value = false;
  }
}

watch(
  [() => filters.value.status, () => filters.value.type, () => filters.value.date],
  () => { page.value = 1; load(); },
);

// ---------------------------------------------------------------------------
// Staff picker
// ---------------------------------------------------------------------------

const staffOptions = ref<{ value: string; label: string }[]>([]);
const staffLoading = ref(false);

async function loadStaff() {
  staffLoading.value = true;
  try {
    const res = await api.get<{ data: any[] }>(apiService.value, "/users/staff?page=1&limit=200");
    staffOptions.value = (res.data || []).map((s) => ({
      value: s.user_id,
      label: `${s.first_name} ${s.last_name} (@${s.username})`,
    }));
  } catch {
    // leave empty
  } finally {
    staffLoading.value = false;
  }
}

// ---------------------------------------------------------------------------
// Add / Edit
// ---------------------------------------------------------------------------

const dialog = ref(false);
const isSaving = ref(false);
const editing = ref<StaffPermission | null>(null);

const defaultForm = () => ({
  staff_id: "",
  type: "full_day" as StaffPermissionType,
  start_date: "",
  end_date: "",
  permitted_time: "",
  reason: "",
});

const form = ref(defaultForm());

function openAdd() {
  editing.value = null;
  form.value = defaultForm();
  dialog.value = true;
}

function openEdit(p: StaffPermission) {
  editing.value = p;
  form.value = {
    staff_id: p.staff_id,
    type: p.type,
    start_date: p.start_date,
    end_date: p.end_date === p.start_date ? "" : p.end_date,
    permitted_time: p.permitted_time ?? "",
    reason: p.reason ?? "",
  };
  dialog.value = true;
}

async function save() {
  if (!form.value.staff_id) {
    toast.add({ title: "Xodimni tanlang", color: "warning" });
    return;
  }
  if (!form.value.start_date) {
    toast.add({ title: "Boshlanish sanasini kiriting", color: "warning" });
    return;
  }
  if (form.value.type !== "full_day" && !form.value.permitted_time) {
    toast.add({ title: "Ruxsat vaqtini kiriting", color: "warning" });
    return;
  }

  isSaving.value = true;
  try {
    const payload: CreateStaffPermissionDto = {
      staff_id: form.value.staff_id,
      type: form.value.type,
      start_date: form.value.start_date,
      end_date: form.value.end_date || undefined,
      permitted_time: form.value.type === "full_day" ? undefined : form.value.permitted_time,
      reason: form.value.reason || undefined,
    };

    if (editing.value) {
      await updatePermission(editing.value.id, payload);
    } else {
      await createPermission(payload);
      page.value = 1;
    }
    dialog.value = false;
    toast.add({ title: "Ruxsat saqlandi", color: "success" });
    await load();
  } catch (err: any) {
    toast.add({ title: "Xatolik", description: err.message, color: "error" });
  } finally {
    isSaving.value = false;
  }
}

// ---------------------------------------------------------------------------
// Review (approve / reject)
// ---------------------------------------------------------------------------

const reviewDialog = ref(false);
const isReviewing = ref(false);
const reviewTarget = ref<StaffPermission | null>(null);
const reviewDecision = ref<"approved" | "rejected">("approved");
const reviewNote = ref("");

function openReview(p: StaffPermission, decision: "approved" | "rejected") {
  reviewTarget.value = p;
  reviewDecision.value = decision;
  reviewNote.value = "";
  reviewDialog.value = true;
}

async function submitReview() {
  if (!reviewTarget.value) return;
  isReviewing.value = true;
  try {
    await reviewPermission(reviewTarget.value.id, {
      status: reviewDecision.value,
      review_note: reviewNote.value || undefined,
    });
    reviewDialog.value = false;
    toast.add({
      title: reviewDecision.value === "approved" ? "Tasdiqlandi" : "Rad etildi",
      color: "success",
    });
    await load();
  } catch (err: any) {
    toast.add({ title: "Xatolik", description: err.message, color: "error" });
  } finally {
    isReviewing.value = false;
  }
}

async function remove(id: string) {
  deletingId.value = id;
  try {
    await deletePermission(id);
    toast.add({ title: "Ruxsat o'chirildi", color: "success" });
    await load();
  } catch (err: any) {
    toast.add({ title: "Xatolik", description: err.message, color: "error" });
  } finally {
    deletingId.value = null;
  }
}

onMounted(() => { load(); loadStaff(); });
</script>
