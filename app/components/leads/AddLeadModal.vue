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
  course_ids: [],
  notes: "",
  // Referral: a student referring this lead; the teacher is credited a bonus
  // when the lead enrolls. referral_teacher_id is optional — the backend
  // resolves it from the student's active group when left empty.
  referred_by_student_id: null as string | null,
  referral_teacher_id: null as string | null,
  referral_bonus_amount: null as number | null,
});

// Referral student search
interface UserRef {
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}
const students = ref<UserRef[]>([]);
const isLoadingStudents = ref(false);
const studentSearch = ref("");
const teachers = ref<UserRef[]>([]);

const studentOptions = computed(() =>
  students.value.map((s) => ({
    label: `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.user_id,
    value: s.user_id,
  })),
);

const teacherOptions = computed(() =>
  teachers.value.map((t) => ({
    label: `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() || t.user_id,
    value: t.user_id,
  })),
);

const searchStudents = async (query: string) => {
  if (!query || query.length < 2) {
    students.value = [];
    return;
  }
  isLoadingStudents.value = true;
  try {
    const response = await api.get<{ data: UserRef[] }>(
      apiService.value,
      `/users/students?query=${encodeURIComponent(query)}&limit=20`,
    );
    students.value = response.data || [];
  } catch (error) {
    console.error("Failed to search students:", error);
    students.value = [];
  } finally {
    isLoadingStudents.value = false;
  }
};

watch(studentSearch, (q) => searchStudents(q));

const loadTeachers = async () => {
  try {
    const response = await api.get<{ data: UserRef[] }>(
      apiService.value,
      "/users/teachers?limit=1000",
    );
    teachers.value = response.data || [];
  } catch (error) {
    console.error("Failed to load teachers:", error);
    teachers.value = [];
  }
};

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



