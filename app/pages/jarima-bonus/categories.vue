<template>
  <UDashboardPanel id="jarima-bonus-categories">
    <template #header>
      <UDashboardNavbar :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UNavigationMenu :items="navItems" highlight />
        </template>

        <template #description> Bonus & jarima kategoriyalarini boshqarish </template>

        <template #right>
          <UButton icon="i-lucide-plus" label="Yangi kategoriya" @click="openCreateDialog" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div>
        <UDashboardToolbar>
          <template #left>
            <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="Kategoriya nomini qidirish..."
              class="w-64" />
          </template>
          <template #right>
            <USelectMenu v-model="typeFilter" :items="typeFilterOptions" value-key="value" placeholder="Tur"
              class="w-40" />
            <UButton icon="i-lucide-refresh-cw" label="Yangilash" variant="outline" @click="fetchCategories" />
          </template>
        </UDashboardToolbar>

        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Kategoriyalar ro'yxati</h3>
          </template>

          <UTable :data="paginatedCategories" :columns="columns" :loading="loading"
            :empty="'Kategoriyalar topilmadi'" />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                Jami <span class="font-medium">{{ filteredCategories.length }}</span> ta kategoriya
              </div>
              <UPagination :page="currentPage" :total="filteredCategories.length" :items-per-page="itemsPerPage"
                show-last show-first @update:page="(p: number) => (currentPage = p)" />
            </div>
          </template>
        </UCard>
      </div>

      <!-- Create / Edit Modal -->
      <UModal v-model:open="showDialog" :title="isEditMode ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'">
        <template #body>
          <form @submit.prevent="saveCategory" class="space-y-4">
            <UFormField label="Kategoriya nomi" required>
              <UInput v-model="form.name" placeholder="Masalan: Darsga kechikish" class="w-full"
                @keyup.enter="saveCategory" />
            </UFormField>

            <UFormField label="Tur (ixtiyoriy)" help="Bo'sh qoldirilsa, barcha turlar uchun ishlatiladi">
              <USelectMenu v-model="form.type" :items="typeOptions" value-key="value" placeholder="Tur"
                class="w-full" />
            </UFormField>

            <UFormField label="Tavsif (ixtiyoriy)">
              <UTextarea v-model="form.description" placeholder="Kategoriya tavsifi..." :rows="3" class="w-full" />
            </UFormField>
          </form>
        </template>

        <template #footer="{ close }">
          <div class="flex justify-end gap-2">
            <UButton color="neutral" variant="outline" label="Bekor qilish" @click="close" />
            <UButton :label="isSaving ? 'Saqlanmoqda...' : 'Saqlash'" :loading="isSaving" @click="saveCategory" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn, NavigationMenuItem } from "@nuxt/ui";
import {
  useBonusPenalty,
  BONUS_PENALTY_TYPE_LABELS,
  type BonusPenaltyType,
  type BonusPenaltyCategory,
} from "~/composables/useBonusPenalty";

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UPopover = resolveComponent("UPopover");

const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  typeColor,
} = useBonusPenalty();
const toast = useToast();

definePageMeta({ middleware: ["auth"] });

const navItems: NavigationMenuItem[] = [
  { label: "Tranzaksiyalar", icon: "i-lucide-hand-coins", to: "/jarima-bonus" },
  { label: "Hamyonlar", icon: "i-lucide-wallet", to: "/jarima-bonus/wallets" },
  { label: "Kategoriyalar", icon: "i-lucide-tags", to: "/jarima-bonus/categories" },
];

const typeOptions = [
  { label: "Barchasi uchun", value: null as BonusPenaltyType | null },
  { label: "Bonus", value: "bonus" as const },
  { label: "Jarima", value: "jarima" as const },
  { label: "Referal", value: "referal" as const },
];
const typeFilterOptions = [{ label: "Barcha turlar", value: null as BonusPenaltyType | null }, ...typeOptions.slice(1)];

