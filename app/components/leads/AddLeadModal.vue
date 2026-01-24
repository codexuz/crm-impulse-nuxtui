<script setup lang="ts">
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const { apiService, auth } = useAuth();
const toast = useToast();

const emit = defineEmits<{
  submit: [];
}>();

interface StatusOption {
  label: string;
  value: string;
}

interface SourceOption {
  label: string;
  value: string;
}

interface Course {
  id: string;
  title: string;
  level?: string;
  isActive?: boolean;
}

const props = defineProps<{
  statusOptions: StatusOption[];
  sourceOptions: SourceOption[];
}>();

const courses = ref<Course[]>([]);
const isLoadingCourses = ref(false);
const isCreatingLead = ref(false);

const newLead = reactive({
  first_name: "",
  last_name: "",
  phone: "",
  parent_phone_number: "",
  parent_name: "",
  additional_number: "",
  status: "Yangi",
  source: "Instagram",
  question: "",
  course_id: "",
  notes: "",
});

const courseOptions = computed(() =>
  courses.value
    .filter((course) => course.isActive)
    .map((course) => ({
      id: course.id,
      label: `${course.title} ${course.level ? `(${course.level})` : ""}`,
      title: course.title,
      level: course.level,
    })),
);

const filteredStatusOptions = computed(() =>
  props.statusOptions.filter((s) => s.value !== ""),
);

const filteredSourceOptions = computed(() =>
  props.sourceOptions.filter((s) => s.value !== ""),
);

const loadCourses = async () => {
  isLoadingCourses.value = true;
  try {
    const response = await api.get<Course[]>(apiService.value, "/courses");
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

const createLead = async (close: () => void) => {
  isCreatingLead.value = true;
  try {
    const leadData = {
      ...newLead,
      admin_id: auth.value.user?.user_id || auth.value.user?.id,
    };

    await api.post(apiService.value, "/leads", leadData);
    toast.add({
      title: "Muvaffaqiyatli",
      description: "Lead muvaffaqiyatli yaratildi",
      color: "success",
    });
    emit("submit");
    resetForm();
    close();
  } catch (error) {
    console.error("Failed to create lead:", error);
    toast.add({
      title: "Xatolik",
      description: "Lead yaratishda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isCreatingLead.value = false;
  }
};

const resetForm = () => {
  newLead.first_name = "";
  newLead.last_name = "";
  newLead.phone = "";
  newLead.parent_phone_number = "";
  newLead.parent_name = "";
  newLead.additional_number = "";
  newLead.status = "Yangi";
  newLead.source = "Instagram";
  newLead.question = "";
  newLead.course_id = "";
  newLead.notes = "";
};

// Load courses on mount
onMounted(() => {
  loadCourses();
});
</script>

<template>
  <UModal
    title="Yangi lead qo'shish"
    description="Tizimga yangi lead ma'lumotlarini kiriting"
    :close="{
      color: 'neutral',
      variant: 'ghost',
      class: 'rounded-full',
    }"
    :ui="{ width: 'sm:max-w-2xl', footer: 'justify-end' }"
  >
    <UButton icon="i-lucide-plus" label="Yangi lead" color="primary" />

    <template #body="{ close }">
      <form @submit.prevent="createLead(close)" class="space-y-6">
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
            <UFormField label="Ism" required>
              <UInput
                v-model="newLead.first_name"
                placeholder="Ismni kiriting"
                required
                class="w-full"
              />
            </UFormField>

            <UFormField label="Familiya" required>
              <UInput
                v-model="newLead.last_name"
                placeholder="Familiyani kiriting"
                required
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Telefon raqami" required>
            <UInput
              v-model="newLead.phone"
              placeholder="+998 XX XXX XX XX"
              required
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Parent Information Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800"
          >
            <UIcon name="i-lucide-users" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Ota-ona ma'lumotlari
            </h3>
          </div>

          <UFormField label="Ota-ona ismi">
            <UInput
              v-model="newLead.parent_name"
              placeholder="Ota-ona ismini kiriting"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Ota-ona telefoni">
              <UInput
                v-model="newLead.parent_phone_number"
                placeholder="+998 XX XXX XX XX"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Qo'shimcha raqam">
              <UInput
                v-model="newLead.additional_number"
                placeholder="+998 XX XXX XX XX"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <!-- Status & Source Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800"
          >
            <UIcon name="i-lucide-info" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Holat va manba
            </h3>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Holat">
              <USelectMenu
                v-model="newLead.status"
                :items="filteredStatusOptions"
                value-key="value"
                placeholder="Holatni tanlang"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Manba">
              <USelectMenu
                v-model="newLead.source"
                :items="filteredSourceOptions"
                value-key="value"
                placeholder="Manbani tanlang"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <!-- Course Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800"
          >
            <UIcon name="i-lucide-book-open" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Kurs ma'lumotlari
            </h3>
          </div>

          <UFormField label="Qiziqayotgan kurs">
            <USelectMenu
              v-model="newLead.course_id"
              :items="courseOptions"
              value-key="id"
              placeholder="Kursni tanlang"
              :loading="isLoadingCourses"
              class="w-full"
            >
              <template #option="{ option }">
                <div class="flex items-center justify-between w-full">
                  <span class="truncate">{{ option.title }}</span>
                  <UBadge
                    v-if="option.level"
                    :label="option.level"
                    color="primary"
                    variant="subtle"
                    size="xs"
                  />
                </div>
              </template>
            </USelectMenu>
          </UFormField>
        </div>

        <!-- Additional Information Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800"
          >
            <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Qo'shimcha ma'lumotlar
            </h3>
          </div>

          <UFormField label="Savol">
            <UTextarea
              v-model="newLead.question"
              placeholder="Lead savoli..."
              :rows="3"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Izohlar">
            <UTextarea
              v-model="newLead.notes"
              placeholder="Qo'shimcha izohlar..."
              :rows="3"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Footer Buttons -->
        <div class="flex justify-end gap-2 pt-4">
          <UButton
            type="button"
            color="neutral"
            variant="subtle"
            label="Bekor qilish"
            @click="close"
          />
          <UButton
            type="submit"
            color="primary"
            :label="isCreatingLead ? 'Saqlanmoqda...' : 'Saqlash'"
            :loading="isCreatingLead"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
