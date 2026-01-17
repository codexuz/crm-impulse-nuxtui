<script setup lang="ts">
import { ref } from "vue";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const { apiService } = useAuth();
const toast = useToast();

interface Props {
  courses: any[];
  teachers: any[];
}

const props = defineProps<Props>();
const emit = defineEmits(["submit"]);

const isSubmitting = ref(false);

const formData = ref({
  name: "",
  level_id: "",
  teacher_id: "",
});

const courseOptions = computed(() => {
  return props.courses.map((c) => ({
    value: c.id,
    label: `${c.title} (${c.level})`,
  }));
});

const teacherOptions = computed(() => {
  return props.teachers.map((t) => ({
    value: t.user_id,
    label: `${t.first_name} ${t.last_name}`,
  }));
});

const createGroup = async (close: () => void) => {
  if (
    !formData.value.name ||
    !formData.value.level_id ||
    !formData.value.teacher_id
  ) {
    toast.add({
      title: "Xatolik",
      description: "Barcha majburiy maydonlarni to'ldiring",
      color: "error",
    });
    return;
  }

  isSubmitting.value = true;

  try {
    await api.post(apiService.value, "/groups", formData.value);
    toast.add({
      title: "Muvaffaqiyat",
      description: "Guruh muvaffaqiyatli yaratildi",
      color: "success",
    });

    emit("submit");
    resetForm();
    close();
  } catch (err: any) {
    toast.add({
      title: "Xatolik",
      description: err.message || "Amal bajarilmadi",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  formData.value = {
    name: "",
    level_id: "",
    teacher_id: "",
  };
};
</script>

<template>
  <UModal
    title="Yangi guruh yaratish"
    description="Kurs uchun yangi o'quv guruhini yarating va o'qituvchini tayinlang"
    :ui="{ footer: 'justify-end' }"
  >
    <UButton icon="i-lucide-plus" label="Guruh yaratish" color="primary" />

    <template #body="{ close }">
      <form @submit.prevent="createGroup(close)" class="space-y-6">
        <!-- Group Information Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800"
          >
            <UIcon name="i-lucide-users" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Guruh ma'lumotlari
            </h3>
          </div>

          <div class="space-y-2">
            <label
              class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
            >
              Guruh nomi
              <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="formData.name"
              placeholder="Guruh nomini kiriting"
              icon="i-lucide-users"
              size="lg"
              required
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Masalan: Beginner A1-1, Elementary A2-2
            </p>
          </div>
        </div>

        <!-- Course Information Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800"
          >
            <UIcon name="i-lucide-book-open" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Kurs ma'lumotlari
            </h3>
          </div>

          <div class="space-y-2">
            <label
              class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
            >
              Kurs
              <span class="text-red-500">*</span>
            </label>
            <USelectMenu
              v-model="formData.level_id"
              :items="courseOptions"
              value-key="value"
              placeholder="Kursni tanlang"
              searchable
              icon="i-lucide-book-open"
              size="lg"
            >
              <template #label>
                {{
                  courseOptions.find((c) => c.value === formData.level_id)
                    ?.label || "Kursni tanlang"
                }}
              </template>
            </USelectMenu>
          </div>
        </div>

        <!-- Teacher Information Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800"
          >
            <UIcon name="i-lucide-user-circle" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              O'qituvchi ma'lumotlari
            </h3>
          </div>

          <div class="space-y-2">
            <label
              class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
            >
              O'qituvchi
              <span class="text-red-500">*</span>
            </label>
            <USelectMenu
              v-model="formData.teacher_id"
              :items="teacherOptions"
              value-key="value"
              placeholder="O'qituvchini tanlang"
              searchable
              icon="i-lucide-user"
              size="lg"
            >
              <template #label>
                {{
                  teacherOptions.find((t) => t.value === formData.teacher_id)
                    ?.label || "O'qituvchini tanlang"
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
        :disabled="isSubmitting"
        label="Guruh yaratish"
        @click="createGroup(close)"
      />
    </template>
  </UModal>
</template>
