<template>
  <UDashboardPanel id="categories">
    <template #header>
      <UDashboardNavbar
        title="Xarajatlar kategoriyasi"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description> Xarajat kategoriyalarini boshqarish </template>

        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="Yangi kategoriya"
            @click="openCreateDialog"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div>
        <!-- Filters Section -->
        <UDashboardToolbar>
          <template #left>
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              placeholder="Kategoriya nomini qidirish..."
              class="w-64"
            />
          </template>

          <template #right>
            <UButton
              icon="i-lucide-refresh-cw"
              label="Yangilash"
              variant="outline"
              @click="refreshData"
            />
          </template>
        </UDashboardToolbar>

        <!-- Categories Table -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold">Kategoriyalar ro'yxati</h3>
          </template>

          <UTable
            :data="paginatedCategories"
            :columns="columns"
            :loading="loading"
            :empty="'Kategoriyalar topilmadi'"
          />

          <template #footer>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-500">
                <span class="font-medium">{{ paginationStart }}</span> dan
                <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
                <span class="font-medium">{{ filteredCategories.length }}</span>
                ta kategoriya
              </div>

              <UPagination
                :model-value="currentPage"
                :total="filteredCategories.length"
                :items-per-page="itemsPerPage"
                show-last
                show-first
                @update:page="onPageChange"
              />
            </div>
          </template>
        </UCard>
      </div>

      <!-- Create/Edit Modal -->
      <UModal
        v-model:open="showCategoryDialog"
        :title="isEditMode ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'"
      >
        <template #body>
          <form @submit.prevent="saveCategory" class="space-y-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium">
                Kategoriya nomi
                <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="categoryForm.name"
                placeholder="Kategoriya nomi"
                required
                class="w-full"
                @keyup.enter="saveCategory"
              />
            </div>
          </form>
        </template>

        <template #footer="{ close }">
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="outline"
              label="Bekor qilish"
              @click="close"
            />
            <UButton
              :label="isSaving ? 'Saqlanmoqda...' : 'Saqlash'"
              :loading="isSaving"
              @click="saveCategory"
            />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UPopover = resolveComponent("UPopover");

definePageMeta({
  middleware: ["auth"],
});

interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

const { apiService } = useAuth();
const toast = useToast();
const router = useRouter();
const route = useRoute();

