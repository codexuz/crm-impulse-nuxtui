<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">O'qituvchilar maoshi</h2>
        <p class="text-muted-foreground">
          O'qituvchilar maoshi va to'lov ma'lumotlarini boshqarish
        </p>
      </div>
    </div>

    <div class="space-y-4">
      <!-- Teacher Selection -->
      <div class="flex items-center gap-4">
        <Input
          v-model="teacherSearch"
          placeholder="O'qituvchini qidirish..."
          class="max-w-sm"
        />
        <Select v-model="selectedTeacherId" class="flex-1">
          <SelectTrigger>
            <SelectValue placeholder="O'qituvchini tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="teacher in filteredTeachers"
              :key="teacher.user_id"
              :value="teacher.user_id"
            >
              <div class="flex items-center justify-between w-full">
                <span>{{ teacher.first_name }} {{ teacher.last_name }}</span>
                <Badge
                  v-if="teacher.teacher_profile"
                  variant="outline"
                  class="ml-2"
                >
                  {{
                    teacher.teacher_profile.payment_type === "percentage"
                      ? "Foiz"
                      : "Qat'iy"
                  }}
                </Badge>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Teacher Salary Information -->
      <Card v-if="selectedTeacher">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <Avatar class="h-16 w-16">
                <AvatarFallback class="text-lg">
                  {{
                    getInitials(
                      selectedTeacher.first_name,
                      selectedTeacher.last_name
                    )
                  }}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>
                  {{ selectedTeacher.first_name }}
                  {{ selectedTeacher.last_name }}
                </CardTitle>
                <CardDescription>
                  {{ selectedTeacher.phone }}
                </CardDescription>
              </div>
            </div>
            <Badge
              :variant="selectedTeacher.is_active ? 'default' : 'secondary'"
            >
              {{ selectedTeacher.is_active ? "Faol" : "Nofaol" }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="selectedTeacher.teacher_profile" class="space-y-6">
            <!-- Payment Information -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader class="pb-3">
                  <CardDescription>O'quvchilar soni</CardDescription>
                </CardHeader>
                <CardContent>
                  <div class="text-2xl font-bold">
                    <div
                      v-if="loadingStudentsCount"
                      class="flex items-center gap-2"
                    >
                      <Icon
                        name="lucide:loader-2"
                        class="h-6 w-6 animate-spin"
                      />
                      <span class="text-lg">Yuklanmoqda...</span>
                    </div>
                    <div v-else>{{ studentsCount }} ta o'quvchi</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader class="pb-3">
                  <CardDescription>To'lov miqdori</CardDescription>
                </CardHeader>
                <CardContent>
                  <div class="text-2xl font-bold">
                    {{
                      selectedTeacher.teacher_profile.payment_type ===
                      "percentage"
                        ? `${formatCurrency(
                            selectedTeacher.teacher_profile.payment_value
                          )} / dars`
                        : formatCurrency(
                            selectedTeacher.teacher_profile.payment_value
                          )
                    }}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader class="pb-3">
                  <CardDescription>To'lov kuni</CardDescription>
                </CardHeader>
                <CardContent>
                  <div class="text-2xl font-bold">
                    Har oyning
                    {{ selectedTeacher.teacher_profile.payment_day }}-kuni
                  </div>
                </CardContent>
              </Card>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              <Button @click="calculateSalary" variant="default">
                <Icon name="lucide:calculator" class="mr-2 h-4 w-4" />
                Maoshni hisoblash
              </Button>
              <Button @click="viewSalaryHistory" variant="outline">
                <Icon name="lucide:history" class="mr-2 h-4 w-4" />
                Maosh tarixi
              </Button>
              <Button @click="navigateToTeacherDetail" variant="outline">
                <Icon name="lucide:user" class="mr-2 h-4 w-4" />
                Profil
              </Button>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <Icon
              name="lucide:alert-circle"
              class="h-12 w-12 text-muted-foreground mx-auto mb-3"
            />
            <p class="text-muted-foreground">
              Bu o'qituvchi uchun maosh profili yaratilmagan
            </p>
            <Button @click="createSalaryProfile" class="mt-4">
              <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
              Maosh profilini yaratish
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Empty State -->
      <Card v-else>
        <CardContent class="py-10">
          <div class="text-center">
            <Icon
              name="lucide:user-search"
              class="h-16 w-16 text-muted-foreground mx-auto mb-4"
            />
            <h3 class="text-lg font-semibold mb-2">O'qituvchini tanlang</h3>
            <p class="text-muted-foreground">
              Maosh ma'lumotlarini ko'rish uchun yuqoridan o'qituvchini tanlang
            </p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Edit Salary Dialog -->
    <Dialog v-model:open="editDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Maoshni tahrirlash</DialogTitle>
          <DialogDescription>
            O'qituvchi maosh ma'lumotlarini yangilash
          </DialogDescription>
        </DialogHeader>
        <form v-if="editingProfile" @submit.prevent="updateSalary">
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="payment_type" class="text-right">To'lov turi</Label>
              <Select v-model="editingProfile.payment_type" class="col-span-3">
                <SelectTrigger id="payment_type">
                  <SelectValue placeholder="To'lov turini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Foiz asosida</SelectItem>
                  <SelectItem value="fixed">Qat'iy maosh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="payment_value" class="text-right">Miqdor</Label>
              <Input
                id="payment_value"
                v-model="editingProfile.payment_value"
                type="number"
                step="1"
                class="col-span-3"
              />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="payment_day" class="text-right">To'lov kuni</Label>
              <Input
                id="payment_day"
                v-model="editingProfile.payment_day"
                type="number"
                min="1"
                max="31"
                class="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="editDialog = false">
              Bekor qilish
            </Button>
            <Button type="submit" :disabled="isUpdating">
              <Icon
                v-if="isUpdating"
                name="lucide:loader-2"
                class="mr-2 h-4 w-4 animate-spin"
              />
              {{ isUpdating ? "Saqlanmoqda..." : "Saqlash" }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from "vue";
import { useAuth } from "~/composables/useAuth";

import { api } from "~/lib/api";

const { apiService } = useAuth();
const { toast } = useToast();
const router = useRouter();

interface TeacherProfile {
  id: string;
  user_id: string;
  payment_type: "percentage" | "fixed";
  payment_value: number;
  payment_day: number;
  createdAt: string;
  updatedAt: string;
}

interface Teacher {
  user_id: string;
  username: string;
  level_id: string | null;
  phone: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  last_login: string;
  currentSessionId: string;
  roles: any[];
  teacher_profile: TeacherProfile | null;
}

// State
const teachers = ref<Teacher[]>([]);
const isLoading = ref(true);
const teacherSearch = ref("");
const selectedTeacherId = ref<string>("");
const editDialog = ref(false);
const editingProfile = ref<TeacherProfile | null>(null);
const isUpdating = ref(false);
const studentsCount = ref(0);
const loadingStudentsCount = ref(false);

// Computed
const filteredTeachers = computed(() => {
  if (!teacherSearch.value) {
    return teachers.value;
  }

  const searchLower = teacherSearch.value.toLowerCase();
  return teachers.value.filter(
    (teacher) =>
      teacher.first_name?.toLowerCase().includes(searchLower) ||
      teacher.last_name?.toLowerCase().includes(searchLower) ||
      `${teacher.first_name} ${teacher.last_name}`
        .toLowerCase()
        .includes(searchLower) ||
      teacher.phone?.includes(teacherSearch.value) ||
      teacher.username?.toLowerCase().includes(searchLower)
  );
});

const selectedTeacher = computed(() => {
  if (!selectedTeacherId.value) return null;
  return teachers.value.find((t) => t.user_id === selectedTeacherId.value);
});

// Watch for teacher selection change
watch(selectedTeacherId, async (newTeacherId) => {
  if (newTeacherId) {
    await loadStudentsCount(newTeacherId);
  } else {
    studentsCount.value = 0;
  }
});

// Methods
const loadTeachers = async () => {
  isLoading.value = true;
  try {
    const response = await api.get<Teacher[]>(
      apiService.value,
      "/users/teachers"
    );
    teachers.value = response;
  } catch (error) {
    console.error("Failed to load teachers:", error);
    toast({
      title: "Xatolik",
      description:
        "O'qituvchilarni yuklashda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const loadStudentsCount = async (teacherId: string) => {
  loadingStudentsCount.value = true;
  try {
    const response = await api.get<{ count: number }>(
      apiService.value,
      `/group-students/teacher/${teacherId}/count`
    );
    studentsCount.value = response.count || 0;
  } catch (error) {
    console.error("Failed to load students count:", error);
    studentsCount.value = 0;
    toast({
      title: "Xatolik",
      description: "O'quvchilar sonini yuklashda xatolik.",
      variant: "destructive",
    });
  } finally {
    loadingStudentsCount.value = false;
  }
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.charAt(0) || ""}${
    lastName?.charAt(0) || ""
  }`.toUpperCase();
};

const formatCurrency = (amount: number) => {
  return (
    new Intl.NumberFormat("uz-UZ", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(amount) + " so'm"
  );
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("uz-UZ");
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("uz-UZ");
};

const calculateSalary = () => {
  if (!selectedTeacherId.value) return;
  router.push(`/salaries/teacher/${selectedTeacherId.value}`);
};

const updateSalary = async () => {
  if (!editingProfile.value) return;

  isUpdating.value = true;
  try {
    // API call to update teacher salary profile would go here
    // const response = await api.patch(
    //   apiService.value,
    //   `/teacher-profiles/${editingProfile.value.id}`,
    //   editingProfile.value
    // );

    toast({
      title: "Muvaffaqiyat",
      description: "Maosh ma'lumotlari muvaffaqiyatli yangilandi",
    });

    editDialog.value = false;
    await loadTeachers();
  } catch (error) {
    console.error("Failed to update salary:", error);
    toast({
      title: "Xatolik",
      description: "Maoshni yangilashda xatolik. Qaytadan urinib ko'ring.",
      variant: "destructive",
    });
  } finally {
    isUpdating.value = false;
  }
};

const createSalaryProfile = () => {
  toast({
    title: "Tez orada",
    description: "Maosh profili yaratish funksiyasi tez orada qo'shiladi",
  });
};

const viewSalaryHistory = () => {
  if (!selectedTeacherId.value) return;
  router.push(`/salaries/history?teacher=${selectedTeacherId.value}`);
};

const navigateToTeacherDetail = () => {
  if (!selectedTeacher.value) return;
  const searchName = selectedTeacher.value.first_name.toLowerCase();
  router.push(`/teachers/profile?search=${searchName}`);
};

// Lifecycle
onMounted(() => {
  loadTeachers();
});
</script>
