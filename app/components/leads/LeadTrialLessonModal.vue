<script setup lang="ts">
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
}

const open = defineModel<boolean>("open");

const props = defineProps<{
  lead: Lead | null;
}>();

const emit = defineEmits<{
  created: [];
}>();

const { apiService } = useAuth();
const toast = useToast();

const isSubmitting = ref(false);
const teachers = ref<any[]>([]);
const isLoadingTeachers = ref(false);

const trialLesson = reactive({
  teacher_id: "",
  scheduledAt: "",
  status: "belgilangan",
  notes: "",
});

const teacherOptions = computed(() =>
  teachers.value.map((t) => ({
    value: t.user_id,
    label: `${t.first_name} ${t.last_name}`,
  })),
);

const statusOptions = [
  { value: "belgilangan", label: "Rejalashtirilgan" },
  { value: "yakunlandi", label: "Yakunlandi" },
  { value: "bekor qilindi", label: "Bekor qilindi" },
];

const loadTeachers = async () => {
  isLoadingTeachers.value = true;
  try {
    const response = await api.get<{ data: any[] }>(
      apiService.value,
      "/users/teachers",
    );
    teachers.value = response.data || [];
  } catch (error) {
    console.error("Failed to load teachers:", error);
    toast.add({
      title: "Xatolik",
      description: "O'qituvchilarni yuklashda xatolik.",
      color: "error",
    });
  } finally {
    isLoadingTeachers.value = false;
  }
};

const resetForm = () => {
  trialLesson.teacher_id = "";
  trialLesson.scheduledAt = "";
  trialLesson.status = "belgilangan";
  trialLesson.notes = "";
};

watch(open, (isOpen) => {
  if (isOpen) {
    loadTeachers();
    resetForm();
  }
});

const handleSubmit = async () => {
  if (!props.lead?.id) return;

  isSubmitting.value = true;
  try {
    // Create trial lesson
    await api.post(apiService.value, "/lead-trial-lessons", {
      lead_id: props.lead.id,
      teacher_id: trialLesson.teacher_id,
      scheduledAt: trialLesson.scheduledAt,
      status: trialLesson.status,
      notes: trialLesson.notes || null,
    });

    // Update lead status to "Sinovda"
    await api.patch(apiService.value, `/leads/${props.lead.id}`, {
      status: "Sinovda",
    });

    toast.add({
      title: "Muvaffaqiyatli",
      description: "Sinov darsi rejalashtirildi va lead holati o'zgartirildi",
      color: "success",
    });

    open.value = false;
    emit("created");
  } catch (error: any) {
    console.error("Failed to schedule trial lesson:", error);
    toast.add({
      title: "Xatolik",
      description:
        error.message || "Sinov darsini rejalashtirishda xatolik yuz berdi",
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
    title="Sinov darsini rejalashtirish"
    description="Lead uchun sinov darsini belgilang"
    :ui="{ content: 'w-[calc(100vw-2rem)] max-w-2xl' }"
  >
    <template #body>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div v-if="lead" class="space-y-4">
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="text-sm text-gray-500 dark:text-gray-400">Lead</div>
            <div
              class="text-base font-medium text-gray-900 dark:text-white mt-1"
            >
              {{ lead.first_name }} {{ lead.last_name }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                O'qituvchi
                <span class="text-red-500">*</span>
              </label>
              <USelectMenu
                v-model="trialLesson.teacher_id"
                :items="teacherOptions"
                value-key="value"
                :loading="isLoadingTeachers"
                placeholder="O'qituvchini tanlang"
              />
            </div>

            <div class="space-y-2">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Sana va vaqt
                <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="trialLesson.scheduledAt"
                type="datetime-local"
                required
              />
            </div>
          </div>

          <div class="space-y-2">
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Holat
            </label>
            <USelectMenu
              v-model="trialLesson.status"
              :items="statusOptions"
              value-key="value"
              class="w-full"
            />
          </div>

          <div class="space-y-2">
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Eslatmalar
            </label>
            <UTextarea
              v-model="trialLesson.notes"
              placeholder="Qo'shimcha eslatmalar..."
              :rows="3"
              class="w-full"
            />
          </div>
        </div>
      </form>
    </template>

    <template #footer="{ close }">
      <div class="flex justify-end gap-2">
        <UButton
          type="button"
          color="neutral"
          variant="outline"
          label="Bekor qilish"
          @click="close"
          :disabled="isSubmitting"
        />
        <UButton
          type="button"
          label="Rejalashtirish"
          icon="i-lucide-calendar-plus"
          :loading="isSubmitting"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