// State variables
const categories = ref<Category[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = 10;
const showCategoryDialog = ref(false);
const selectedCategory = ref<Category | null>(null);
const isEditMode = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const deletePopoverOpen = ref<Record<string, boolean>>({});

// Form data
const categoryForm = reactive({
  name: "",
});

// Table columns
const columns: TableColumn<Category>[] = [
  {
    accessorKey: "name",
    header: "Kategoriya nomi",
    cell: ({ row }) => {
      return h("div", { class: "flex items-center gap-2" }, [
        h("span", { class: "i-lucide-tag text-gray-500" }),
        h(
          UBadge,
          () => row.original.name,
        ),
      ]);
    },
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      const categoryId = row.original.id;
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
            open: deletePopoverOpen.value[categoryId] || false,
            "onUpdate:open": (value: boolean) => {
              deletePopoverOpen.value[categoryId] = value;
            },
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
                h(
                  "h4",
                  { class: "font-semibold text-sm" },
                  "Ishonchingiz komilmi?",
                ),
                h(
                  "p",
                  { class: "text-sm text-gray-600" },
                  "Bu kategoriyani butunlay o'chiradi. Bu amalni qaytarib bo'lmaydi.",
                ),
                h("div", { class: "flex justify-end gap-2 mt-3" }, [
                  h(UButton, {
                    color: "neutral",
                    variant: "subtle",
                    label: "Bekor qilish",
                    size: "sm",
                    onClick: () => {
                      deletePopoverOpen.value[categoryId] = false;
                    },
                  }),
                  h(UButton, {
                    color: "red",
                    label: isDeleting.value ? "O'chirilmoqda..." : "O'chirish",
                    loading: isDeleting.value,
                    size: "sm",
                    onClick: async () => {
                      await confirmDelete(row.original);
                      deletePopoverOpen.value[categoryId] = false;
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

// Computed properties
const filteredCategories = computed(() => {
  return categories.value.filter((category) => {
    return category.name
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase());
  });
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredCategories.value.length / itemsPerPage));
});

const paginatedCategories = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredCategories.value.slice(startIndex, endIndex);
});

const paginationStart = computed(() => {
  return filteredCategories.value.length === 0
    ? 0
    : (currentPage.value - 1) * itemsPerPage + 1;
});

const paginationEnd = computed(() => {
  return Math.min(
    currentPage.value * itemsPerPage,
    filteredCategories.value.length,
  );
});

// Fetch data
const fetchCategories = async () => {
  loading.value = true;
  try {
    const response = await api.get<Category[]>(
      apiService.value,
      "/expense-categories",
    );
    categories.value = response || [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    toast.add({
      title: "Xatolik",
      description: "Kategoriyalarni yuklashda xatolik yuz berdi",
      color: "error",
    });
    categories.value = [];
  } finally {
    loading.value = false;
  }
};

// Action handlers
const refreshData = () => {
  fetchCategories();
};

const openCreateDialog = () => {
  isEditMode.value = false;
  resetForm();
  showCategoryDialog.value = true;
};

const editCategory = (category: Category) => {
  isEditMode.value = true;
  selectedCategory.value = category;
  categoryForm.name = category.name;
  showCategoryDialog.value = true;
};

const saveCategory = async () => {
  // Validation
  if (!categoryForm.name.trim()) {
    toast.add({
      title: "Xatolik",
      description: "Iltimos, kategoriya nomini kiriting",
      color: "error",
    });
    return;
  }

  isSaving.value = true;
  try {
    const data = {
      name: categoryForm.name.trim(),
    };

    if (isEditMode.value && selectedCategory.value) {
      await api.patch(
        apiService.value,
        `/expense-categories/${selectedCategory.value.id}`,
        data,
      );
      toast.add({
        title: "Muvaffaqiyat",
        description: "Kategoriya muvaffaqiyatli yangilandi",
        color: "success",
      });
    } else {
      await api.post(apiService.value, "/expense-categories", data);
      toast.add({
        title: "Muvaffaqiyat",
        description: "Kategoriya muvaffaqiyatli qo'shildi",
        color: "success",
      });
    }

    showCategoryDialog.value = false;
    resetForm();
    fetchCategories();
  } catch (error) {
    console.error("Failed to save category:", error);
    toast.add({
      title: "Xatolik",
      description: "Kategoriyani saqlashda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = async (category: Category) => {
  if (!category) return;

  isDeleting.value = true;
  try {
    await api.delete(apiService.value, `/expense-categories/${category.id}`);
    toast.add({
      title: "Muvaffaqiyat",
      description: "Kategoriya muvaffaqiyatli o'chirildi",
      color: "success",
    });
    fetchCategories();
  } catch (error) {
    console.error("Failed to delete category:", error);
    toast.add({
      title: "Xatolik",
      description: "Kategoriyani o'chirishda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
};

const resetForm = () => {
  categoryForm.name = "";
  selectedCategory.value = null;
};

// Navigation functions for pagination
const onPageChange = (newPage: number) => {
  if (newPage >= 1 && newPage <= totalPages.value) {
    currentPage.value = newPage;
    updateUrlParams();
  }
};

const updateUrlParams = () => {
  const query: Record<string, string> = {
    page: currentPage.value.toString(),
  };

  if (searchQuery.value) {
    query.search = searchQuery.value;
  }

  router.push({ query });
};

// Initialize data on component mount
onMounted(() => {
  if (route.query.page) {
    currentPage.value = parseInt(route.query.page as string, 10);
  }

  if (route.query.search) {
    searchQuery.value = route.query.search as string;
  }

  fetchCategories();
});

// Watch for filter changes and reset to page 1
watch(searchQuery, () => {
  currentPage.value = 1;
  updateUrlParams();
});
</script>
