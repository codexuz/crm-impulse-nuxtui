<template>
  <div>
    <!-- Full page loader -->
    <div
      v-if="isLoading && isLoadingCourses && isLoadingTeachers"
      class="fixed inset-0 bg-background/80 flex items-center justify-center z-50"
    >
      <div class="text-center space-y-4">
        <Icon
          name="lucide:loader-2"
          class="h-12 w-12 animate-spin text-primary mx-auto"
        />
        <p class="text-xl font-medium">Ma'lumotlar yuklanmoqda...</p>
      </div>
    </div>

    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Guruhlar</h2>
        <p class="text-muted-foreground">
          Talabalar guruhlari va dars jadvallarini boshqarish
        </p>
      </div>
      <Dialog v-model:open="createDialog">
        <DialogTrigger as-child>
          <Button @click="createDialog = true">
            <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
            Guruh yaratish
          </Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Yangi guruh yaratish</DialogTitle>
            <DialogDescription>
              Kurs uchun yangi guruh yaratish
            </DialogDescription>
          </DialogHeader>
          <form @submit.prevent="createGroup">
            <div class="grid gap-4 py-4">
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="name" class="text-right">Guruh nomi</Label>
                <Input id="name" v-model="newGroup.name" class="col-span-3" />
              </div>
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="course_id" class="text-right">Kurs</Label>
                <Select
                  v-model="newGroup.level_id"
                  class="col-span-3"
                  :disabled="isLoadingCourses"
                >
                  <SelectTrigger id="course_id">
                    <div
                      v-if="isLoadingCourses"
                      class="flex items-center gap-2"
                    >
                      <Icon
                        name="lucide:loader-2"
                        class="h-4 w-4 animate-spin"
                      />
                      <span>Kurslar yuklanmoqda...</span>
                    </div>
                    <SelectValue v-else placeholder="Kursni tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="course in courses"
                      :key="course.id"
                      :value="course.id"
                    >
                      {{ course.title }} ({{ course.level }})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="teacher_id" class="text-right">O'qituvchi</Label>
                <Select
                  v-model="newGroup.teacher_id"
                  class="col-span-3"
                  :disabled="isLoadingTeachers"
                >
                  <SelectTrigger id="teacher_id">
                    <div
                      v-if="isLoadingTeachers"
                      class="flex items-center gap-2"
                    >
                      <Icon
                        name="lucide:loader-2"
                        class="h-4 w-4 animate-spin"
                      />
                      <span>O'qituvchilar yuklanmoqda...</span>
                    </div>
                    <SelectValue v-else placeholder="O'qituvchini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="teacher in teachers"
                      :key="teacher.user_id"
                      :value="teacher.user_id"
                    >
                      {{ teacher.first_name }} {{ teacher.last_name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" :disabled="isLoading">
                <Icon
                  v-if="isLoading"
                  name="lucide:loader-2"
                  class="mr-2 h-4 w-4 animate-spin"
                />
                {{ isLoading ? "Yaratilmoqda..." : "Guruh yaratish" }}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>

    <!-- Filters and Search -->
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <Input
        v-model="search"
        placeholder="Guruhlarni qidirish..."
        class="sm:max-w-xs"
      />
      <div class="flex flex-wrap gap-2 sm:ml-auto">
        <Select
          v-model="filterCourse"
          class="w-[180px]"
          :disabled="isLoadingCourses"
        >
          <SelectTrigger>
            <div v-if="isLoadingCourses" class="flex items-center gap-2">
              <Icon name="lucide:loader-2" class="h-4 w-4 animate-spin" />
              <span>Yuklanmoqda...</span>
            </div>
            <SelectValue v-else placeholder="Kurs bo'yicha saralash" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha kurslar</SelectItem>
            <SelectItem
              v-for="course in courses"
              :key="course.id"
              :value="course.id"
            >
              {{ course.title }} ({{ course.level }})
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          v-model="filterTeacher"
          class="w-[200px]"
          :disabled="isLoadingTeachers"
        >
          <SelectTrigger>
            <div v-if="isLoadingTeachers" class="flex items-center gap-2">
              <Icon name="lucide:loader-2" class="h-4 w-4 animate-spin" />
              <span>Yuklanmoqda...</span>
            </div>
            <SelectValue v-else placeholder="O'qituvchi bo'yicha saralash" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha o'qituvchilar</SelectItem>
            <SelectItem
              v-for="teacher in teachers"
              :key="teacher.user_id"
              :value="teacher.user_id"
            >
              {{ teacher.first_name }} {{ teacher.last_name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Groups Table -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Guruh nomi</TableHead>
            <TableHead>Kurs</TableHead>
            <TableHead>O'qituvchi</TableHead>
            <TableHead>Yaratilgan</TableHead>
            <TableHead>Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading">
            <TableCell colspan="7" class="text-center py-10">
              <div class="flex justify-center">
                <Icon
                  name="lucide:loader-2"
                  class="h-8 w-8 animate-spin text-primary"
                />
              </div>
              <p class="text-muted-foreground mt-2">Guruhlar yuklanmoqda...</p>
            </TableCell>
          </TableRow>
          <TableRow v-else-if="filteredGroups.length === 0">
            <TableCell colspan="7" class="text-center py-10">
              <div class="flex justify-center">
                <Icon
                  name="lucide:users-x"
                  class="h-8 w-8 text-muted-foreground"
                />
              </div>
              <p class="text-muted-foreground mt-2">Guruhlar topilmadi</p>
              <Button variant="link" @click="loadGroups" class="mt-2">
                Ma'lumotlarni yangilash
              </Button>
            </TableCell>
          </TableRow>
          <TableRow v-for="group in filteredGroups" :key="group.id">
            <TableCell class="font-medium">{{ group.name }}</TableCell>
            <TableCell>{{ getCourseTitle(group.level_id) }}</TableCell>
            <TableCell>{{ getTeacherName(group.teacher_id) }}</TableCell>
            <TableCell>{{ formatDate(group.createdAt) }}</TableCell>
            <TableCell>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  @click="() => navigateTo(`/groups/${group.id}`)"
                >
                  <Icon name="lucide:eye" class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" @click="editGroup(group)">
                  <Icon name="lucide:pencil" class="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon">
                      <Icon name="lucide:more-vertical" class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="manageStudents(group)">
                      <Icon name="lucide:users" class="mr-2 h-4 w-4" />
                      Talabalarni boshqarish
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @click="() => navigateTo(`/attendance/group/${group.id}`)"
                    >
                      <Icon
                        name="lucide:clipboard-check"
                        class="mr-2 h-4 w-4"
                      />
                      Davomatni olish
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @click="() => navigateTo(`/schedules/group/${group.id}`)"
                    >
                      <Icon name="lucide:calendar" class="mr-2 h-4 w-4" />
                      Jadvalni ko'rish
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      @click="confirmDeleteGroup(group)"
                      class="text-white"
                    >
                      <Icon name="lucide:trash-2" class="mr-2 h-4 w-4" />
                      O'chirish
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-end space-x-2 py-4">
      <div class="flex-1 text-sm text-muted-foreground">
        {{ paginationText }}
      </div>
      <div class="space-x-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="page === 1"
          @click="page--"
        >
          Oldingi
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="page >= totalPages"
          @click="page++"
        >
          Keyingi
        </Button>
      </div>
    </div>

    <!-- Edit Group Dialog -->
    <Dialog v-model:open="editDialog">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Guruhni tahrirlash</DialogTitle>
          <DialogDescription>
            Guruh ma'lumotlarini yangilash
          </DialogDescription>
        </DialogHeader>
        <form v-if="editingGroup" @submit.prevent="updateGroup">
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="edit_name" class="text-right">Guruh nomi</Label>
              <Input
                id="edit_name"
                v-model="editingGroup.name"
                class="col-span-3"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="edit_course_id" class="text-right">Kurs</Label>
              <Select
                v-model="editingGroup.level_id"
                class="col-span-3"
                :disabled="isLoadingCourses"
              >
                <SelectTrigger id="edit_course_id">
                  <div v-if="isLoadingCourses" class="flex items-center gap-2">
                    <Icon name="lucide:loader-2" class="h-4 w-4 animate-spin" />
                    <span>Kurslar yuklanmoqda...</span>
                  </div>
                  <SelectValue v-else placeholder="Kursni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="course in courses"
                    :key="course.id"
                    :value="course.id"
                  >
                    {{ course.title }} ({{ course.level }})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="edit_teacher_id" class="text-right">O'qituvchi</Label>
              <Select
                v-model="editingGroup.teacher_id"
                class="col-span-3"
                :disabled="isLoadingTeachers"
              >
                <SelectTrigger id="edit_teacher_id">
                  <div v-if="isLoadingTeachers" class="flex items-center gap-2">
                    <Icon name="lucide:loader-2" class="h-4 w-4 animate-spin" />
                    <span>O'qituvchilar yuklanmoqda...</span>
                  </div>
                  <SelectValue v-else placeholder="O'qituvchini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="teacher in teachers"
                    :key="teacher.user_id"
                    :value="teacher.user_id"
                  >
                    {{ teacher.first_name }} {{ teacher.last_name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="editDialog = false"
              >Bekor qilish</Button
            >
            <Button type="submit" :disabled="isUpdating">
              <Icon
                v-if="isUpdating"
                name="lucide:loader-2"
                class="mr-2 h-4 w-4 animate-spin"
              />
              {{ isUpdating ? "Yangilanmoqda..." : "Yangilash" }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="confirmDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ishonchingiz komilmi?</AlertDialogTitle>
          <AlertDialogDescription>
            Bu amalni ortga qaytarib bo'lmaydi. Bu guruh butunlay o'chiriladi va
            barcha bog'langan talabalar ro'yxati va davomat yozuvlari ham
            o'chiriladi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            @click="deleteGroup"
            class="bg-destructive text-white hover:bg-destructive/90"
          >
            <Icon
              v-if="isDeleting"
              name="lucide:loader-2"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ isDeleting ? "O'chirilmoqda..." : "O'chirish" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import type { Group, Course, Teacher, Student } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const { apiService } = useAuth();
const { toast } = useToast();

// Groups data
const groups = ref<Group[]>([]);
const courses = ref<Course[]>([]);
const teachers = ref<Teacher[]>([]);
const isLoading = ref(true);
const isLoadingCourses = ref(true);
const isLoadingTeachers = ref(true);
const page = ref(1);
const limit = ref(10);
const totalItems = ref(0);
const totalServerPages = ref(1);
const totalPages = computed(() => totalServerPages.value);

// Filters and search
const search = ref("");
const filterStatus = ref("all");
const filterCourse = ref("all");
const filterTeacher = ref("all");

// Selected group data
const selectedGroup = ref<Group | null>(null);
const viewDialog = ref(false);
const editDialog = ref(false);
const statusDialog = ref(false);
const confirmDialog = ref(false);
const createDialog = ref(false); // Add this for create dialog
const isUpdating = ref(false);
const isDeleting = ref(false);
const editingGroup = ref<Partial<Group> | null>(null);
const groupToDelete = ref<Group | null>(null);

// New group form
const newGroup = reactive({
  name: "",
  level_id: "",
  teacher_id: "",
});

// Computed
const filteredGroups = computed(() => {
  // Groups are now filtered server-side, just return them
  return groups.value;
});

const paginationText = computed(() => {
  const start = totalItems.value === 0 ? 0 : (page.value - 1) * limit.value + 1;
  const end = Math.min(page.value * limit.value, totalItems.value);
  return `${start} dan ${end} gacha, jami ${totalItems.value} ta guruh`;
});

// Methods
const loadGroups = async () => {
  isLoading.value = true;
  try {
    // Build query parameters for API
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: limit.value.toString(),
    });

    // Add search query if present
    if (search.value) {
      params.append("query", search.value);
    }

    // Add filters if present
    if (filterCourse.value && filterCourse.value !== "all") {
      params.append("level_id", filterCourse.value);
    }

    if (filterTeacher.value && filterTeacher.value !== "all") {
      params.append("teacher_id", filterTeacher.value);
    }

    const response = await api.get<{
      data: Group[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, `/groups?${params.toString()}`);

    // Update groups from API response
    groups.value = response.data || [];
    totalItems.value = response.total || 0;
    totalServerPages.value = response.totalPages || 1;
    page.value = response.page || 1;
    limit.value = response.limit || 10;
  } catch (error) {
    console.error("Failed to load groups:", error);
    toast({
      title: "Xatolik",
      description: "Guruhlarni yuklashda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
    groups.value = [];
    totalItems.value = 0;
    totalServerPages.value = 1;
  } finally {
    isLoading.value = false;
  }
};

const loadCourses = async () => {
  isLoadingCourses.value = true;
  try {
    const response = await api.get<Course[]>(apiService.value, "/courses");
    courses.value = response.filter((course) => course.isActive);
  } catch (error) {
    console.error("Failed to load courses:", error);
    toast({
      title: "Xatolik",
      description: "Kurslarni yuklashda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
  } finally {
    isLoadingCourses.value = false;
  }
};

const loadTeachers = async () => {
  isLoadingTeachers.value = true;
  try {
    // Fetch all teachers for dropdown - using high limit to get all
    const params = new URLSearchParams({
      page: "1",
      limit: "1000", // Get all teachers
    });

    const response = await api.get<{
      data: Teacher[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, `/users/teachers?${params.toString()}`);

    teachers.value = response.data || [];
  } catch (error) {
    console.error("Failed to load teachers:", error);
    toast({
      title: "Xatolik",
      description:
        "O'qituvchilarni yuklashda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
    teachers.value = [];
  } finally {
    isLoadingTeachers.value = false;
  }
};

const createGroup = async () => {
  isLoading.value = true;
  try {
    const response = await api.post<Group>(
      apiService.value,
      "/groups",
      newGroup
    );

    // Reload groups list to get fresh data
    await loadGroups();

    toast({
      title: "Muvaffaqiyat",
      description: "Guruh muvaffaqiyatli yaratildi",
    });

    // Reset form
    newGroup.name = "";
    newGroup.level_id = "";
    newGroup.teacher_id = "";

    // Close the dialog
    createDialog.value = false;
  } catch (error) {
    console.error("Failed to create group:", error);
    toast({
      title: "Xatolik",
      description: "Guruh yaratishda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const editGroup = (group: Group | null) => {
  if (!group) return;

  // Close view dialog if open
  viewDialog.value = false;

  // Clone group data for editing
  editingGroup.value = {
    ...group,
    start_date: group.start_date ? new Date(group.start_date) : new Date(),
    end_date: group.end_date ? new Date(group.end_date) : new Date(),
  };
  editDialog.value = true;
};

const updateGroup = async () => {
  if (!editingGroup.value || !editingGroup.value.id) return;

  isUpdating.value = true;
  try {
    const response = await api.patch<Group>(
      apiService.value,
      `/groups/${editingGroup.value.id}`,
      editingGroup.value
    );

    // Reload groups list to get fresh data
    await loadGroups();

    toast({
      title: "Muvaffaqiyat",
      description: "Guruh muvaffaqiyatli yangilandi",
    });

    editDialog.value = false;
  } catch (error) {
    console.error("Failed to update group:", error);
    toast({
      title: "Xatolik",
      description: "Guruhni yangilashda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
  } finally {
    isUpdating.value = false;
  }
};

const updateGroupStatus = async () => {
  if (!selectedGroup.value) return;

  isUpdating.value = true;
  try {
    await api.patch<Group>(
      apiService.value,
      `/groups/${selectedGroup.value.id}`,
      {}
    );

    // Update group status locally
    const index = groups.value.findIndex(
      (g) => g.id === selectedGroup.value?.id
    );
    if (index !== -1) {
      const updatedGroup = {
        ...groups.value[index],
        updatedAt: new Date().toISOString(),
      };
      groups.value.splice(index, 1, updatedGroup as Group);
    }

    toast({
      title: "Muvaffaqiyat",
      description: "Guruh holati muvaffaqiyatli yangilandi",
    });

    statusDialog.value = false;
  } catch (error) {
    console.error("Failed to update group status:", error);
    toast({
      title: "Xatolik",
      description:
        "Guruh holatini yangilashda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
  } finally {
    isUpdating.value = false;
  }
};

const manageStudents = (group: Group) => {
  // Close dialogs
  viewDialog.value = false;

  // Navigate to group students management
  navigateTo(`/groups/${group.id}/students`);
};

const confirmDeleteGroup = (group: Group) => {
  groupToDelete.value = group;
  confirmDialog.value = true;
};

const deleteGroup = async () => {
  if (!groupToDelete.value) return;

  isDeleting.value = true;
  try {
    // Use fetch directly for delete to handle 204 No Content
    const response = await fetch(
      `${apiService.value.baseUrl}/groups/${groupToDelete.value.id}`,
      {
        method: "DELETE",
        headers: apiService.value.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    // Reload groups list to get fresh data
    await loadGroups();

    toast({
      title: "Muvaffaqiyat",
      description: "Guruh muvaffaqiyatli o'chirildi",
    });

    confirmDialog.value = false;
  } catch (error) {
    console.error("Failed to delete group:", error);
    toast({
      title: "Xatolik",
      description: "Guruhni o'chirishda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
  } finally {
    isDeleting.value = false;
  }
};

// Helper functions
const getCourseTitle = (courseId: string): string => {
  const course = courses.value.find((c) => c.id === courseId);
  return course ? course.title : "Noma'lum kurs";
};

const getTeacherName = (teacherId: string): string => {
  const teacher = teachers.value.find((t) => t.user_id === teacherId);
  return teacher
    ? `${teacher.first_name} ${teacher.last_name}`
    : "Tayinlanmagan";
};

const formatDate = (dateString?: string | Date): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

const capitalize = (str?: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Load data on component mount
onMounted(async () => {
  isLoading.value = true;
  isLoadingCourses.value = true;
  isLoadingTeachers.value = true;

  // Get pagination parameters from URL
  const route = useRoute();
  if (route.query.page) {
    page.value = parseInt(route.query.page as string) || 1;
  }
  if (route.query.limit) {
    limit.value = parseInt(route.query.limit as string) || 10;
  }
  if (route.query.query) {
    search.value = route.query.query as string;
  }
  if (route.query.level_id) {
    filterCourse.value = route.query.level_id as string;
  }
  if (route.query.teacher_id) {
    filterTeacher.value = route.query.teacher_id as string;
  }

  // Start all data loading in parallel
  await Promise.all([loadGroups(), loadCourses(), loadTeachers()]);
});

// Navigation functions for pagination
const navigateToPage = (newPage: number) => {
  if (newPage < 1 || newPage > totalServerPages.value) return;
  page.value = newPage;
  updateUrlParams();
  loadGroups();
};

const route = useRoute();
const router = useRouter();

const updateUrlParams = () => {
  const query: Record<string, string> = {
    page: page.value.toString(),
    limit: limit.value.toString(),
  };

  if (search.value) {
    query.query = search.value;
  }
  if (filterCourse.value && filterCourse.value !== "all") {
    query.level_id = filterCourse.value;
  }
  if (filterTeacher.value && filterTeacher.value !== "all") {
    query.teacher_id = filterTeacher.value;
  }

  router.push({ query });
};

// Debounce function for search
let searchTimeout: NodeJS.Timeout | null = null;
const debouncedSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    page.value = 1;
    updateUrlParams();
    loadGroups();
  }, 500);
};

// Watch for search changes with debouncing
watch(search, () => {
  debouncedSearch();
});

// Watch for filter changes
watch([filterCourse, filterTeacher], () => {
  page.value = 1;
  updateUrlParams();
  loadGroups();
});

// Watch for page changes from pagination buttons
watch(page, (newPage, oldPage) => {
  if (newPage !== oldPage) {
    navigateToPage(newPage);
  }
});
</script>