const createLead = async (close: () => void) => {
  isCreatingLead.value = true;
  try {
    const leadData: Record<string, any> = {
      ...newLead,
      phone: newLead.phone.replace(/\s+/g, ""),
      parent_phone_number: newLead.parent_phone_number.replace(/\s+/g, ""),
      additional_number: newLead.additional_number.replace(/\s+/g, ""),
      course_ids: newLead.course_ids && newLead.course_ids.length > 0 ? newLead.course_ids : [],
      admin_id: auth.value.user?.user_id || auth.value.user?.id,
    };

    // Only send referral fields when a referring student is chosen.
    if (!newLead.referred_by_student_id) {
      delete leadData.referred_by_student_id;
      delete leadData.referral_teacher_id;
      delete leadData.referral_bonus_amount;
    } else {
      if (!newLead.referral_teacher_id) delete leadData.referral_teacher_id;
      if (!newLead.referral_bonus_amount) delete leadData.referral_bonus_amount;
    }

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
  newLead.course_ids = [];
  newLead.notes = "";
  newLead.referred_by_student_id = null;
  newLead.referral_teacher_id = null;
  newLead.referral_bonus_amount = null;
  students.value = [];
  studentSearch.value = "";
};

// Load courses on mount
onMounted(() => {
  loadCourses();
  loadTeachers();
});
</script>

<template>
  <UModal title="Yangi lead qo'shish" description="Tizimga yangi lead ma'lumotlarini kiriting" :close="{
    color: 'neutral',
    variant: 'ghost',
    class: 'rounded-full',
  }" :ui="{ width: 'sm:max-w-2xl', footer: 'justify-end' }">
    <UButton icon="i-lucide-plus" label="Yangi lead" color="primary" />

    <template #body="{ close }">
      <form @submit.prevent="createLead(close)" class="space-y-6">
        <!-- Personal Information Section -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
            <UIcon name="i-lucide-user" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Shaxsiy ma'lumotlar
            </h3>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Ism" required>
              <UInput v-model="newLead.first_name" placeholder="Ismni kiriting" required class="w-full" />
            </UFormField>

            <UFormField label="Familiya" required>
              <UInput v-model="newLead.last_name" placeholder="Familiyani kiriting" required class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Telefon raqami" required>
            <UInput v-model="newLead.phone" v-maska data-maska="+998 ## ### ## ##" placeholder="+998 XX XXX XX XX"
              required class="w-full" />
          </UFormField>
        </div>

        <!-- Parent Information Section -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
            <UIcon name="i-lucide-users" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Ota-ona ma'lumotlari
            </h3>
          </div>

          <UFormField label="Ota-ona ismi">
            <UInput v-model="newLead.parent_name" placeholder="Ota-ona ismini kiriting" class="w-full" />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Ota-ona telefoni">
              <UInput v-model="newLead.parent_phone_number" v-maska data-maska="+998 ## ### ## ##"
                placeholder="+998 XX XXX XX XX" class="w-full" />
            </UFormField>

            <UFormField label="Qo'shimcha raqam">
              <UInput v-model="newLead.additional_number" v-maska data-maska="+998 ## ### ## ##"
                placeholder="+998 XX XXX XX XX" class="w-full" />
            </UFormField>
          </div>
        </div>

        <!-- Status & Source Section -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
            <UIcon name="i-lucide-info" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Holat va manba
            </h3>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Holat">
              <USelectMenu v-model="newLead.status" :items="filteredStatusOptions" value-key="value"
                placeholder="Holatni tanlang" class="w-full" />
            </UFormField>

            <UFormField label="Manba">
              <USelectMenu v-model="newLead.source" :items="filteredSourceOptions" value-key="value"
                placeholder="Manbani tanlang" class="w-full" />
            </UFormField>
          </div>
        </div>

        <!-- Course Section -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
            <UIcon name="i-lucide-book-open" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Kurs ma'lumotlari
            </h3>
          </div>

          <UFormField label="Qiziqayotgan kurslar">
            <USelectMenu v-model="newLead.course_ids" :items="courseOptions" multiple value-key="id"
              placeholder="Kurslarni tanlang" :loading="isLoadingCourses" class="w-full">
              <template #option="{ option }">
                <div class="flex items-center justify-between w-full">
                  <span class="truncate">{{ option.title }}</span>
                  <UBadge v-if="option.level" :label="option.level" color="primary" variant="subtle" size="xs" />
                </div>
              </template>
            </USelectMenu>
          </UFormField>
        </div>

        <!-- Referral Section -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
            <UIcon name="i-lucide-gift" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Referal (taklif)
            </h3>
          </div>

          <UFormField label="Taklif qilgan o'quvchi"
            help="O'quvchi tanlansa, lead o'qishga yozilganda uning o'qituvchisiga referal bonus beriladi">
            <USelectMenu v-model="newLead.referred_by_student_id" v-model:search-term="studentSearch"
              :items="studentOptions" value-key="value" :loading="isLoadingStudents"
              placeholder="O'quvchini qidiring..." searchable class="w-full" />
          </UFormField>

          <div v-if="newLead.referred_by_student_id" class="grid grid-cols-2 gap-4">
            <UFormField label="Bonus oluvchi o'qituvchi (ixtiyoriy)"
              help="Bo'sh qoldirilsa, o'quvchining guruhidan aniqlanadi">
              <USelectMenu v-model="newLead.referral_teacher_id" :items="teacherOptions" value-key="value"
                placeholder="O'qituvchini tanlang" searchable class="w-full" />
            </UFormField>

            <UFormField label="Referal bonus summasi (ixtiyoriy)">
              <UInput v-model.number="newLead.referral_bonus_amount" type="number" placeholder="Masalan: 50000"
                class="w-full" />
            </UFormField>
          </div>
        </div>

        <!-- Additional Information Section -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
            <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Qo'shimcha ma'lumotlar
            </h3>
          </div>

          <UFormField label="Savol">
            <UTextarea v-model="newLead.question" placeholder="Lead savoli..." :rows="3" class="w-full" />
          </UFormField>

          <UFormField label="Izohlar">
            <UTextarea v-model="newLead.notes" placeholder="Qo'shimcha izohlar..." :rows="3" class="w-full" />
          </UFormField>
        </div>

        <!-- Footer Buttons -->
        <div class="flex justify-end gap-2 pt-4">
          <UButton type="button" color="neutral" variant="subtle" label="Bekor qilish" @click="close" />
          <UButton type="submit" color="primary" :label="isCreatingLead ? 'Saqlanmoqda...' : 'Saqlash'"
            :loading="isCreatingLead" />
        </div>
      </form>
    </template>
  </UModal>
</template>
