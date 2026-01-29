<script setup lang="ts">
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  parent_phone_number?: string;
  parent_name?: string;
  additional_number?: string;
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
  full_name: "",
  phone_number: "",
  additional_number: "",
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
    const response = await api.get<{ data: any[] }>(apiService.value, "/courses");
    courses.value = response.data || [];
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
  studentData.full_name = "";
  studentData.phone_number = "";
  studentData.additional_number = "";
  showPassword.value = false;
};

// Watch for lead changes to populate username and parent info
watch(
  () => props.lead,
  (newLead) => {
    if (newLead) {
      studentData.username = `${newLead.first_name.toLowerCase()}_${newLead.last_name.toLowerCase()}`;
      studentData.full_name = newLead.parent_name || "";
      studentData.phone_number = newLead.parent_phone_number || "";
      studentData.additional_number = newLead.additional_number || "";
    }
  },
  { immediate: true },
);

watch(open, (isOpen) => {
  if (isOpen) {
    loadCourses();
    if (props.lead) {
      studentData.username = `${props.lead.first_name.toLowerCase()}_${props.lead.last_name.toLowerCase()}`;
      studentData.full_name = props.lead.parent_name || "";
      studentData.phone_number = props.lead.parent_phone_number || "";
      studentData.additional_number = props.lead.additional_number || "";
    }
  } else {
    resetForm();
  }
});

const handleSubmit = async () => {
  if (!props.lead?.id) return;

  isSubmitting.value = true;
  try {
    // Register student with parent information - server handles parent creation
    await api.post(apiService.value, "/auth/register", {
      phone: props.lead.phone,
      username: studentData.username,
      password: studentData.password,
      first_name: props.lead.first_name,
      last_name: props.lead.last_name,
      level_id: studentData.level_id === "none" ? null : studentData.level_id,
      full_name: studentData.full_name || "",
      phone_number: studentData.phone_number || "",
      additional_number: studentData.additional_number || "",
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
            <UFormField label="Login" required>
              <UInput
                v-model="studentData.username"
                placeholder="Loginni kiriting"
                required
                class="w-full"
              />
            </UFormField>

            <UFormField label="Parol" required hint="Kamida 6 ta belgi">
              <UInput
                v-model="studentData.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Parolni kiriting"
                required
                class="w-full"
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
            </UFormField>
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

          <UFormField label="Daraja">
            <USelectMenu
              v-model="studentData.level_id"
              :items="courseOptions"
              value-key="value"
              :loading="isLoadingCourses"
              placeholder="Darajani tanlang"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Parent Information Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"
          >
            <UIcon name="i-lucide-users" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Ota-ona ma'lumotlari
            </h3>
          </div>

          <UFormField label="Ota-ona ismi">
            <UInput
              v-model="studentData.full_name"
              placeholder="Ota-ona ismini kiriting"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Ota-ona telefoni">
              <UInput
                v-model="studentData.phone_number"
                placeholder="+998 XX XXX XX XX"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Qo'shimcha raqam">
              <UInput
                v-model="studentData.additional_number"
                placeholder="+998 XX XXX XX XX"
                class="w-full"
              />
            </UFormField>
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
