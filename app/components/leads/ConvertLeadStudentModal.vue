<script setup lang="ts">
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

const open = defineModel<boolean>("open");

const props = defineProps<{
  lead: Lead | null;
}>();

const emit = defineEmits<{
  converted: [];
}>();

const { apiService } = useAuth();
const toast = useToast();

const showPassword = ref(false);
const courses = ref<any[]>([]);
const isLoadingCourses = ref(false);
const isSubmitting = ref(false);

const studentData = reactive({
  username: "",
  password: "",
  level_id: "none",
});

const courseOptions = computed(() => [
  { value: "none", label: "Yo'q" },
  ...courses.value.map((course) => ({
    value: course.id,
    label: `${course.title} - ${course.level || ""}`,
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

const resetForm = () => {
  studentData.username = "";
  studentData.password = "";
  studentData.level_id = "none";
  showPassword.value = false;
};

// Watch for lead changes to populate username
watch(
  () => props.lead,
  (newLead) => {
    if (newLead) {
      studentData.username = `${newLead.first_name.toLowerCase()}_${newLead.last_name.toLowerCase()}`;
    }
  },
  { immediate: true },
);

watch(open, (isOpen) => {
  if (isOpen) {
    loadCourses();
    if (props.lead) {
      studentData.username = `${props.lead.first_name.toLowerCase()}_${props.lead.last_name.toLowerCase()}`;
    }
  } else {
    resetForm();
  }
});

const handleSubmit = async () => {
  if (!props.lead?.id) return;

  isSubmitting.value = true;
  try {
    await api.post(apiService.value, "/auth/register", {
      phone: props.lead.phone,
      username: studentData.username,
      password: studentData.password,
      first_name: props.lead.first_name,
      last_name: props.lead.last_name,
      level_id: studentData.level_id === "none" ? null : studentData.level_id,
    });

    toast.add({
      title: "Muvaffaqiyatli",
      description: "Lead talabaga aylantirildi",
      color: "success",
    });

    open.value = false;
    emit("converted");
  } catch (error: any) {
    console.error("Failed to convert lead to student:", error);
    toast.add({
      title: "Xatolik",
      description:
        error.message || "Leadni talabaga aylantirishda xatolik yuz berdi",
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
    title="Leadni talabaga aylantirish"
    description="Lead ma'lumotlaridan talaba hisobi yaratish"
    :ui="{ content: 'w-[calc(100vw-2rem)] max-w-2xl' }"
  >
    <template #body>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Lead Information -->
        <div v-if="lead" class="space-y-4">
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div
              class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"
            >
              Lead ma'lumotlari
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">Ism:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">
                  {{ lead.first_name }} {{ lead.last_name }}
                </span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Telefon:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">
                  {{ lead.phone }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Account Information Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"
          >
            <UIcon name="i-lucide-key-round" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Hisob ma'lumotlari
            </h3>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Login
                <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="studentData.username"
                placeholder="Loginni kiriting"
                required
              />
            </div>

            <div class="space-y-2">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Parol
                <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="studentData.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Parolni kiriting"
                required
              >
                <template #trailing>
                  <UButton
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </UInput>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Kamida 6 ta belgi
              </p>
            </div>
          </div>
        </div>

        <!-- Education Information Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"
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
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Daraja
            </label>
            <USelectMenu
              v-model="studentData.level_id"
              :items="courseOptions"
               value-key="value"
              :loading="isLoadingCourses"
              placeholder="Darajani tanlang"
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
          label="Talabaga aylantirish"
          icon="i-lucide-user-check"
          :loading="isSubmitting"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
