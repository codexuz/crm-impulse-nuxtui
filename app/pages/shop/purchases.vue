<template>
  <UDashboardPanel id="shop-purchases">
    <template #header>
      <UDashboardNavbar title="" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UNavigationMenu :items="navItems" highlight />
        </template>

        <template #description>
          O'quvchilarning sotib olish buyurtmalari
        </template>

        <template #right>
          <UButton icon="i-lucide-refresh-cw" label="Yangilash" variant="outline" @click="fetchPurchases" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UDashboardToolbar>
          <template #right>
            <USelectMenu v-model="statusFilter" :items="statusFilterOptions" value-key="value" class="w-44">
              <template #label>
                {{ statusFilterOptions.find((s) => s.value === statusFilter)?.label || "Holat" }}
              </template>
            </USelectMenu>
          </template>
        </UDashboardToolbar>

        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Buyurtmalar</h3>
          </template>

          <UTable :data="purchases" :columns="columns" :loading="loading" :empty="'Buyurtmalar topilmadi'" />
        </UCard>
      </div>

      <!-- Review modal -->
      <UModal v-model:open="showReview" :title="reviewTitle">
        <template #body>
          <div class="space-y-4">
            <div v-if="reviewing" class="text-sm text-gray-600">
              <div><span class="font-medium">Mahsulot:</span> {{ reviewing.item?.name || reviewing.item_id }}</div>
              <div><span class="font-medium">O'quvchi:</span> {{ userName(reviewing) }}</div>
              <div><span class="font-medium">Soni:</span> {{ reviewing.quantity }}</div>
              <div><span class="font-medium">Jami:</span> {{ formatCoins(reviewing.total_price) }}</div>
            </div>

            <UAlert
              v-if="reviewStatus === 'rejected'"
              color="warning"
              variant="subtle"
              icon="i-lucide-undo-2"
              title="Rad etilganda coinlar o'quvchiga qaytariladi va zaxira tiklanadi." />

            <UFormField label="Izoh (ixtiyoriy)" name="admin_note">
              <UTextarea v-model="adminNote" placeholder="Rad etish sababi yoki yetkazish ma'lumoti..." :rows="3"
                class="w-full" />
            </UFormField>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton label="Bekor qilish" color="neutral" variant="outline" @click="showReview = false" />
            <UButton :label="reviewActionLabel" :color="reviewStatus === 'rejected' ? 'error' : 'success'"
              :loading="isSubmitting" @click="submitReview" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn, NavigationMenuItem } from "@nuxt/ui";
import {
  useShop,
  PURCHASE_STATUS_LABELS,
  type PurchaseStatus,
  type ShopPurchase,
} from "~/composables/useShop";

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");

const { listPurchases, reviewPurchase, formatCoins, statusColor } = useShop();
const toast = useToast();

definePageMeta({ middleware: ["auth"] });

const navItems: NavigationMenuItem[] = [
  { label: "Mahsulotlar", icon: "i-lucide-shopping-bag", to: "/shop/items" },
  { label: "Buyurtmalar", icon: "i-lucide-clipboard-list", to: "/shop/purchases" },
];

const purchases = ref<ShopPurchase[]>([]);
const loading = ref(true);
const statusFilter = ref<"all" | PurchaseStatus>("pending");

const statusFilterOptions = [
  { label: "Barchasi", value: "all" as const },
  { label: PURCHASE_STATUS_LABELS.pending, value: "pending" as const },
  { label: PURCHASE_STATUS_LABELS.approved, value: "approved" as const },
  { label: PURCHASE_STATUS_LABELS.delivered, value: "delivered" as const },
  { label: PURCHASE_STATUS_LABELS.rejected, value: "rejected" as const },
];

// Review modal state
const showReview = ref(false);
const reviewing = ref<ShopPurchase | null>(null);
const reviewStatus = ref<Exclude<PurchaseStatus, "pending">>("approved");
const adminNote = ref("");
const isSubmitting = ref(false);

const reviewTitle = computed(() =>
  reviewStatus.value === "approved"
    ? "Buyurtmani tasdiqlash"
    : reviewStatus.value === "delivered"
      ? "Yetkazilgan deb belgilash"
      : "Buyurtmani rad etish",
);
const reviewActionLabel = computed(() =>
  reviewStatus.value === "approved"
    ? "Tasdiqlash"
    : reviewStatus.value === "delivered"
      ? "Yetkazildi"
      : "Rad etish",
);

