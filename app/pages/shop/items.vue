<template>
  <UDashboardPanel id="shop-items">
    <template #header>
      <UDashboardNavbar title="" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UNavigationMenu :items="navItems" highlight />
        </template>

        <template #description>
          Do'kon mahsulotlari — o'quvchilar coinlarga sotib oladi
        </template>

        <template #right>
          <UButton icon="i-lucide-plus" label="Mahsulot qo'shish" @click="openCreate()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UDashboardToolbar>
          <template #right>
            <USwitch v-model="includeInactive" label="Nofaollarni ko'rsatish" />
            <UButton icon="i-lucide-refresh-cw" label="Yangilash" variant="outline" @click="fetchItems" />
          </template>
        </UDashboardToolbar>

        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Mahsulotlar</h3>
          </template>

          <UTable :data="items" :columns="columns" :loading="loading" :empty="'Mahsulotlar topilmadi'" />
        </UCard>
      </div>

      <ShopItemModal v-model:open="showDialog" :item="editingItem" @saved="onSaved" />
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn, NavigationMenuItem } from "@nuxt/ui";
import { useShop, type ShopItem } from "~/composables/useShop";

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UPopover = resolveComponent("UPopover");

const { listItems, deleteItem, formatCoins } = useShop();
const toast = useToast();

definePageMeta({ middleware: ["auth"] });

const navItems: NavigationMenuItem[] = [
  { label: "Mahsulotlar", icon: "i-lucide-shopping-bag", to: "/shop/items" },
  { label: "Buyurtmalar", icon: "i-lucide-clipboard-list", to: "/shop/purchases" },
];

const items = ref<ShopItem[]>([]);
const loading = ref(true);
const includeInactive = ref(false);

const showDialog = ref(false);
const editingItem = ref<ShopItem | null>(null);

const deletePopoverOpen = ref<Record<string, boolean>>({});
const isDeleting = ref(false);

const columns: TableColumn<ShopItem>[] = [
  {
    accessorKey: "name",
    header: "Mahsulot",
    cell: ({ row }) => {
      const it = row.original;
      return h("div", { class: "flex items-center gap-3" }, [
        it.image_url
          ? h("img", {
              src: it.image_url,
              class: "w-10 h-10 rounded object-cover",
            })
          : h(
              "div",
              { class: "w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400" },
              h("span", { class: "i-lucide-image text-lg" }),
            ),
        h("div", {}, [
          h("div", { class: "font-medium" }, it.name),
          it.description
            ? h("div", { class: "text-xs text-gray-500 max-w-[260px] truncate" }, it.description)
            : null,
        ]),
      ]);
    },
  },
  {
    accessorKey: "price",
    header: "Narxi",
    cell: ({ row }) =>
      h("span", { class: "font-semibold text-amber-600" }, formatCoins(row.original.price)),
  },
  {
    accessorKey: "stock",
    header: "Zaxira",
    cell: ({ row }) => {
      const s = row.original.stock;
      return s === null || s === undefined
        ? h("span", { class: "text-gray-400" }, "Cheksiz")
        : h("span", {}, String(s));
    },
  },
  {
    accessorKey: "is_active",
    header: "Holati",
    cell: ({ row }) =>
      h(
        UBadge,
        { color: row.original.is_active ? "success" : "neutral", variant: "subtle" },
        () => (row.original.is_active ? "Faol" : "Nofaol"),
      ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const it = row.original;
      return h("div", { class: "flex justify-end gap-1" }, [
        h(UButton, {
          color: "neutral",
          variant: "ghost",
          icon: "i-lucide-pencil",
          size: "sm",
          square: true,
          onClick: () => openEdit(it),
        }),
        h(
          UPopover,
          {
            open: deletePopoverOpen.value[it.id] || false,
            "onUpdate:open": (v: boolean) => (deletePopoverOpen.value[it.id] = v),
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
                h("p", { class: "text-sm text-gray-600" }, "Mahsulotni o'chirishni tasdiqlaysizmi?"),
                h("div", { class: "flex justify-end gap-2" }, [
                  h(UButton, {
                    color: "neutral",
                    variant: "subtle",
                    label: "Bekor",
                    size: "sm",
                    onClick: () => (deletePopoverOpen.value[it.id] = false),
                  }),
                  h(UButton, {
                    color: "error",
                    label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                    loading: isDeleting.value,
                    size: "sm",
                    onClick: async () => {
                      await confirmDelete(it.id);
                      deletePopoverOpen.value[it.id] = false;
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

const fetchItems = async () => {
  loading.value = true;
  try {
    items.value = await listItems(includeInactive.value);
  } catch (error) {
    console.error("Failed to fetch items:", error);
    toast.add({ title: "Xatolik", description: "Mahsulotlarni yuklashda xatolik", color: "error" });
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editingItem.value = null;
  showDialog.value = true;
};

const openEdit = (item: ShopItem) => {
  editingItem.value = item;
  showDialog.value = true;
};

const onSaved = () => fetchItems();

const confirmDelete = async (id: string) => {
  isDeleting.value = true;
  try {
    await deleteItem(id);
    toast.add({ title: "Muvaffaqiyat", description: "Mahsulot o'chirildi", color: "success" });
    await fetchItems();
  } catch (error) {
    console.error("Failed to delete item:", error);
    toast.add({ title: "Xatolik", description: "O'chirishda xatolik", color: "error" });
  } finally {
    isDeleting.value = false;
  }
};

watch(includeInactive, fetchItems);

onMounted(fetchItems);
</script>
