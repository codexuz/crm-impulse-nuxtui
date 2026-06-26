<template>
  <div class="container py-10 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Bildirishnomalar</h1>
        <p class="text-muted-foreground">
          Yuborilgan barcha bildirishnomalar ro'yxati
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="refreshData">
          <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" />
          Yangilash
        </Button>
        <Button @click="goToCreate">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          Yangi bildirishnoma
        </Button>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium"
            >Jami bildirishnomalar</CardTitle
          >
          <Icon name="lucide:bell" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ notifications.length }}</div>
          <p class="text-xs text-muted-foreground">
            Umumiy bildirishnomalar soni
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium"
            >Rasmli bildirishnomalar</CardTitle
          >
          <Icon name="lucide:image" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ notificationsWithImage }}</div>
          <p class="text-xs text-muted-foreground">Rasm bilan yuborilgan</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader
          class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
          <CardTitle class="text-sm font-medium"
            >Oxirgi bildirishnoma</CardTitle
          >
          <Icon name="lucide:clock" class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ lastNotificationTime }}</div>
          <p class="text-xs text-muted-foreground">Yuborilgan vaqt</p>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <Input
        v-model="searchQuery"
        placeholder="Sarlavha yoki xabar bo'yicha qidirish..."
        class="sm:max-w-md"
      >
        <template #leading>
          <Icon name="lucide:search" class="h-4 w-4" />
        </template>
      </Input>
    </div>

    <!-- Table -->
    <Card>
      <CardHeader>
        <CardTitle>Bildirishnomalar ro'yxati</CardTitle>
        <CardDescription>
          Yuborilgan barcha bildirishnomalar va ularning ma'lumotlari
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sarlavha</TableHead>
              <TableHead>Xabar</TableHead>
              <TableHead>Rasm</TableHead>
              <TableHead>Yuborilgan sana</TableHead>
              <TableHead class="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody v-if="!loading && paginatedNotifications.length > 0">
            <TableRow
              v-for="notification in paginatedNotifications"
              :key="notification.id"
            >
              <TableCell class="font-medium">
                {{ notification.title }}
              </TableCell>
              <TableCell class="max-w-md truncate">
                {{ notification.message }}
              </TableCell>
              <TableCell>
                <div
                  v-if="notification.img_url"
                  class="flex items-center gap-2"
                >
                  <img
                    :src="notification.img_url"
                    alt="Notification"
                    class="w-10 h-10 rounded object-cover"
                  />
                  <Badge variant="secondary">Mavjud</Badge>
                </div>
                <span v-else class="text-muted-foreground">-</span>
              </TableCell>
              <TableCell>
                {{ formatDateTime(notification.createdAt) }}
              </TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="viewNotification(notification)"
                  >
                    <Icon name="lucide:eye" class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="confirmDelete(notification)"
                  >
                    <Icon
                      name="lucide:trash-2"
                      class="h-4 w-4 text-destructive"
                    />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
          <TableBody v-else-if="loading">
            <TableRow>
              <TableCell colspan="5" class="text-center py-10">
                Yuklanmoqda...
              </TableCell>
            </TableRow>
          </TableBody>
          <TableBody v-else>
            <TableRow>
              <TableCell colspan="5" class="text-center py-10">
                Ma'lumot topilmadi
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter class="flex items-center justify-between">
        <div class="text-sm text-muted-foreground">
          Ko'rsatilmoqda {{ paginationStart }} - {{ paginationEnd }} /
          {{ filteredNotifications.length }} ta bildirishnoma
        </div>
        <Pagination
          v-model:page="currentPage"
          :total="filteredNotifications.length"
          :items-per-page="itemsPerPage"
          :sibling-count="1"
        >
          <PaginationContent>
            <PaginationPrevious
              :disabled="currentPage === 1"
              @click="currentPage = Math.max(1, currentPage - 1)"
            />

            <PaginationItem
              v-for="pageNum in displayedPages"
              :key="pageNum"
              :value="pageNum"
              :is-active="pageNum === currentPage"
              @click="currentPage = pageNum"
            >
              {{ pageNum }}
            </PaginationItem>

            <PaginationEllipsis v-if="showEndEllipsis" />

            <PaginationNext
              :disabled="currentPage === totalPages"
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
            />
          </PaginationContent>
        </Pagination>
      </CardFooter>
    </Card>

    <!-- View Dialog -->
    <Dialog v-model:open="isViewDialogOpen">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bildirishnoma ma'lumotlari</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-4" v-if="selectedNotification">
          <div class="space-y-2">
            <Label class="font-semibold">Sarlavha:</Label>
            <p class="text-sm">{{ selectedNotification.title }}</p>
          </div>
          <div class="space-y-2">
            <Label class="font-semibold">Xabar:</Label>
            <p class="text-sm whitespace-pre-wrap">
              {{ selectedNotification.message }}
            </p>
          </div>
          <div v-if="selectedNotification.img_url" class="space-y-2">
            <Label class="font-semibold">Rasm:</Label>
            <img
              :src="selectedNotification.img_url"
              alt="Notification"
              class="rounded-lg border w-full h-auto max-h-96 object-contain"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label class="font-semibold">Yuborilgan sana:</Label>
              <p class="text-sm">
                {{ formatDateTime(selectedNotification.createdAt) }}
              </p>
            </div>
            <div class="space-y-2">
              <Label class="font-semibold">Oxirgi yangilanish:</Label>
              <p class="text-sm">
                {{ formatDateTime(selectedNotification.updatedAt) }}
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button @click="isViewDialogOpen = false">Yopish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bildirishnomani o'chirish</AlertDialogTitle>
          <AlertDialogDescription>
            Haqiqatan ham bu bildirishnomani o'chirmoqchimisiz? Bu amalni ortga
            qaytarib bo'lmaydi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction @click="deleteNotification"
            >O'chirish</AlertDialogAction
          >
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";
import { api } from "~/lib/api";
import { toast } from "vue-sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  img_url: string | null;
  createdAt: string;
  updatedAt: string;
}

