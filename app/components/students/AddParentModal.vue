<script setup lang="ts">
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import type { Student } from "~/types";
import { refDebounced } from "@vueuse/core";

const { apiService } = useAuth();
const toast = useToast();

const emit = defineEmits<{
  submit: [parent: any];
}>();

const students = ref<Student[]>([]);
const studentSearchTerm = ref("");
const studentSearchDebounced = refDebounced(studentSearchTerm, 300);
const isLoadingStudents = ref(false);
const selectedStudent = ref<any>(null);

const newParent = reactive({
  student_id: "",
  full_name: "",
  phone_number: "",
  additional_number: "",
});

const studentOptions = computed(() =>
  students.value.map((student) => ({
    value: student.user_id,
    label: `${student.first_name} ${student.last_name} (${student.phone})`,
  })),
);

const isLoading = ref(false);

const searchStudents = async (query: string) => {
  if (!query || query.length < 2) {
    students.value = [];
    return;
  }

  isLoadingStudents.value = true;
  try {
    const response = await api.get<{
      data: Student[];
      total: number;
    }>(
      apiService.value,
      `/users/students?query=${encodeURIComponent(query)}&limit=20`,
    );
    students.value = response.data || [];
  } catch (error) {
    console.error("Failed to search students:", error);
    toast.add({
      title: "Xatolik",
      description: "Talabalarni qidirishda xatolik.",
      color: "error",
    });
  } finally {
    isLoadingStudents.value = false;
  }
};

watch(studentSearchDebounced, (query) => {
  searchStudents(query);
});

watch(selectedStudent, (student) => {
  if (student && typeof student === "object" && student.value) {
    newParent.student_id = student.value;
  } else if (typeof student === "string") {
    newParent.student_id = student;
  }
});

const handleSubmit = () => {
  emit("submit", { ...newParent });
  // Reset form
  Object.keys(newParent).forEach((key) => {
    newParent[key as keyof typeof newParent] = "";
  });
  students.value = [];
  studentSearchTerm.value = "";
  selectedStudent.value = null;
};
</script>

<template>
  <UModal
    title="Yangi ota-ona qo'shish"
    description="Talaba uchun ota-ona ma'lumotlarini qo'shish"
    :ui="{ footer: 'justify-end' }"
  >
    <UButton icon="i-lucide-plus" label="Ota-ona qo'shish" color="primary" />

    <template #body="{ close }">
      <form
        @submit.prevent="
          handleSubmit();
          close();
        "
        class="space-y-6"
      >
        <!-- Student Selection Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800"
          >
            <UIcon
              name="i-lucide-graduation-cap"
              class="w-4 h-4 text-primary"
            />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Talaba
            </h3>
          </div>

          <UFormField
            label="Talabani tanlang"
            required
            hint="Qidirish uchun kamida 2 ta harf kiriting"
          >
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
              required
              class="w-full"
            />
          </UFormField>
        </div>

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

          <UFormField label="To'liq ismi" required>
            <UInput
              v-model="newParent.full_name"
              placeholder="To'liq ismini kiriting"
              icon="i-lucide-user"
              size="lg"
              required
              class="w-full"
            />
          </UFormField>
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

          <UFormField label="Telefon raqami" required>
            <UInput
              v-model="newParent.phone_number"
              placeholder="+998 XX XXX XX XX"
              icon="i-lucide-phone"
              size="lg"
              required
              class="w-full"
            />
          </UFormField>

          <UFormField label="Qo'shimcha raqam">
            <UInput
              v-model="newParent.additional_number"
              placeholder="+998 XX XXX XX XX"
              icon="i-lucide-phone"
              size="lg"
              class="w-full"
            />
          </UFormField>
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
        :loading="isLoading"
        :disabled="isLoading"
        label="Ota-ona yaratish"
        @click="
          handleSubmit();
          close();
        "
      />
    </template>
  </UModal>
</template>
