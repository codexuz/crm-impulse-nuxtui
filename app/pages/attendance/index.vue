<template>
  <div>
    <!-- Full page loader -->
    <div
      v-if="isLoading"
      class="fixed inset-0 bg-background/80 flex items-center justify-center z-50"
    >
      <div class="text-center space-y-4">
        <Icon
          name="lucide:loader-2"
          class="h-12 w-12 animate-spin text-primary mx-auto"
        />
        <p class="text-xl font-medium">Davomat yozuvlari yuklanmoqda...</p>
      </div>
    </div>

    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Davomat boshqaruvi</h2>
        <p class="text-muted-foreground">
          Barcha guruhlar uchun talabalar davomatini kuzatish va boshqarish
        </p>
      </div>
      <div>
        <Dialog v-model:open="addDialog">
          <DialogTrigger as-child>
            <Button>
              <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
              Davomatni qayd qilish
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Yangi davomatni qayd qilish</DialogTitle>
              <DialogDescription>
                Talaba uchun yangi davomat yozuvini yaratish
              </DialogDescription>
            </DialogHeader>
            <form @submit.prevent="createAttendanceRecord" class="py-4">
              <div class="grid gap-4">
                <div>
                  <Label for="teacher-select">O'qituvchi</Label>
                  <Select
                    v-model="newAttendance.teacher_id"
                    class="w-full mt-1"
                  >
                    <SelectTrigger id="teacher-select">
                      <SelectValue placeholder="O'qituvchini tanlang" />
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

                <div>
                  <Label for="group-select">Guruh</Label>
                  <Select
                    v-model="newAttendance.group_id"
                    class="w-full mt-1"
                    :disabled="!newAttendance.teacher_id"
                  >
                    <SelectTrigger id="group-select">
                      <SelectValue
                        :placeholder="
                          !newAttendance.teacher_id
                            ? 'Avval o\'qituvchini tanlang'
                            : 'Guruhni tanlang'
                        "
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="group in filteredGroupsForTeacher"
                        :key="group.id"
                        :value="group.id"
                      >
                        {{ group.name }}
                      </SelectItem>
                      <div
                        v-if="
                          newAttendance.teacher_id &&
                          filteredGroupsForTeacher.length === 0
                        "
                        class="py-2 px-2 text-center text-muted-foreground"
                      >
                        Bu o'qituvchiga guruhlar topilmadi
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label for="student-select">Talaba</Label>
                  <div class="relative">
                    <Select
                      v-model="newAttendance.student_id"
                      class="w-full mt-1"
                      :disabled="isLoadingStudents || !newAttendance.group_id"
                    >
                      <SelectTrigger id="student-select">
                        <div class="flex items-center gap-2">
                          <Icon
                            v-if="isLoadingStudents"
                            name="lucide:loader-2"
                            class="h-4 w-4 animate-spin"
                          />
                          <SelectValue
                            :placeholder="
                              !newAttendance.group_id
                                ? 'Avval guruhni tanlang'
                                : 'Talabani tanlang'
                            "
                          />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="student in filteredStudents"
                          :key="student.user_id"
                          :value="student.user_id"
                        >
                          {{ student.first_name }} {{ student.last_name }}
                        </SelectItem>
                        <div
                          v-if="isLoadingStudents"
                          class="flex items-center justify-center py-2"
                        >
                          <Icon
                            name="lucide:loader-2"
                            class="h-4 w-4 animate-spin mr-2"
                          />
                          Talabalar yuklanmoqda...
                        </div>
                        <div
                          v-else-if="
                            newAttendance.group_id &&
                            (!filteredStudents || filteredStudents.length === 0)
                          "
                          class="py-2 px-2 text-center text-muted-foreground"
                        >
                          Ushbu guruhda talabalar topilmadi
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label for="status-select">Holat</Label>
                  <Select v-model="newAttendance.status" class="w-full mt-1">
                    <SelectTrigger id="status-select">
                      <SelectValue placeholder="Davomat holatini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Keldi</SelectItem>
                      <SelectItem value="absent">Kelmadi</SelectItem>
                      <SelectItem value="late">Kechikdi</SelectItem>
                      <SelectItem value="excused">Sababli</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label for="date-input">Sana</Label>
                  <Input
                    id="date-input"
                    v-model="newAttendance.date"
                    type="date"
                    class="w-full mt-1"
                  />
                </div>

                <div>
                  <Label for="note-input">Izoh (Ixtiyoriy)</Label>
                  <Textarea
                    id="note-input"
                    v-model="newAttendance.note"
                    placeholder="Qo'shimcha ma'lumotlar qo'shing..."
                    class="w-full mt-1"
                  />
                </div>
              </div>

              <DialogFooter class="mt-6">
                <Button
                  variant="outline"
                  type="button"
                  @click="addDialog = false"
                >
                  Bekor qilish
                </Button>
                <Button type="submit" :disabled="isCreating">
                  <Icon
                    v-if="isCreating"
                    name="lucide:loader-2"
                    class="mr-2 h-4 w-4 animate-spin"
                  />
                  {{ isCreating ? "Saqlanmoqda..." : "Davomatni qayd qilish" }}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="space-y-4 mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative w-full sm:w-auto sm:flex-1">
          <Icon
            name="lucide:search"
            class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <Input
            v-model="search"
            placeholder="Talaba, guruh yoki holat bo'yicha qidirish..."
            class="w-full pl-9"
          />
        </div>

        <Button
          variant="outline"
          @click="loadAttendanceRecords"
          class="flex-shrink-0"
        >
          <Icon name="lucide:refresh-cw" class="h-4 w-4 mr-2" />
          Yangilash
        </Button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="w-full">
          <Select v-model="teacherFilter" class="w-full">
            <SelectTrigger class="h-10">
              <div class="flex items-center">
                <Icon
                  name="lucide:graduation-cap"
                  class="h-4 w-4 mr-2 text-muted-foreground"
                />
                <SelectValue placeholder="O'qituvchi bo'yicha saralash" />
              </div>
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

        <div class="w-full">
          <Select v-model="groupFilter" class="w-full">
            <SelectTrigger class="h-10">
              <div class="flex items-center">
                <Icon
                  name="lucide:users"
                  class="h-4 w-4 mr-2 text-muted-foreground"
                />
                <SelectValue placeholder="Guruh bo'yicha saralash" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha guruhlar</SelectItem>
              <SelectItem
                v-for="group in availableGroupsForFilter"
                :key="group.id"
                :value="group.id"
              >
                {{ group.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="w-full">
          <Select v-model="statusFilter" class="w-full">
            <SelectTrigger class="h-10">
              <div class="flex items-center">
                <Icon
                  name="lucide:check-circle"
                  class="h-4 w-4 mr-2 text-muted-foreground"
                />
                <SelectValue placeholder="Holat bo'yicha saralash" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha holatlar</SelectItem>
              <SelectItem value="present">Keldi</SelectItem>
              <SelectItem value="absent">Kelmadi</SelectItem>
              <SelectItem value="late">Kechikdi</SelectItem>
              <SelectItem value="excused">Sababli</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="w-full">
          <div class="flex items-center space-x-2">
            <div class="w-1/2">
              <Label for="date-from" class="text-xs">Dan</Label>
              <Input
                id="date-from"
                type="date"
                v-model="dateFrom"
                class="h-10"
              />
            </div>
            <div class="w-1/2">
              <Label for="date-to" class="text-xs">Gacha</Label>
              <Input id="date-to" type="date" v-model="dateTo" class="h-10" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Attendance Table -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sana</TableHead>
            <TableHead>Talaba</TableHead>
            <TableHead>Guruh</TableHead>
            <TableHead>O'qituvchi</TableHead>
            <TableHead>Holat</TableHead>
            <TableHead>Izoh</TableHead>
            <TableHead>Amallar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading || attendance.length === 0">
            <TableCell colspan="7" class="text-center py-10">
              <div v-if="isLoading" class="flex justify-center">
                <Icon
                  name="lucide:loader-2"
                  class="h-8 w-8 animate-spin text-primary"
                />
              </div>
              <div v-else class="flex justify-center">
                <Icon
                  name="lucide:calendar-x"
                  class="h-8 w-8 text-muted-foreground"
                />
              </div>
              <p class="text-muted-foreground mt-2">
                {{
                  isLoading
                    ? "Davomat yozuvlari yuklanmoqda..."
                    : "Davomat yozuvlari topilmadi"
                }}
              </p>
              <Button
                v-if="!isLoading"
                variant="link"
                @click="loadAttendanceRecords"
                class="mt-2"
              >
                Ma'lumotlarni yangilash
              </Button>
            </TableCell>
          </TableRow>
          <TableRow
            v-for="record in attendance"
            :key="record.id"
            class="hover:bg-muted/50"
          >
            <TableCell>{{ formatDate(record.date) }}</TableCell>
            <TableCell>{{
              record.student
                ? `${record.student.first_name} ${record.student.last_name}`
                : "Noma'lum talaba"
            }}</TableCell>
            <TableCell>{{
              record.group ? record.group.name : "Noma'lum guruh"
            }}</TableCell>
            <TableCell>{{
              record.teacher
                ? `${record.teacher.first_name} ${record.teacher.last_name}`
                : "Noma'lum o'qituvchi"
            }}</TableCell>
            <TableCell>
              <Badge :variant="getStatusVariant(record.status)">
                {{ capitalizeFirstLetter(record.status) }}
              </Badge>
            </TableCell>
            <TableCell class="max-w-[200px] truncate" :title="record.note">
              {{ record.note || "—" }}
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  @click="editAttendanceRecord(record)"
                  title="Tahrirlash"
                >
                  <Icon name="lucide:pencil" class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  @click="confirmDeleteRecord(record)"
                  title="O'chirish"
                >
                  <Icon name="lucide:trash-2" class="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between py-4">
      <div class="text-sm text-muted-foreground">
        <span class="font-medium">{{ paginationStart }}</span> dan
        <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
        <span class="font-medium">{{ totalRecords }}</span> ta yozuv
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="page === 1"
          @click="navigateToPage(page - 1)"
        >
          <Icon name="lucide:chevron-left" class="h-4 w-4" />
        </Button>
        <div class="text-sm mx-2">
          {{ page }}-sahifa, jami {{ totalPages || 1 }}
        </div>
        <Button
          variant="outline"
          size="sm"
          :disabled="page >= totalPages"
          @click="navigateToPage(page + 1)"
        >
          <Icon name="lucide:chevron-right" class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Edit Attendance Dialog -->
    <Dialog v-model:open="editDialog">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Davomat yozuvini tahrirlash</DialogTitle>
          <DialogDescription>
            Davomat ma'lumotlarini yangilash
          </DialogDescription>
        </DialogHeader>
        <form
          v-if="editingAttendance"
          @submit.prevent="updateAttendanceRecord"
          class="py-4"
        >
          <div class="grid gap-4">
            <div>
              <Label for="edit-status-select">Holat</Label>
              <Select v-model="editingAttendance.status" class="w-full mt-1">
                <SelectTrigger id="edit-status-select">
                  <SelectValue placeholder="Davomat holatini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Keldi</SelectItem>
                  <SelectItem value="absent">Kelmadi</SelectItem>
                  <SelectItem value="late">Kechikdi</SelectItem>
                  <SelectItem value="excused">Sababli</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label for="edit-date-input">Sana</Label>
              <Input
                id="edit-date-input"
                v-model="editingAttendance.date"
                type="date"
                class="w-full mt-1"
              />
            </div>

            <div>
              <Label for="edit-note-input">Izoh (Ixtiyoriy)</Label>
              <Textarea
                id="edit-note-input"
                v-model="editingAttendance.note"
                placeholder="Qo'shimcha ma'lumotlar qo'shing..."
                class="w-full mt-1"
              />
            </div>
          </div>

          <DialogFooter class="mt-6">
            <Button variant="outline" type="button" @click="editDialog = false">
              Bekor qilish
            </Button>
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
            Bu amalni ortga qaytarib bo'lmaydi. Bu davomat yozuvi butunlay
            o'chiriladi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          <AlertDialogAction
            @click="deleteAttendanceRecord"
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
import { ref, computed, onMounted, watch } from "vue";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

// Types
interface Attendance {
  id: string;
  group_id: string;
  student_id: string;
  teacher_id: string;
  status: "present" | "absent" | "late" | "excused";
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  student?: {
    user_id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  teacher?: {
    user_id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  group?: {
    id: string;
    name: string;
    teacher_id: string;
    level_id: string;
    days: string | null;
    lesson_start: string | null;
    lesson_end: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

interface Group {
  id: string;
  name: string;
  teacher_id?: string;
}

interface Student {
  user_id: string;
  first_name: string;
  last_name: string;
}

interface Teacher {
  user_id: string;
  first_name: string;
  last_name: string;
}

const { apiService } = useAuth();
const toast  = useToast();

// Helper functions (defined early to avoid "Cannot access before initialization" errors)
const formatDateForInput = (date: Date): string => {
  if (!date) {
    const today = new Date();
    const formatted = today.toISOString().split("T")[0];
    return formatted || ""; // Ensure we return a string even if split returns undefined
  }
  const formatted = date.toISOString().split("T")[0];
  return formatted || ""; // Ensure we return a string even if split returns undefined
};

// Data
const attendance = ref<Attendance[]>([]);
const groups = ref<Group[]>([]);
const students = ref<Student[]>([]);
const groupStudents = ref<{ [groupId: string]: Student[] }>({});
const teachers = ref<Teacher[]>([]);
const groupTeachers = ref<{ [groupId: string]: Teacher[] }>({});
const isLoading = ref(true);
const isLoadingStudents = ref(false);
const isLoadingTeachers = ref(false);
const search = ref("");
const groupFilter = ref("all");
const teacherFilter = ref("all");
const statusFilter = ref("all");
const limit = ref(10);
const page = ref(1);
const totalRecords = ref(0);
const totalPages = ref(1);

// Date range filter - use individual date inputs
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const dateFrom = ref(formatDateForInput(thirtyDaysAgo));
const dateTo = ref(formatDateForInput(new Date()));

// Add attendance dialog
const addDialog = ref(false);
const isCreating = ref(false);
const newAttendance = ref({
  group_id: "",
  student_id: "",
  teacher_id: "",
  status: "present" as "present" | "absent" | "late" | "excused",
  note: "",
  date: new Date().toISOString().split("T")[0], // Today's date
});

// Edit attendance dialog
const editDialog = ref(false);
const isUpdating = ref(false);
const editingAttendance = ref<Attendance | null>(null);

// Delete confirmation dialog
const confirmDialog = ref(false);
const isDeleting = ref(false);
const recordToDelete = ref<Attendance | null>(null);

// Computed properties
const paginationStart = computed(() => {
  return totalRecords.value === 0 ? 0 : (page.value - 1) * limit.value + 1;
});

const paginationEnd = computed(() => {
  return Math.min(page.value * limit.value, totalRecords.value);
});

const filteredStudents = computed(() => {
  if (!newAttendance.value.group_id) return students.value;

  // If we have cached students for this group, use them
  if (groupStudents.value[newAttendance.value.group_id]) {
    return groupStudents.value[newAttendance.value.group_id];
  }

  // Return empty array while loading
  return [];
});

const filteredGroupsForTeacher = computed(() => {
  if (!newAttendance.value.teacher_id) return [];
  return groups.value.filter(
    (g) => g.teacher_id === newAttendance.value.teacher_id
  );
});

// Watch for changes to the selected teacher to reset group and student
watch(
  () => newAttendance.value.teacher_id,
  () => {
    // Reset group and student selection when teacher changes
    newAttendance.value.group_id = "";
    newAttendance.value.student_id = "";
  }
);

// Watch for changes to the selected group and load students
watch(
  () => newAttendance.value.group_id,
  async (newGroupId) => {
    if (newGroupId) {
      // Reset student selection when group changes
      newAttendance.value.student_id = "";

      // Load students for this group if not already loaded
      if (!groupStudents.value[newGroupId]) {
        await loadGroupStudents(newGroupId);
      }
    }
  }
);

// Filter groups based on selected teacher
const availableGroupsForFilter = computed(() => {
  if (teacherFilter.value === "all") {
    return groups.value;
  }
  return groups.value.filter((g) => g.teacher_id === teacherFilter.value);
});

// Watch for teacher filter changes to reset group filter
watch(teacherFilter, () => {
  groupFilter.value = "all";
});

// Watch for search changes with debouncing
watch(search, () => {
  debouncedSearch();
});

// Watch for filter changes to reload data
watch([groupFilter, teacherFilter, statusFilter, dateFrom, dateTo], () => {
  page.value = 1; // Reset to first page
  loadAttendanceRecords();
});

// Watch for page changes
watch(page, () => {
  loadAttendanceRecords();
});

// Methods
const loadAttendanceRecords = async () => {
  isLoading.value = true;
  try {
    // Build  query parameters
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: limit.value.toString(),
    });

    // Add search query if present
    if (search.value) {
      params.append("query", search.value);
    }

    // Add filters
    if (groupFilter.value !== "all") {
      params.append("group_id", groupFilter.value);
    }

    if (teacherFilter.value !== "all") {
      params.append("teacher_id", teacherFilter.value);
    }

    if (statusFilter.value !== "all") {
      params.append("status", statusFilter.value);
    }

    // Add date range filters
    if (dateFrom.value) {
      params.append("date_from", dateFrom.value);
    }

    if (dateTo.value) {
      params.append("date_to", dateTo.value);
    }

    // Load attendance records with pagination
    const response = await api.get<{
      data: Attendance[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, `/attendance?${params.toString()}`);

    attendance.value = response.data || [];
    totalRecords.value = response.total || 0;
    totalPages.value = response.totalPages || 1;

    // Load groups and teachers for dropdowns (only once)
    if (groups.value.length === 0) {
      await loadGroups();
    }
    if (teachers.value.length === 0) {
      await loadTeachers();
    }
  } catch (error) {
    console.error("Failed to load attendance records:", error);
    toast.add({
      title: "Xatolik",
      description:
        "Davomat yozuvlarini yuklashda xatolik. Qaytadan urinib ko'ring.",
    });
  } finally {
    isLoading.value = false;
  }
};

const navigateToPage = (newPage: number) => {
  if (newPage < 1 || newPage > totalPages.value) return;
  page.value = newPage;
};

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1; // Reset to first page on search
    loadAttendanceRecords();
  }, 500);
};

const loadGroups = async () => {
  try {
    const params = new URLSearchParams({
      page: "1",
      limit: "1000", // Get all groups for dropdown
    });
    const response = await api.get<{
      data: Group[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, `/groups?${params.toString()}`);
    groups.value = response.data || [];
  } catch (error) {
    console.error("Failed to load groups:", error);
  }
};

const loadStudents = async () => {
  try {
    const params = new URLSearchParams({
      page: "1",
      limit: "1000", // Get all students for dropdown
    });
    const response = await api.get<{
      data: Student[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, `/users/students?${params.toString()}`);
    students.value = response.data || [];
  } catch (error) {
    console.error("Failed to load students:", error);
  }
};

const loadTeachers = async () => {
  try {
    const params = new URLSearchParams({
      page: "1",
      limit: "1000", // Get all teachers for dropdown
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
  }
};

// Interface for group students from API
interface GroupStudent {
  id: string;
  group_id: string;
  student_id: string;
  enrolled_at: string;
  status: string;
}

// Interface for group students with nested data
interface GroupStudentWithData {
  id: string;
  group_id: string;
  student_id: string;
  enrolled_at: string;
  status: string;
  student?: {
    user_id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

const loadGroupStudents = async (groupId: string) => {
  isLoadingStudents.value = true;
  try {
    // Get all students in the group with nested student data
    const response = await api.get<GroupStudentWithData[]>(
      apiService.value,
      `/group-students/group/${groupId}`
    );

    // Extract student details from nested data
    const groupStudentDetails: Student[] = response
      .filter((gs) => gs.student)
      .map((gs) => ({
        user_id: gs.student!.user_id,
        first_name: gs.student!.first_name,
        last_name: gs.student!.last_name,
      }));

    // Store the students for this group
    groupStudents.value[groupId] = groupStudentDetails;

    // Also load all students if not already loaded (for fallback)
    if (students.value.length === 0) {
      await loadStudents();
    }
  } catch (error) {
    console.error(`Failed to load students for group ${groupId}:`, error);
    toast.add({
      title: "Xatolik",
      description:
        "Ushbu guruh uchun talabalarni yuklashda xatolik. Qaytadan urinib ko'ring.",
    });
  } finally {
    isLoadingStudents.value = false;
  }
};

const loadGroupTeachers = async (groupId: string) => {
  isLoadingTeachers.value = true;
  try {
    // Get teachers for the specific group
    const response = await api.get<Teacher[]>(
      apiService.value,
      `/groups/${groupId}/teacher`
    );

    // Store the teachers for this group
    groupTeachers.value[groupId] = response;
  } catch (error) {
    console.error(`Failed to load teachers for group ${groupId}:`, error);
    toast.add({
      title: "Xatolik",
      description:
        "Ushbu guruh uchun o'qituvchilarni yuklashda xatolik. Qaytadan urinib ko'ring.",
    });
    // Use all teachers as fallback
    groupTeachers.value[groupId] = teachers.value;
  } finally {
    isLoadingTeachers.value = false;
  }
};

const createAttendanceRecord = async () => {
  if (!validateAttendanceForm()) return;

  isCreating.value = true;
  try {
    // Format the date to match the expected format (YYYY-MM-DD)
    const formattedDate = newAttendance.value.date;

    const response = await api.post<Attendance>(
      apiService.value,
      "/attendance",
      {
        group_id: newAttendance.value.group_id,
        student_id: newAttendance.value.student_id,
        teacher_id: newAttendance.value.teacher_id,
        status: newAttendance.value.status,
        note: newAttendance.value.note,
        date: formattedDate,
      }
    );

    // Reload attendance records to get fresh data with nested relationships
    await loadAttendanceRecords();

    toast.add({
      title: "Muvaffaqiyat",
      description: "Davomat yozuvi muvaffaqiyatli yaratildi",
    });

    // Reset form and close dialog
    resetAttendanceForm();
    addDialog.value = false;
  } catch (error) {
    console.error("Failed to create attendance record:", error);
    toast.add({
      title: "Xatolik",
      description:
        "Davomat yozuvini yaratishda xatolik. Qaytadan urinib ko'ring.",
    });
  } finally {
    isCreating.value = false;
  }
};

const validateAttendanceForm = () => {
  const required: (keyof typeof newAttendance.value)[] = [
    "group_id",
    "student_id",
    "teacher_id",
    "status",
    "date",
  ];
  const missing = required.filter((field) => !newAttendance.value[field]);

  if (missing.length > 0) {
    toast.add({
      title: "Tekshirish xatosi",
      description: `Iltimos, barcha majburiy maydonlarni to'ldiring: ${missing.join(
        ", "
      )}`,
    });
    return false;
  }

  return true;
};

const resetAttendanceForm = () => {
  newAttendance.value = {
    group_id: "",
    student_id: "",
    teacher_id: "",
    status: "present",
    note: "",
    date: new Date().toISOString().split("T")[0],
  };
};

const editAttendanceRecord = (record: Attendance) => {
  editingAttendance.value = { ...record };
  editDialog.value = true;
};

const updateAttendanceRecord = async () => {
  if (!editingAttendance.value) return;

  isUpdating.value = true;
  try {
    const response = await api.patch<Attendance>(
      apiService.value,
      `/attendance/${editingAttendance.value.id}`,
      {
        status: editingAttendance.value.status,
        note: editingAttendance.value.note,
        date: editingAttendance.value.date,
      }
    );

    // Reload attendance records to get fresh data
    await loadAttendanceRecords();

    toast.add({
      title: "Muvaffaqiyat",
      description: "Davomat yozuvi muvaffaqiyatli yangilandi",
    });

    editDialog.value = false;
  } catch (error) {
    console.error("Failed to update attendance record:", error);
    toast.add({
      title: "Xatolik",
      description:
        "Davomat yozuvini yangilashda xatolik. Qaytadan urinib ko'ring.",
    });
  } finally {
    isUpdating.value = false;
  }
};

const confirmDeleteRecord = (record: Attendance) => {
  recordToDelete.value = record;
  confirmDialog.value = true;
};

const deleteAttendanceRecord = async () => {
  if (!recordToDelete.value) return;

  isDeleting.value = true;
  try {
    await api.delete(
      apiService.value,
      `/attendance/${recordToDelete.value.id}`
    );

    // Reload attendance records to get fresh data
    await loadAttendanceRecords();

    toast.add({
      title: "Muvaffaqiyat",
      description: "Davomat yozuvi muvaffaqiyatli o'chirildi",
    });

    confirmDialog.value = false;
  } catch (error) {
    console.error("Failed to delete attendance record:", error);
    toast.add({
      title: "Xatolik",
      description:
        "Davomat yozuvini o'chirishda xatolik. Qaytadan urinib ko'ring.",
    });
  } finally {
    isDeleting.value = false;
  }
};

// Helper functions
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const getStatusVariant = (status: string): string => {
  switch (status) {
    case "present":
      return "success";
    case "absent":
      return "destructive";
    case "late":
      return "warning";
    case "excused":
      return "default";
    default:
      return "outline";
  }
};

// Load data on component mount
onMounted(async () => {
  await loadAttendanceRecords();
});
</script>
