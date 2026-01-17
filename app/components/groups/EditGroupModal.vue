<script setup lang="ts">
import { ref, watch } from "vue";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

interface Group {
  id: string;
  name: string;
  level_id: string;
  teacher_id: string;
  start_date?: string;
  end_date?: string;
}

const open = defineModel<boolean>("open");

const props = defineProps<{
  group: Group | null;
  courses: any[];
  teachers: any[];
}>();

const emit = defineEmits(["updated"]);

const { apiService } = useAuth();
const toast = useToast();

const isSubmitting = ref(false);
const formData = ref<Partial<Group>>({});

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

// Watch for group changes to populate form
watch(
  () => props.group,
  (newGroup) => {
    if (newGroup) {
      formData.value = {
        id: newGroup.id,
        name: newGroup.name,
        level_id: newGroup.level_id,
        teacher_id: newGroup.teacher_id,
        start_date: newGroup.start_date,
        end_date: newGroup.end_date,
      };
    }
  },
  { immediate: true },
);

const handleSubmit = async () => {
  if (!formData.value.id) return;

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
    await api.patch(apiService.value, `/groups/${formData.value.id}`, {
      name: formData.value.name,
      level_id: formData.value.level_id,
      teacher_id: formData.value.teacher_id,
    });

    toast.add({
      title: "Muvaffaqiyat",
      description: "Guruh muvaffaqiyatli yangilandi",
      color: "success",
    });

    open.value = false;
    emit("updated");
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
</script>

<template>
  <UModal
    v-model:open="open"
    title="Guruhni tahrirlash"
    description="Guruh ma'lumotlarini yangilang"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <form @submit.prevent="handleSubmit" class="space-y-6">
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

    <template #footer>
      <UButton
        type="button"
        color="neutral"
        variant="outline"
        label="Bekor qilish"
        @click="open = false"
      />
      <UButton
        type="submit"
        :loading="isSubmitting"
        :disabled="isSubmitting"
        label="Yangilash"
        @click="handleSubmit"
      />
    </template>
  </UModal>
</template>
   