const categories = ref<BonusPenaltyCategory[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const typeFilter = ref<BonusPenaltyType | null>(null);
const currentPage = usePaginationState("page", 1);
const itemsPerPage = 10;

const showDialog = ref(false);
const isEditMode = ref(false);
const selected = ref<BonusPenaltyCategory | null>(null);
const isSaving = ref(false);
const isDeleting = ref(false);
const deletePopoverOpen = ref<Record<string, boolean>>({});

const form = reactive({
  name: "",
  type: null as BonusPenaltyType | null,
  description: "",
});

const columns: TableColumn<BonusPenaltyCategory>[] = [
  {
    accessorKey: "name",
    header: "Kategoriya nomi",
    cell: ({ row }) =>
      h("div", { class: "flex items-center gap-2" }, [
        h("span", { class: "i-lucide-tag text-gray-500" }),
        h("span", { class: "font-medium" }, row.original.name),
      ]),
  },
  {
    accessorKey: "type",
    header: "Tur",
    cell: ({ row }) => {
      const type = row.original.type;
      if (!type) return h(UBadge, { color: "neutral", variant: "subtle" }, () => "Barchasi");
      return h(UBadge, { color: typeColor(type), variant: "subtle" }, () =>
        BONUS_PENALTY_TYPE_LABELS[type],
      );
    },
  },
  {
    accessorKey: "description",
    header: "Tavsif",
    cell: ({ row }) =>
      h("div", { class: "max-w-[280px] truncate text-gray-600" }, row.original.description || "-"),
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      const id = row.original.id;
      return h("div", { class: "flex justify-end gap-1" }, [
        h(UButton, {
          variant: "ghost",
          icon: "i-lucide-pencil",
          size: "sm",
          square: true,
          onClick: () => editCategory(row.original),
        }),
        h(
          UPopover,
          {
            open: deletePopoverOpen.value[id] || false,
            "onUpdate:open": (v: boolean) => (deletePopoverOpen.value[id] = v),
          },
          {
            default: () =>
              h(UButton, { color: "error", variant: "ghost", icon: "i-lucide-trash-2", size: "sm", square: true }),
            content: () =>
              h("div", { class: "p-4 max-w-sm space-y-3" }, [
                h("p", { class: "text-sm text-gray-600" }, "Bu kategoriyani o'chirishni tasdiqlaysizmi?"),
                h("div", { class: "flex justify-end gap-2" }, [
                  h(UButton, {
                    color: "neutral",
                    variant: "subtle",
                    label: "Bekor",
                    size: "sm",
                    onClick: () => (deletePopoverOpen.value[id] = false),
                  }),
                  h(UButton, {
                    color: "error",
                    label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                    loading: isDeleting.value,
                    size: "sm",
                    onClick: async () => {
                      await confirmDelete(row.original);
                      deletePopoverOpen.value[id] = false;
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

const filteredCategories = computed(() =>
  categories.value.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesType = !typeFilter.value || c.type === typeFilter.value;
    return matchesSearch && matchesType;
  }),
);

const paginatedCategories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredCategories.value.slice(start, start + itemsPerPage);
});

const fetchCategories = async () => {
  loading.value = true;
  try {
    categories.value = await listCategories();
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    toast.add({ title: "Xatolik", description: "Kategoriyalarni yuklashda xatolik", color: "error" });
    categories.value = [];
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.name = "";
  form.type = null;
  form.description = "";
  selected.value = null;
};

const openCreateDialog = () => {
  isEditMode.value = false;
  resetForm();
  showDialog.value = true;
};

const editCategory = (category: BonusPenaltyCategory) => {
  isEditMode.value = true;
  selected.value = category;
  form.name = category.name;
  form.type = category.type;
  form.description = category.description || "";
  showDialog.value = true;
};

const saveCategory = async () => {
  if (!form.name.trim()) {
    toast.add({ title: "Xatolik", description: "Iltimos, kategoriya nomini kiriting", color: "error" });
    return;
  }
  isSaving.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      type: form.type,
      description: form.description.trim() || null,
    };
    if (isEditMode.value && selected.value) {
      await updateCategory(selected.value.id, payload);
      toast.add({ title: "Muvaffaqiyat", description: "Kategoriya yangilandi", color: "success" });
    } else {
      await createCategory(payload);
      toast.add({ title: "Muvaffaqiyat", description: "Kategoriya qo'shildi", color: "success" });
    }
    showDialog.value = false;
    resetForm();
    await fetchCategories();
  } catch (error) {
    console.error("Failed to save category:", error);
    toast.add({ title: "Xatolik", description: "Kategoriyani saqlashda xatolik", color: "error" });
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = async (category: BonusPenaltyCategory) => {
  isDeleting.value = true;
  try {
    await deleteCategory(category.id);
    toast.add({ title: "Muvaffaqiyat", description: "Kategoriya o'chirildi", color: "success" });
    await fetchCategories();
  } catch (error) {
    console.error("Failed to delete category:", error);
    toast.add({ title: "Xatolik", description: "Kategoriyani o'chirishda xatolik", color: "error" });
  } finally {
    isDeleting.value = false;
  }
};

watch([searchQuery, typeFilter], () => (currentPage.value = 1));

onMounted(fetchCategories);
</script>
