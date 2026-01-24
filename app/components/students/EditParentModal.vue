<script setup lang="ts">
import type { StudentParent, Student } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import { refDebounced } from "@vueuse/core";

const { apiService } = useAuth();
const toast = useToast();

const open = defineModel<boolean>("open");

const props = defineProps<{
  parent: StudentParent | null;
}>();

const emit = defineEmits<{
  updated: [];
}>();

const students = ref<Student[]>([]);
const studentSearchTerm = ref("");
const studentSearchDebounced = refDebounced(studentSearchTerm, 300);
const isLoadingStudents = ref(false);
const isUpdating = ref(false);
const selectedStudent = ref<any>(null);

const editingParent = ref({
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
    editingParent.value.student_id = student.value;
  } else if (typeof student === "string") {
    editingParent.value.student_id = student;
  }
});

const handleSubmit = async () => {
  if (!props.parent) return;

  isUpdating.value = true;
  try {
    await api.patch<StudentParent>(
      apiService.value,
      `/student-parents/${props.parent.id}`,
      editingParent.value,
    );

    toast.add({
      title: "Muvaffaqiyat",
      description: "Ota-ona ma'lumotlari muvaffaqiyatli yangilandi",
      color: "success",
    });

    emit("updated");
    open.value = false;
  } catch (error) {
    console.error("Failed to update parent:", error);
    toast.add({
      title: "Xatolik",
      description:
        "Ota-ona ma'lumotlarini yangilashda xatolik. Iltimos, qayta urinib ko'ring.",
      color: "error",
    });
  } finally {
    isUpdating.value = false;
  }
};

// Watch for parent changes to populate form
watch(
  () => props.parent,
  async (newParent) => {
    if (newParent) {
      editingParent.value = {
        student_id: newParent.student_id,
        full_name: newParent.full_name,
        phone_number: newParent.phone_number,
        additional_number: newParent.additional_number || "",
      };
      // Load the current student for the dropdown
      if (newParent.student) {
        students.value = [newParent.student];
        selectedStudent.value = {
          value: newParent.student.user_id,
          label: `${newParent.student.first_name} ${newParent.student.last_name} (${newParent.student.phone})`,
        };
      }
    }
  },
  { immediate: true },
);

watch(open, (isOpen) => {
  if (!isOpen) {
    studentSearchTerm.value = "";
    students.value = [];
    selectedStudent.value = null;
  }
});
</script>

<template>
  <UModal
    v-model:open="open"
    title="Ota-ona ma'lumotlarini tahrirlash"
    description="Ota-ona ma'lumotlarini yangilash"
    :ui="{ content: 'w-[calc(100vw-2rem)] max-w-2xl', footer: 'justify-end' }"
  >
    <template #body>
      <form v-if="parent" @submit.prevent="handleSubmit" class="space-y-6">
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
              v-model="editingParent.full_name"
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
              v-model="editingParent.phone_number"
              placeholder="+998 XX XXX XX XX"
              icon="i-lucide-phone"
              size="lg"
              required
              class="w-full"
            />
          </UFormField>

          <UFormField label="Qo'shimcha raqam">
            <UInput
              v-model="editingParent.additional_number"
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
        :loading="isUpdating"
        :disabled="isUpdating"
        label="Saqlash"
        @click="handleSubmit"
      />
    </template>
  </UModal>
</template>
