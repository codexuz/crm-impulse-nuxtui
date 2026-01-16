<template>
  <div class="container py-10 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">
          Xarajatlar kategoriyasi
        </h1>
        <p class="text-muted-foreground">Xarajat kategoriyalarini boshqarish</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="refreshData">
          <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" />
          Yangilash
        </Button>
        <Button @click="openCreateDialog">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          Yangi kategoriya
        </Button>
      </div>
    </div>

    <!-- Search Filter -->
    <div class="flex flex-col sm:flex-row gap-4">
      <Input
        v-model="searchQuery"
        placeholder="Kategoriya nomini qidirish..."
        class="sm:max-w-xs"
      >
        <template #leading>
          <Icon name="lucide:search" class="h-4 w-4" />
        </template>
      </Input>
    </div>

    <!-- Categories Table -->
    <Card>
      <CardContent class="p-0">
        <div class="p-2 border-b">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategoriya nomi</TableHead>
                <TableHead class="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="loading">
                <TableCell colspan="2" class="text-center py-10">
                  <div class="flex justify-center items-center">
                    <Icon
                      name="lucide:loader-2"
                      class="h-8 w-8 animate-spin text-muted-foreground"
                    />
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-else-if="paginatedCategories.length === 0">
                <TableCell colspan="2" class="text-center py-10">
                  <div class="flex justify-center">
                    <Icon
                      name="lucide:search-x"
                      class="h-8 w-8 text-muted-foreground"
                    />
                  </div>
                  <p class="text-muted-foreground mt-2">
                    Kategoriyalar topilmadi
                  </p>
                </TableCell>
              </TableRow>
              <TableRow
                v-for="category in paginatedCategories"
                :key="category.id"
                class="hover:bg-muted/50"
              >
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Badge variant="outline">
                      <Icon name="lucide:tag" class="h-3 w-3 mr-1" />
                      {{ category.name }}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      @click="editCategory(category)"
                      title="Tahrirlash"
                    >
                      <Icon name="lucide:pencil" class="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      @click="deleteCategory(category)"
                      title="O'chirish"
                    >
                      <Icon
                        name="lucide:trash-2"
                        class="h-4 w-4 text-red-500"
                      />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between p-4">
          <div class="text-sm text-muted-foreground">
            Ko'rsatilmoqda
            <span class="font-medium">{{ paginationStart }}</span> dan
            <span class="font-medium">{{ paginationEnd }}</span> gacha
            <span class="font-medium">{{ filteredCategories.length }}</span> ta
            kategoriya
          </div>

          <Pagination
            v-model:page="currentPage"
            :total="filteredCategories.length"
            :items-per-page="itemsPerPage"
            :sibling-count="1"
            @update:page="onPageChange"
          >
            <PaginationContent>
              <PaginationPrevious
                :disabled="currentPage === 1"
                @click="navigatePage(currentPage - 1)"
              />

              <PaginationItem
                v-for="pageNum in displayedPages"
                :key="pageNum"
                :value="pageNum"
                :is-active="pageNum === currentPage"
                @click="navigatePage(pageNum)"
              >
                {{ pageNum }}
              </PaginationItem>

              <PaginationEllipsis v-if="showEndEllipsis" />

              <PaginationNext
                :disabled="currentPage === totalPages"
                @click="navigatePage(currentPage + 1)"
              />
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
    </Card>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:open="showCategoryDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {{ isEditMode ? "Kategoriyani tahrirlash" : "Yangi kategoriya" }}
          </DialogTitle>
          <DialogDescription>
            {{
              isEditMode
                ? "Kategoriya nomini tahrirlang"
                : "Yangi kategoriya qo'shing"
            }}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="name" class="text-right">Nomi *</Label>
            <Input
              id="name"
              v-model="categoryForm.name"
              placeholder="Kategoriya nomi"
              class="col-span-3"
              @keyup.enter="saveCategory"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showCategoryDialog = false">
            Bekor qilish
          </Button>
          <Button @click="saveCategory" :disabled="isSaving">
            <Icon
              v-if="isSaving"
              name="lucide:loader-2"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ isSaving ? "Saqlanmoqda..." : "Saqlash" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
          <AlertDialogDescription>
            Ushbu kategoriyani o'chirmoqchimisiz? Bu amalni bekor qilib
            bo'lmaydi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            @click="confirmDelete"
            class="bg-red-600 hover:bg-red-700"
          >
            O'chirish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";

