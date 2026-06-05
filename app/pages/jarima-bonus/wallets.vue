<template>
  <UDashboardPanel id="jarima-bonus-wallets">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UNavigationMenu :items="navItems" highlight />
        </template>

        <template #description> O'qituvchilarning bonus & jarima hamyonlari </template>

        <template #right>
          <UButton icon="i-lucide-refresh-cw" label="Yangilash" variant="outline" @click="fetchAll" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Totals -->
        <div class="grid gap-4 sm:grid-cols-3">
          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Hamyonlar soni</p>
                <p class="text-2xl font-bold mt-1">{{ wallets.length }}</p>
              </div>
              <span class="i-lucide-wallet text-gray-400 text-2xl"></span>
            </div>
          </UCard>
          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Musbat balans</p>
                <p class="text-2xl font-bold mt-1 text-green-600">{{ formatCurrency(positiveTotal) }}</p>
              </div>
              <span class="i-lucide-trending-up text-green-500 text-2xl"></span>
            </div>
          </UCard>
          <UCard>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-500">Manfiy balans (qarz)</p>
                <p class="text-2xl font-bold mt-1 text-red-600">{{ formatCurrency(negativeTotal) }}</p>
              </div>
              <span class="i-lucide-trending-down text-red-500 text-2xl"></span>
            </div>
          </UCard>
        </div>

        <UDashboardToolbar>
          <template #left>
            <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="O'qituvchini qidirish..." class="w-64" />
          </template>
        </UDashboardToolbar>

        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Hamyonlar</h3>
          </template>

          <UTable :data="filteredWallets" :columns="columns" :loading="loading" :empty="'Hamyonlar topilmadi'" />
        </UCard>
      </div>

      <JarimaBonusTransactionModal v-model:open="showDialog" :teachers="teachers" :default-teacher-id="presetTeacherId"
        :default-type="presetType" @created="fetchAll" />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn, NavigationMenuItem } from "@nuxt/ui";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import {
  useBonusPenalty,
  type BonusPenaltyType,
  type BonusPenaltyWallet,
  type BonusPenaltyUserRef,
} from "~/composables/useBonusPenalty";

const UButton = resolveComponent("UButton");

const { apiService } = useAuth();
const { formatPhone } = usePhoneFormatter();
const { listWallets, formatCurrency } = useBonusPenalty();
const toast = useToast();

definePageMeta({ middleware: ["auth"] });

const navItems: NavigationMenuItem[] = [
  { label: "Tranzaksiyalar", icon: "i-lucide-hand-coins", to: "/jarima-bonus" },
  { label: "Hamyonlar", icon: "i-lucide-wallet", to: "/jarima-bonus/wallets" },
  { label: "Kategoriyalar", icon: "i-lucide-tags", to: "/jarima-bonus/categories" },
];

const wallets = ref<BonusPenaltyWallet[]>([]);
const teachers = ref<BonusPenaltyUserRef[]>([]);
const loading = ref(true);
const searchQuery = ref("");

const showDialog = ref(false);
const presetTeacherId = ref<string | null>(null);
const presetType = ref<BonusPenaltyType>("bonus");

const teacherName = (w: BonusPenaltyWallet) => {
  if (w.teacher?.first_name) return `${w.teacher.first_name} ${w.teacher.last_name || ""}`.trim();
  const t = teachers.value.find((x) => x.user_id === w.teacher_id);
  return t ? `${t.first_name} ${t.last_name}` : w.teacher_id;
};
const teacherPhone = (w: BonusPenaltyWallet) => {
  if (w.teacher?.phone) return w.teacher.phone;
  return teachers.value.find((x) => x.user_id === w.teacher_id)?.phone || "";
};

const filteredWallets = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return wallets.value;
  return wallets.value.filter((w) => teacherName(w).toLowerCase().includes(q) || teacherPhone(w).includes(q));
});

const positiveTotal = computed(() =>
  wallets.value.reduce((sum, w) => sum + (w.amount > 0 ? w.amount : 0), 0),
);
const negativeTotal = computed(() =>
  wallets.value.reduce((sum, w) => sum + (w.amount < 0 ? w.amount : 0), 0),
);

const columns: TableColumn<BonusPenaltyWallet>[] = [
  {
    accessorKey: "teacher",
    header: "O'qituvchi",
    cell: ({ row }) => {
      const phone = teacherPhone(row.original);
      return h("div", {}, [
        h("div", { class: "font-medium" }, teacherName(row.original)),
        phone ? h("div", { class: "text-xs text-gray-500" }, formatPhone(phone)) : null,
      ]);
    },
  },
  {
    accessorKey: "amount",
    header: "Balans",
    cell: ({ row }) => {
      const amount = row.original.amount;
      return h(
        "span",
        {
          class:
            amount > 0
              ? "font-semibold text-green-600"
              : amount < 0
                ? "font-semibold text-red-600"
                : "font-semibold",
        },
        formatCurrency(amount),
      );
    },
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) =>
      h("div", { class: "flex justify-end gap-1" }, [
        h(UButton, {
          color: "success",
          variant: "ghost",
          icon: "i-lucide-plus",
          size: "sm",
          label: "Bonus",
          onClick: () => openCreate(row.original.teacher_id, "bonus"),
        }),
        h(UButton, {
          color: "error",
          variant: "ghost",
          icon: "i-lucide-minus",
          size: "sm",
          label: "Jarima",
          onClick: () => openCreate(row.original.teacher_id, "jarima"),
        }),
      ]),
  },
];

const fetchWallets = async () => {
  loading.value = true;
  try {
    wallets.value = await listWallets();
  } catch (error) {
    console.error("Failed to fetch wallets:", error);
    toast.add({ title: "Xatolik", description: "Hamyonlarni yuklashda xatolik", color: "error" });
    wallets.value = [];
  } finally {
    loading.value = false;
  }
};

const fetchTeachers = async () => {
  try {
    const response = await api.get<{ data: BonusPenaltyUserRef[] }>(
      apiService.value,
      "/users/teachers?limit=1000",
    );
    teachers.value = response.data || [];
  } catch {
    teachers.value = [];
  }
};

const fetchAll = () => Promise.all([fetchWallets(), fetchTeachers()]);

const openCreate = (teacherId: string, type: BonusPenaltyType) => {
  presetTeacherId.value = teacherId;
  presetType.value = type;
  showDialog.value = true;
};

onMounted(fetchAll);
</script>