const { apiService } = useAuth();
const router = useRouter();

// State variables
const notifications = ref<Notification[]>([]);
const loading = ref(true);
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = 10;

// Dialog states
const isViewDialogOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const selectedNotification = ref<Notification | null>(null);

// Computed properties
const filteredNotifications = computed(() => {
  return notifications.value.filter((notification) => {
    const searchMatch =
      notification.title
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase()) ||
      notification.message
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase());

    return searchMatch;
  });
});

const notificationsWithImage = computed(() => {
  return notifications.value.filter((n) => n.img_url).length;
});

const lastNotificationTime = computed(() => {
  if (notifications.value.length === 0) return "N/A";
  const latest = notifications.value.reduce((prev, current) => {
    return new Date(current.createdAt) > new Date(prev.createdAt)
      ? current
      : prev;
  });
  return formatRelativeTime(latest.createdAt);
});

const totalPages = computed(() => {
  return Math.max(
    1,
    Math.ceil(filteredNotifications.value.length / itemsPerPage)
  );
});

const paginatedNotifications = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredNotifications.value.slice(startIndex, endIndex);
});

const paginationStart = computed(() => {
  return filteredNotifications.value.length > 0
    ? (currentPage.value - 1) * itemsPerPage + 1
    : 0;
});

const paginationEnd = computed(() => {
  const end = currentPage.value * itemsPerPage;
  return Math.min(end, filteredNotifications.value.length);
});

const displayedPages = computed(() => {
  const pages = [];
  const maxPagesToShow = 5;
  const halfRange = Math.floor(maxPagesToShow / 2);

  let startPage = Math.max(1, currentPage.value - halfRange);
  let endPage = Math.min(totalPages.value, startPage + maxPagesToShow - 1);

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return pages;
});

const showEndEllipsis = computed(() => {
  const lastDisplayedPage =
    displayedPages.value[displayedPages.value.length - 1];
  return (
    lastDisplayedPage !== undefined && lastDisplayedPage < totalPages.value
  );
});

// API Functions
const fetchNotifications = async () => {
  loading.value = true;
  try {
    const response = await api.get<Notification[]>(
      apiService.value,
      "/notifications"
    );
    notifications.value = response || [];
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    toast.error("Bildirishnomalarni yuklashda xatolik yuz berdi");
    notifications.value = [];
  } finally {
    loading.value = false;
  }
};

// Helper functions
const formatDateTime = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const formatRelativeTime = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "Hozir";
  if (diffInMinutes < 60) return `${diffInMinutes} daqiqa oldin`;
  if (diffInHours < 24) return `${diffInHours} soat oldin`;
  if (diffInDays < 7) return `${diffInDays} kun oldin`;
  return formatDateTime(dateString);
};

// Actions
const goToCreate = () => {
  router.push("/notifications/create");
};

const viewNotification = (notification: Notification) => {
  selectedNotification.value = notification;
  isViewDialogOpen.value = true;
};

const confirmDelete = (notification: Notification) => {
  selectedNotification.value = notification;
  isDeleteDialogOpen.value = true;
};

const deleteNotification = async () => {
  if (!selectedNotification.value) {
    toast.error("Bildirishnoma tanlanmagan");
    return;
  }

  if (!selectedNotification.value.id) {
    toast.error("Bildirishnoma ID topilmadi");
    return;
  }

  try {
    await api.delete(
      apiService.value,
      `/notifications/${selectedNotification.value.id}`
    );
    toast.success("Bildirishnoma muvaffaqiyatli o'chirildi");
    isDeleteDialogOpen.value = false;
    selectedNotification.value = null;
    await fetchNotifications();
  } catch (error) {
    console.error("Failed to delete notification:", error);
    toast.error("Bildirishnomani o'chirishda xatolik yuz berdi");
  }
};

const refreshData = () => {
  fetchNotifications();
};

// Initialize data on component mount
onMounted(() => {
  fetchNotifications();
});

// Watch for filter changes and reset to page 1
watch(searchQuery, () => {
  currentPage.value = 1;
});
</script>