const userName = (p: ShopPurchase) =>
  p.user
    ? `${p.user.first_name ?? ""} ${p.user.last_name ?? ""}`.trim() ||
      p.user.username ||
      p.user.user_id
    : p.user_id;

const pad = (n: number) => String(n).padStart(2, "0");
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  return `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
};

const columns: TableColumn<ShopPurchase>[] = [
  {
    accessorKey: "user",
    header: "O'quvchi",
    cell: ({ row }) => h("div", { class: "font-medium" }, userName(row.original)),
  },
  {
    accessorKey: "item",
    header: "Mahsulot",
    cell: ({ row }) => {
      const p = row.original;
      return h("div", {}, [
        h("div", { class: "font-medium" }, p.item?.name || "-"),
        h("div", { class: "text-xs text-gray-500" }, `Soni: ${p.quantity}`),
      ]);
    },
  },
  {
    accessorKey: "total_price",
    header: "Jami",
    cell: ({ row }) =>
      h("span", { class: "font-semibold text-amber-600" }, formatCoins(row.original.total_price)),
  },
  {
    accessorKey: "status",
    header: "Holati",
    cell: ({ row }) =>
      h(
        UBadge,
        { color: statusColor(row.original.status), variant: "subtle" },
        () => PURCHASE_STATUS_LABELS[row.original.status],
      ),
  },
  {
    accessorKey: "admin_note",
    header: "Izoh",
    cell: ({ row }) =>
      h("div", { class: "max-w-[200px] truncate" }, row.original.admin_note || "-"),
  },
  {
    accessorKey: "createdAt",
    header: "Sana",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const p = row.original;
      // Finalized requests (delivered/rejected) cannot be changed.
      if (p.status === "delivered" || p.status === "rejected") {
        return h("span", { class: "text-gray-300 text-xs" }, "—");
      }
      const buttons = [];
      if (p.status === "pending") {
        buttons.push(
          h(UButton, {
            color: "success",
            variant: "soft",
            label: "Tasdiqlash",
            size: "sm",
            onClick: () => openReview(p, "approved"),
          }),
        );
      }
      buttons.push(
        h(UButton, {
          color: "info",
          variant: "soft",
          label: "Yetkazildi",
          size: "sm",
          onClick: () => openReview(p, "delivered"),
        }),
        h(UButton, {
          color: "error",
          variant: "soft",
          label: "Rad etish",
          size: "sm",
          onClick: () => openReview(p, "rejected"),
        }),
      );
      return h("div", { class: "flex justify-end gap-1" }, buttons);
    },
  },
];

const fetchPurchases = async () => {
  loading.value = true;
  try {
    purchases.value = await listPurchases(
      statusFilter.value === "all" ? undefined : statusFilter.value,
    );
  } catch (error) {
    console.error("Failed to fetch purchases:", error);
    toast.add({ title: "Xatolik", description: "Buyurtmalarni yuklashda xatolik", color: "error" });
    purchases.value = [];
  } finally {
    loading.value = false;
  }
};

const openReview = (
  purchase: ShopPurchase,
  status: Exclude<PurchaseStatus, "pending">,
) => {
  reviewing.value = purchase;
  reviewStatus.value = status;
  adminNote.value = "";
  showReview.value = true;
};

const submitReview = async () => {
  if (!reviewing.value) return;
  isSubmitting.value = true;
  try {
    await reviewPurchase(reviewing.value.id, {
      status: reviewStatus.value,
      admin_note: adminNote.value.trim() || null,
    });
    toast.add({ title: "Muvaffaqiyat", description: "Buyurtma yangilandi", color: "success" });
    showReview.value = false;
    await fetchPurchases();
  } catch (error) {
    console.error("Failed to review purchase:", error);
    toast.add({ title: "Xatolik", description: "Amalni bajarishda xatolik", color: "error" });
  } finally {
    isSubmitting.value = false;
  }
};

watch(statusFilter, fetchPurchases);

onMounted(fetchPurchases);
</script>
