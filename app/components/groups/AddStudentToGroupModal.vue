<template>
  <UModal
    title="Guruhga talaba qo'shish"
    description="Mavjud talabani guruhga yozish"
    :ui="{ footer: 'justify-end' }"
  >
    <UButton
      icon="i-lucide-plus"
      label="Talaba qo'shish"
      color="primary"
      @click="openModal"
    />

    <template #body="{ close }">
      <form @submit.prevent="handleSubmit(close)" class="space-y-6">
        <!-- Student Selection Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800"
          >
            <UIcon name="i-lucide-user-plus" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Talaba tanlash
            </h3>
          </div>

          <div class="space-y-2">
            <label
              class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
            >
              Talaba
              <span class="text-red-500">*</span>
            </label>
            <USelectMenu
              v-model="selectedStudent"
              v-model:search-term="studentSearchTerm"
              :items="studentOptions"
              :loading="isLoadingStudents"
              searchable
              ignore-filter
              searchable-placeholder="Talaba ismi yoki telefon raqami..."
              placeholder="Talabani tanlang"
              size="lg"
              icon="i-lucide-user"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Qidirish uchun kamida 2 ta harf kiriting
            </p>
          </div>
        </div>

        <!-- Enrollment Information Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800"
          >
            <UIcon name="i-lucide-calendar" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Ro'yxatga olish ma'lumotlari
            </h3>
          </div>

          <div class="space-y-2">
            <label
              class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
            >
              Ro'yxatga olingan sana
              <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="enrollmentDate"
              type="date"
              icon="i-lucide-calendar"
              size="lg"
              required
            />
          </div>
        </div>

        <!-- Status Information Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800"
          >
            <UIcon name="i-lucide-check-circle" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Holat
            </h3>
          </div>

          <div class="space-y-2">
            <label
              class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
            >
              Boshlang'ich holat
              <span class="text-red-500">*</span>
            </label>
            <USelectMenu
              v-model="initialStatus"
              :items="statusOptions"
              value-key="value"
              placeholder="Holatni tanlang"
              size="lg"
              icon="i-lucide-git-branch"
            >
              <template #label>
                {{
                  statusOptions.find((s) => s.value === initialStatus)?.label ||
                  "Holatni tanlang"
                }}
              </template>
            </USelectMenu>
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
        :loading="isSubmitting"
        :disabled="!canSubmit"
        label="Qo'shish"
        @click="handleSubmit(close)"
      />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import type { Student } from "~/types";
import { refDebounced } from "@vueuse/core";

const props = defineProps<{
  groupId: string;
}>();

const emit = defineEmits<{
  submit: [];
}>();

const { apiService } = useAuth();
const toast = useToast();

// Form state
const studentSearchTerm = ref("");
const studentSearchDebounced = refDebounced(studentSearchTerm, 300);
const selectedStudent = ref<any>(null);
const enrollmentDate = ref(new Date().toISOString().split("T")[0]);
const initialStatus = ref("active");
const isSubmitting = ref(false);

// Data
const students = ref<Student[]>([]);
const isLoadingStudents = ref(false);

// Status options
const statusOptions = [
  { value: "active", label: "Faol" },
  { value: "frozen", label: "Muzlatilgan" },
];

// Computed
const studentOptions = computed(() =>
  students.value.map((student) => ({
    value: student.user_id,
    label: `${student.first_name} ${student.last_name} (${student.phone})`,
  })),
);

const canSubmit = computed(() => {
  return selectedStudent.value && enrollmentDate.value && initialStatus.value;
});

// Watch for search changes
watch(studentSearchDebounced, (query) => {
  searchStudents(query);
});

watch(selectedStudent, (student) => {
  // Handle both object and string formats
  if (student && typeof student === "object" && student.value) {
    // Object format { value: user_id, label: name }
  } else if (typeof student === "string") {
    // String format (user_id)
  }
});

// Methods
const openModal = async () => {
  // Reset search on open
  students.value = [];
  studentSearchTerm.value = "";
  selectedStudent.value = null;
};

const searchStudents = async (query: string) => {
  if (!query || query.length < 2) {
    students.value = [];
    return;
  }

  isLoadingStudents.value = true;
  try {
    const response = await api.get<{ data: Student[]; total: number }>(
      apiService.value,
      `/users/students?query=${encodeURIComponent(query)}`,
    );
    students.value = response.data || [];
  } catch (error) {
    console.error("Failed to search students:", error);
    students.value = [];
  } finally {
    isLoadingStudents.value = false;
  }
};

const handleSubmit = async (close: () => void) => {
  if (!canSubmit.value) {
    toast.add({
      title: "Xatolik",
      description: "Iltimos, barcha maydonlarni to'ldiring",
      color: "error",
    });
    return;
  }

  isSubmitting.value = true;
  try {
    const formattedDate = new Date(
      `${enrollmentDate.value}T00:00:00Z`,
    ).toISOString();

    const studentId =
      typeof selectedStudent.value === "object"
        ? selectedStudent.value.value
        : selectedStudent.value;

    await api.post(apiService.value, "/group-students", {
      group_id: props.groupId,
      student_id: studentId,
      enrolled_at: formattedDate,
      status: initialStatus.value,
    });

    toast.add({
      title: "Muvaffaqiyat",
      description: "Talaba guruhga muvaffaqiyatli qo'shildi",
      color: "success",
    });

    // Reset form
    selectedStudent.value = null;
    studentSearchTerm.value = "";
    enrollmentDate.value = new Date().toISOString().split("T")[0];
    initialStatus.value = "active";

    emit("submit");
    close();
  } catch (error) {
    console.error("Failed to add student to group:", error);
    toast.add({
      title: "Xatolik",
      description: "Talabani guruhga qo'shishda xatolik",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>
