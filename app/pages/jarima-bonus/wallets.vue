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
          <UPopover v-model:open="settleAllPopoverOpen">
            <UButton icon="i-lucide-receipt-text" label="Hammasini to'lash" color="primary"
              :loading="isSettlingAll" :disabled="positiveTotal === 0 && negativeTotal === 0" />
            <template #content>
              <div class="p-4 max-w-xs space-y-3">
                <p class="text-sm text-gray-600">
                  Barcha noldan farqli hamyonlar to'langan deb belgilanadi va nolga tushiriladi.
                </p>
                <div class="flex justify-end gap-2">
                  <UButton color="neutral" variant="subtle" label="Bekor" size="sm"
                    @click="settleAllPopoverOpen = false" />
                  <UButton color="primary" label="Tasdiqlash" size="sm" :loading="isSettlingAll"
                    @click="onSettleAll" />
                </div>
              </div>
            </template>
          </UPopover>

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
import {
  useBonusPenalty,
  type BonusPenaltyType,
  type BonusPenaltyWallet,
  type BonusPenaltyUserRef,
} from "~/composables/useBonusPenalty";

const UButton = resolveComponent("UButton");
const UPopover = resolveComponent("UPopover");

const { formatPhone } = usePhoneFormatter();
const { listWallets, settleWallet, settleAllWallets, formatCurrency } =
  useBonusPenalty();
const toast = useToast();

definePageMeta({ middleware: ["auth"] });

const navItems: NavigationMenuItem[] = [
  { label: "Tranzaksiyalar", icon: "i-lucide-hand-coins", to: "/jarima-bonus" },
  { label: "Hamyonlar", icon: "i-lucide-wallet", to: "/jarima-bonus/wallets" },
  { label: "Kategoriyalar", icon: "i-lucide-tags", to: "/jarima-bonus/categories" },
];

const wallets = ref<BonusPenaltyWallet[]>([]);
const loading = ref(true);
const searchQuery = ref("");

// Recipients for the create modal are derived from the wallets' embedded
// staff data — no separate /users/teachers or /users/staff call needed.
const teachers = computed<BonusPenaltyUserRef[]>(() =>
  wallets.value
    .map((w) => w.teacher)
    .filter((t): t is BonusPenaltyUserRef => !!t),
);

const showDialog = ref(false);
const presetTeacherId = ref<string | null>(null);
const presetType = ref<BonusPenaltyType>("bonus");

const settlePopoverOpen = ref<Record<string, boolean>>({});
const settlingId = ref<string | null>(null);
const isSettlingAll = ref(false);
const settleAllPopoverOpen = ref(false);

const teacherName = (w: BonusPenaltyWallet) =>
  w.teacher?.first_name
    ? `${w.teacher.first_name} ${w.teacher.last_name || ""}`.trim()
    : w.teacher_id;
const teacherPhone = (w: BonusPenaltyWallet) => w.teacher?.phone || "";

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
    header: "Xodim",
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
    cell: ({ row }) => {
      const w = row.original;
      return h("div", { class: "flex justify-end gap-1" }, [
        h(UButton, {
          color: "success",
          variant: "ghost",
          icon: "i-lucide-plus",
          size: "sm",
          label: "Bonus",
          onClick: () => openCreate(w.teacher_id, "bonus"),
        }),
        h(UButton, {
          color: "error",
          variant: "ghost",
          icon: "i-lucide-minus",
          size: "sm",
          label: "Jarima",
          onClick: () => openCreate(w.teacher_id, "jarima"),
        }),
        h(
          UPopover,
          {
            open: settlePopoverOpen.value[w.id] || false,
            "onUpdate:open": (v: boolean) => (settlePopoverOpen.value[w.id] = v),
          },
          {
            default: () =>
              h(UButton, {
                color: "primary",
                variant: "ghost",
                icon: "i-lucide-receipt-text",
                size: "sm",
                label: "To'lash",
                disabled: w.amount === 0,
              }),
            content: () =>
              h("div", { class: "p-4 max-w-xs space-y-3" }, [
                h("p", { class: "text-sm text-gray-600" }, [
                  "Balans ",
                  h("span", { class: "font-semibold" }, formatCurrency(w.amount)),
                  " to'langan deb belgilanadi va hamyon nolga tushiriladi.",
                ]),
                h("div", { class: "flex justify-end gap-2" }, [
                  h(UButton, {
                    color: "neutral",
                    variant: "subtle",
                    label: "Bekor",
                    size: "sm",
                    onClick: () => (settlePopoverOpen.value[w.id] = false),
                  }),
                  h(UButton, {
                    color: "primary",
                    label: settlingId.value === w.id ? "..." : "Tasdiqlash",
                    loading: settlingId.value === w.id,
                    size: "sm",
                    onClick: async () => {
                      await settleOne(w);
                      settlePopoverOpen.value[w.id] = false;
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

const fetchAll = () => fetchWallets();

const settleOne = async (w: BonusPenaltyWallet) => {
  settlingId.value = w.id;
  try {
    const res = await settleWallet(w.id);
    toast.add({
      title: "Hisob-kitob qilindi",
      description: `${formatCurrency(res.paid_amount)} to'langan deb belgilandi`,
      color: "success",
    });
    await fetchWallets();
  } catch (error) {
    console.error("Failed to settle wallet:", error);
    toast.add({ title: "Xatolik", description: "Hisob-kitobda xatolik", color: "error" });
  } finally {
    settlingId.value = null;
  }
};

const onSettleAll = async () => {
  settleAllPopoverOpen.value = false;
  await settleAll();
};

const settleAll = async () => {
  isSettlingAll.value = true;
  try {
    const res = await settleAllWallets();
    toast.add({
      title: "Hammasi hisob-kitob qilindi",
      description: `${res.count} ta hamyon, jami ${formatCurrency(res.total_paid)}`,
      color: "success",
    });
    await fetchWallets();
  } catch (error) {
    console.error("Failed to settle all wallets:", error);
    toast.add({ title: "Xatolik", description: "Hisob-kitobda xatolik", color: "error" });
  } finally {
    isSettlingAll.value = false;
  }
};

const openCreate = (teacherId: string, type: BonusPenaltyType) => {
  presetTeacherId.value = teacherId;
  presetType.value = type;
  showDialog.value = true;
};

onMounted(fetchAll);
</script>