import { api } from "~/lib/api";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

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
const showDeleteDialog = ref(false);
const selectedCategory = ref<Category | null>(null);
const isEditMode = ref(false);
const isSaving = ref(false);

// Form data
const categoryForm = reactive({
  name: "",
});

// Computed properties
const categoriesCount = computed(() => categories.value.length);

const lastAddedCategory = computed(() => {
  if (categories.value.length === 0) return null;
  const sorted = [...categories.value].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return sorted[0]?.name;
});

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
    filteredCategories.value.length
  );
});

// Pagination display helpers
const displayedPages = computed(() => {
  if (totalPages.value <= 7) {
    return Array.from({ length: totalPages.value }, (_, i) => i + 1);
  }

  const pages = [];
  pages.push(1);

  if (currentPage.value <= 3) {
    pages.push(2, 3, 4);
  } else if (currentPage.value >= totalPages.value - 2) {
    pages.push(
      totalPages.value - 3,
      totalPages.value - 2,
      totalPages.value - 1
    );
  } else {
    pages.push(currentPage.value - 1, currentPage.value, currentPage.value + 1);
  }

  if (!pages.includes(totalPages.value)) {
    pages.push(totalPages.value);
  }

  return [...new Set(pages)].sort((a, b) => a - b);
});

const showEndEllipsis = computed(() => {
  const lastDisplayedPage = Math.max(...displayedPages.value);
  return lastDisplayedPage < totalPages.value;
});

// Fetch data
const fetchCategories = async () => {
  loading.value = true;
  try {
    const response = await api.get<Category[]>(
      apiService.value,
      "/expense-categories"
    );
    categories.value = response || [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    toast.toast({
      title: "Xatolik",
      description: "Kategoriyalarni yuklashda xatolik yuz berdi",
      variant: "destructive",
    });
    categories.value = [];
  } finally {
    loading.value = false;
  }
};

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

const deleteCategory = (category: Category) => {
  selectedCategory.value = category;
  showDeleteDialog.value = true;
};

const saveCategory = async () => {
  // Validation
  if (!categoryForm.name.trim()) {
    toast.toast({
      title: "Xatolik",
      description: "Iltimos, kategoriya nomini kiriting",
      variant: "destructive",
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
        data
      );
      toast.toast({
        title: "Muvaffaqiyat",
        description: "Kategoriya muvaffaqiyatli yangilandi",
      });
    } else {
      await api.post(apiService.value, "/expense-categories", data);
      toast.toast({
        title: "Muvaffaqiyat",
        description: "Kategoriya muvaffaqiyatli qo'shildi",
      });
    }

    showCategoryDialog.value = false;
    resetForm();
    fetchCategories();
  } catch (error) {
    console.error("Failed to save category:", error);
    toast.toast({
      title: "Xatolik",
      description: "Kategoriyani saqlashda xatolik yuz berdi",
      variant: "destructive",
    });
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = async () => {
  if (!selectedCategory.value) return;

  try {
    await api.delete(
      apiService.value,
      `/expense-categories/${selectedCategory.value.id}`
    );
    toast.toast({
      title: "Muvaffaqiyat",
      description: "Kategoriya muvaffaqiyatli o'chirildi",
    });
    showDeleteDialog.value = false;
    fetchCategories();
  } catch (error) {
    console.error("Failed to delete category:", error);
    toast.toast({
      title: "Xatolik",
      description: "Kategoriyani o'chirishda xatolik yuz berdi",
      variant: "destructive",
    });
  }
};

const resetForm = () => {
  categoryForm.name = "";
  selectedCategory.value = null;
};

// Navigation functions for pagination
const navigatePage = (newPage: number) => {
  if (newPage >= 1 && newPage <= totalPages.value) {
    currentPage.value = newPage;
    updateUrlParams();
  }
};

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
