<script setup lang="ts">
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const { apiService } = useAuth();
const toast = useToast();

const emit = defineEmits<{
  submit: [student: any];
}>();

const showPassword = ref(false);
const courses = ref<any[]>([]);
const isLoadingCourses = ref(false);

const newStudent = reactive({
  first_name: "",
  last_name: "",
  username: "",
  phone: "",
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

const isLoading = ref(false);

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

const handleSubmit = () => {
  emit("submit", { ...newStudent });
  // Reset form
  Object.keys(newStudent).forEach((key) => {
    newStudent[key as keyof typeof newStudent] = "";
  });
  newStudent.level_id = "none";
};

// Load courses on mount
onMounted(() => {
  loadCourses();
});
</script>

<template>
  <UModal
    title="Yangi talaba qo'shish"
    description="Tizimda yangi talaba hisobi yaratish"
    :ui="{ footer: 'justify-end' }"
  >
    <UButton icon="i-lucide-plus" label="Talaba qo'shish" color="primary" />

    <template #body="{ close }">
      <form
        @submit.prevent="
          handleSubmit();
          close();
        "
        class="space-y-6"
      >
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
                v-model="newStudent.first_name"
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
                v-model="newStudent.last_name"
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
              v-model="newStudent.username"
              placeholder="Loginni kiriting"
              icon="i-lucide-at-sign"
              size="lg"
              required
            />
          </div>

          <div class="space-y-2">
            <label
              class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
            >
              Parol
              <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="newStudent.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Parolni kiriting"
              icon="i-lucide-lock"
              size="lg"
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
              v-model="newStudent.phone"
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
              v-model="newStudent.level_id"
              :options="courseOptions"
              :loading="isLoadingCourses"
              placeholder="Darajani tanlang"
              value-attribute="value"
              size="lg"
              icon="i-lucide-book-open"
            >
              <template #label>
                <span v-if="isLoadingCourses">Yuklanmoqda...</span>
                <span v-else>
                  {{
                    courseOptions.find((c) => c.value === newStudent.level_id)
                      ?.label || "Darajani tanlang"
                  }}
                </span>
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
        :loading="isLoading"
        :disabled="isLoading"
        label="Talaba yaratish"
        @click="
          handleSubmit();
          close();
        "
      />
    </template>
  </UModal>
</template>
