<template>
  <UDashboardPanel id="attendance-policies">
    <template #header>
      <UDashboardNavbar title="" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UNavigationMenu :items="staffNavItems" highlight />
        </template>

        <template #description>
          Kechikish jarimalari uchun qoidalar (global va filial/lavozim bo'yicha)
        </template>

        <template #right>
          <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" :loading="isLoading"
            @click="load">
            Yangilash
          </UButton>
          <UButton icon="i-lucide-plus" label="Yangi qoida" @click="openAdd" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="isLoading && !policies.length" class="flex justify-center py-20">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
      </div>

      <div v-else class="space-y-4">
        <UCard v-for="policy in policies" :key="policy.id">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <!-- Left: scope badges + date range -->
            <div class="space-y-2 min-w-0">
              <div class="flex flex-wrap gap-2 items-center">
                <UBadge :color="policy.is_active ? 'success' : 'neutral'" variant="solid" size="sm">
                  {{ policy.is_active ? 'Faol' : 'Faol emas' }}
                </UBadge>
                <UBadge color="neutral" variant="subtle" size="sm">
                  {{ policy.branch_id ? `Filial: ${policy.branch_id.slice(0, 8)}…` : 'Global' }}
                </UBadge>
                <UBadge color="neutral" variant="subtle" size="sm">
                  {{ policy.role ? `Lavozim: ${policy.role}` : 'Barcha lavozimlar' }}
                </UBadge>
                <span v-if="policy.effective_from || policy.effective_to" class="text-xs text-muted">
                  {{ policy.effective_from || '—' }} → {{ policy.effective_to || '—' }}
                </span>
              </div>

              <!-- Fine tiers -->
              <div class="flex flex-wrap gap-4 text-sm">
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-clock" class="size-4 text-muted" />
                  <span class="text-muted">Chegirma:</span>
                  <span class="font-medium">{{ policy.grace_period_minutes }} daq.</span>
                </div>
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-triangle-alert" class="size-4 text-yellow-500" />
                  <span class="text-muted">1-daraja (≤{{ policy.fine_tier1_max_minutes }} daq):</span>
                  <span class="font-medium text-yellow-600 dark:text-yellow-400">
                    {{ formatMoney(policy.fine_tier1_amount) }}
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide-circle-alert" class="size-4 text-red-500" />
                  <span class="text-muted">2-daraja (>{{ policy.fine_tier1_max_minutes }} daq):</span>
                  <span class="font-medium text-red-600 dark:text-red-400">
                    {{ formatMoney(policy.fine_tier2_amount) }}
                  </span>
                </div>
                <div v-if="policy.max_fine_per_day > 0" class="flex items-center gap-1">
                  <UIcon name="i-lucide-shield" class="size-4 text-muted" />
                  <span class="text-muted">Kunlik chek:</span>
                  <span class="font-medium">{{ formatMoney(policy.max_fine_per_day) }}</span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 shrink-0">
              <UButton variant="ghost" color="neutral" icon="i-lucide-pencil" size="sm"
                @click="openEdit(policy)">
                Tahrirlash
              </UButton>
              <UButton variant="ghost" color="error" icon="i-lucide-trash-2" size="sm"
                :loading="deletingId === policy.id" @click="remove(policy.id)">
                O'chirish
              </UButton>
            </div>
          </div>
        </UCard>

        <div v-if="!isLoading && policies.length === 0"
          class="flex flex-col items-center justify-center py-20 gap-3 text-muted">
          <UIcon name="i-lucide-shield-off" class="size-12 opacity-30" />
          <p>Hech qanday qoida topilmadi. "Yangi qoida" tugmasini bosing.</p>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Add / Edit Policy Modal -->
  <UModal v-model:open="dialog" :ui="{ width: 'sm:max-w-[520px]' }">
    <template #header>
      <h3 class="text-lg font-semibold">
        {{ editing ? 'Qoidani tahrirlash' : 'Yangi qoida' }}
      </h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Lavozim (ixtiyoriy)">
            <USelectMenu v-model="roleSelect" :items="roleOptions" class="w-full" />
          </UFormField>

          <UFormField label="Chegirma (daqiqa)">
            <UInput v-model.number="form.grace_period_minutes" type="number" min="0" placeholder="0" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <UFormField label="1-daraja jarima">
            <UInput v-model.number="form.fine_tier1_amount" type="number" min="0" placeholder="100000" class="w-full" />
          </UFormField>
          <UFormField label="1-daraja chegarasi (daq)">
            <UInput v-model.number="form.fine_tier1_max_minutes" type="number" min="1" placeholder="10" class="w-full" />
          </UFormField>
          <UFormField label="2-daraja jarima">
            <UInput v-model.number="form.fine_tier2_amount" type="number" min="0" placeholder="200000" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Kunlik jarima cheki (0 = chegarasiz)">
          <UInput v-model.number="form.max_fine_per_day" type="number" min="0" placeholder="0" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Boshlanish sanasi">
            <UInput v-model="form.effective_from" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Tugash sanasi">
            <UInput v-model="form.effective_to" type="date" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Holat">
          <div class="flex items-center gap-2">
            <USwitch v-model="form.is_active" />
            <span class="text-sm">{{ form.is_active ? 'Faol' : 'Faol emas' }}</span>
          </div>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { NavigationMenuItem } from "@nuxt/ui";
import { useStaffAttendance } from "~/composables/useStaffAttendance";
import { useAuth } from "~/composables/useAuth";
import { api } from "~/lib/api";
import type { AttendancePolicy, AttendancePolicyDto } from "~/types/attendance";

definePageMeta({ layout: "default", middleware: "auth" });

const { getPolicies, createPolicy, updatePolicy, deletePolicy } = useStaffAttendance();
const { apiService } = useAuth();
const toast = useToast();

const staffNavItems: NavigationMenuItem[] = [
  { label: "Davomat yozuvlari", icon: "i-lucide-fingerprint", to: "/staff-attendance" },
  { label: "Xodimlar", icon: "i-lucide-users", to: "/staff-attendance/staff" },
  { label: "Hisobot", icon: "i-lucide-bar-chart-2", to: "/staff-attendance/summary" },
  { label: "Jarima qoidalari", icon: "i-lucide-shield-alert", to: "/staff-attendance/policies" },
];

// Roles loaded from API
const dbRoles = ref<{ id: string; name: string }[]>([]);

// Plain string items — avoids USelectMenu crashing on empty-string value-key
const ALL_ROLES_SENTINEL = "— Barcha lavozimlar —";

const roleOptions = computed(() => [
  ALL_ROLES_SENTINEL,
  ...dbRoles.value.map((r) => r.name),
]);

// roleSelect bridges between the sentinel string and form.role (empty = global)
const roleSelect = computed({
  get: () => form.value.role || ALL_ROLES_SENTINEL,
  set: (val: string) => { form.value.role = val === ALL_ROLES_SENTINEL ? '' : val; },
});

async function loadRoles() {
  try {
    const data = await api.get<any>(apiService.value, "/users/roles");
    dbRoles.value = Array.isArray(data) ? data : data?.data || [];
  } catch {
    // fallback: leave empty, hardcoded label will show role name as-is
  }
}

const policies = ref<AttendancePolicy[]>([]);
const isLoading = ref(false);
const deletingId = ref<string | null>(null);

const dialog = ref(false);
const isSaving = ref(false);
const editing = ref<AttendancePolicy | null>(null);

const defaultForm = () => ({
  role: '' as string,
  grace_period_minutes: 0,
  fine_tier1_amount: 100000,
  fine_tier1_max_minutes: 10,
  fine_tier2_amount: 200000,
  max_fine_per_day: 0,
  effective_from: '' as string,
  effective_to: '' as string,
  is_active: true,
});

const form = ref(defaultForm());

async function load() {
  isLoading.value = true;
  try {
    policies.value = await getPolicies();
  } catch (err: any) {
    toast.add({ title: "Xatolik", description: err.message, color: "error" });
  } finally {
    isLoading.value = false;
  }
}

function openAdd() {
  editing.value = null;
  form.value = defaultForm();
  dialog.value = true;
}

function openEdit(policy: AttendancePolicy) {
  editing.value = policy;
  form.value = {
    role: policy.role ?? '',
    grace_period_minutes: policy.grace_period_minutes,
    fine_tier1_amount: policy.fine_tier1_amount,
    fine_tier1_max_minutes: policy.fine_tier1_max_minutes,
    fine_tier2_amount: policy.fine_tier2_amount,
    max_fine_per_day: policy.max_fine_per_day,
    effective_from: policy.effective_from ?? '',
    effective_to: policy.effective_to ?? '',
    is_active: policy.is_active,
  };
  dialog.value = true;
}

async function save() {
  isSaving.value = true;
  try {
    const payload: AttendancePolicyDto = {
      ...form.value,
      role: form.value.role || undefined,
      effective_from: form.value.effective_from || undefined,
      effective_to: form.value.effective_to || undefined,
    };

    if (editing.value) {
      const updated = await updatePolicy(editing.value.id, payload);
      const idx = policies.value.findIndex((p) => p.id === editing.value!.id);
      if (idx !== -1) policies.value[idx] = updated;
    } else {
      const created = await createPolicy(payload);
      policies.value.unshift(created);
    }

    dialog.value = false;
    toast.add({ title: "Qoida saqlandi", color: "success" });
  } catch (err: any) {
    toast.add({ title: "Xatolik", description: err.message, color: "error" });
  } finally {
    isSaving.value = false;
  }
}

async function remove(id: string) {
  deletingId.value = id;
  try {
    await deletePolicy(id);
    policies.value = policies.value.filter((p) => p.id !== id);
    toast.add({ title: "Qoida o'chirildi", color: "success" });
  } catch (err: any) {
    toast.add({ title: "Xatolik", description: err.message, color: "error" });
  } finally {
    deletingId.value = null;
  }
}

const formatMoney = (n: number) => `${n.toLocaleString("uz-UZ")} so'm`;

onMounted(() => { load(); loadRoles(); });
</script>
