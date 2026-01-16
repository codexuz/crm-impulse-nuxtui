<script setup lang="ts">
import type { Student } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const { apiService } = useAuth();
const toast = useToast();

const open = defineModel<boolean>("open");

const props = defineProps<{
  student: Student | null;
}>();

const emit = defineEmits<{
  updated: [];
}>();

const showPassword = ref(false);
const courses = ref<any[]>([]);
const isLoadingCourses = ref(false);
const isUpdating = ref(false);

const editingStudent = ref({
  first_name: "",
  last_name: "",
  username: "",
  phone: "",
  level_id: "none",
});

const courseOptions = computed(() => [
  { value: "none", label: "Yo'q" },
  ...courses.value.map((course) => ({
    value: course.id,
    label: course.title,
  })),
]);

const loadCourses = async () => {
  isLoadingCourses.value = true;
  try {
    const response = await api.get<any[]>(apiService.value, "/courses");
    courses.value = response || [];
  } catch (error) {
    console.error("Failed to load courses:", error);
    toast.add({
      title: "Xatolik",
      description: "Kurslarni yuklashda xatolik.",
      color: "error",
    });
  } finally {
    isLoadingCourses.value = false;
  }
};

const handleSubmit = async () => {
  if (!props.student) return;

  isUpdating.value = true;
  try {
    const studentData: any = { ...editingStudent.value };

    // Ensure level_id is always a string
    if (studentData.level_id === "none" || !studentData.level_id) {
      studentData.level_id = "";
    } else {
      studentData.level_id = String(studentData.level_id);
    }

    await api.patch<Student>(
      apiService.value,
      `/users/${props.student.user_id}`,
      studentData,
    );

    toast.add({
      title: "Muvaffaqiyat",
      description: "Talaba muvaffaqiyatli yangilandi",
      color: "success",
    });

    emit("updated");
    open.value = false;
  } catch (error) {
    console.error("Failed to update student:", error);
    toast.add({
      title: "Xatolik",
      description:
        "Talabani yangilashda xatolik. Iltimos, qayta urinib ko'ring.",
      color: "error",
    });
  } finally {
    isUpdating.value = false;
  }
};

// Watch for student changes to populate form
watch(
  () => props.student,
  (newStudent) => {
    if (newStudent) {
      const levelId =
        (newStudent as any).level?.id || (newStudent as any).level_id || "none";
      editingStudent.value = {
        first_name: newStudent.first_name,
        last_name: newStudent.last_name,
        username: newStudent.username,
        phone: newStudent.phone,
        level_id: levelId,
      };
    }
  },
  { immediate: true },
);

// Load courses on mount
onMounted(() => {
  loadCourses();
});
</script>

<template>
  <UModal
    v-model:open="open"
    title="Talabani tahrirlash"
    description="Talaba ma'lumotlarini yangilash"
    :ui="{ content: 'w-[calc(100vw-2rem)] max-w-2xl', footer: 'justify-end' }"
  >
    <template #body>
      <form v-if="student" @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Personal Information Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800"
          >
            <UIcon name="i-lucide-user" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Shaxsiy ma'lumotlar
            </h3>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label
                class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
              >
                Ism
                <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="editingStudent.first_name"
                placeholder="Ismni kiriting"
                icon="i-lucide-user"
                size="lg"
                required
              />
            </div>

            <div class="space-y-2">
              <label
                class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
              >
                Familiya
                <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="editingStudent.last_name"
                placeholder="Familiyani kiriting"
                icon="i-lucide-user"
                size="lg"
                required
              />
            </div>
          </div>
        </div>

        <!-- Account Information Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800"
          >
            <UIcon name="i-lucide-key-round" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Hisob ma'lumotlari
            </h3>
          </div>

          <div class="space-y-2">
            <label
              class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
            >
              Login
              <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="editingStudent.username"
              placeholder="Loginni kiriting"
              icon="i-lucide-at-sign"
              size="lg"
              required
            />
          </div>
        </div>

        <!-- Contact Information Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800"
          >
            <UIcon name="i-lucide-phone" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Aloqa ma'lumotlari
            </h3>
          </div>

          <div class="space-y-2">
            <label
              class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
            >
              Telefon raqami
              <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="editingStudent.phone"
              placeholder="+998 XX XXX XX XX"
              icon="i-lucide-phone"
              size="lg"
              required
            />
          </div>
        </div>

        <!-- Academic Information Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800"
          >
            <UIcon
              name="i-lucide-graduation-cap"
              class="w-4 h-4 text-primary"
            />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Ta'lim ma'lumotlari
            </h3>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Daraja
            </label>
            <USelectMenu
              v-model="editingStudent.level_id"
              :items="courseOptions"
              value-key="value"
              :loading="isLoadingCourses"
              placeholder="Darajani tanlang"
              size="lg"
              icon="i-lucide-book-open"
            />
          </div>
        </div>
      </form>
    </template>

    <template #footer="{ close }">
      <UButton
        type="button"
        color="neutral"
        variant="outline"
        label="Bekor qilish"
        @click="close"
      />
      <UButton
        type="submit"
        :loading="isUpdating"
        :disabled="isUpdating"
        label="O'zgarishlarni saqlash"
        @click="handleSubmit"
      />
    </template>
  </UModal>
</template>
