<script setup lang="ts">
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: string;
  source: string;
  question?: string;
  course_id?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TrialLesson {
  id: string;
  lead_id: string;
  teacher_id: string;
  scheduledAt: string;
  status: string;
  notes?: string;
  teacherInfo?: {
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
    phone: string;
  };
  leadInfo?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    status: string;
  };
}

const open = defineModel<boolean>("open");

const props = defineProps<{
  lead: Lead | null;
  courses: any[];
}>();

const emit = defineEmits<{
  edit: [lead: Lead];
}>();

const { apiService } = useAuth();
const trialLessons = ref<TrialLesson[]>([]);
const isLoadingTrials = ref(false);

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "Mavjud emas";
  const date = new Date(dateString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
};

const formatDateTime = (dateTimeString: string): string => {
  const dateObj = new Date(dateTimeString);
  const day = String(dateObj.getUTCDate()).padStart(2, "0");
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const year = dateObj.getUTCFullYear();
  const hours = String(dateObj.getUTCHours()).padStart(2, "0");
  const minutes = String(dateObj.getUTCMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

const getCourseTitle = (courseId?: string): string => {
  if (!courseId) return "Belgilanmagan";
  const course = props.courses.find((c) => c.id === courseId);
  return course ? course.title : "Belgilanmagan";
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Yangi: "blue",
    Aloqada: "yellow",
    Sinovda: "purple",
    "Sinovda qatnashdi": "indigo",
    "O'qishga yozildi": "green",
    "Yo'qotildi": "red",
  };
  return colors[status] || "gray";
};

const getTrialStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    belgilangan: "blue",
    scheduled: "blue",
    yakunlandi: "green",
    completed: "green",
    "bekor qilindi": "red",
    cancelled: "red",
  };
  return colors[status] || "gray";
};

const getTrialStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    belgilangan: "Rejalashtirilgan",
    scheduled: "Rejalashtirilgan",
    yakunlandi: "Yakunlandi",
    completed: "Yakunlandi",
    "bekor qilindi": "Bekor qilindi",
    cancelled: "Bekor qilindi",
  };
  return labels[status] || status;
};

const getTeacherName = (trial: TrialLesson): string => {
  if (trial.teacherInfo) {
    return `${trial.teacherInfo.first_name} ${trial.teacherInfo.last_name}`;
  }
  return "Belgilanmagan";
};

const loadTrialLessons = async (leadId: string) => {
  isLoadingTrials.value = true;
  try {
    const response = await api.get<TrialLesson[]>(
      apiService.value,
      `/lead-trial-lessons/by-lead/${leadId}`,
    );
    trialLessons.value = response || [];
  } catch (error) {
    console.error("Failed to load trial lessons:", error);
    trialLessons.value = [];
  } finally {
    isLoadingTrials.value = false;
  }
};

// Watch for lead changes and load trial lessons
watch(
  () => props.lead,
  (newLead) => {
    if (newLead?.id && open.value) {
      loadTrialLessons(newLead.id);
    }
  },
  { immediate: true },
);

// Also load when modal opens
watch(open, (isOpen) => {
  if (isOpen && props.lead?.id) {
    loadTrialLessons(props.lead.id);
  }
});
</script>

<template>
  <UModal
    v-model:open="open"
    title="Lead ma'lumotlari"
    description="Lead haqida batafsil ma'lumot"
    :ui="{ content: 'w-[calc(100vw-2rem)] max-w-2xl', footer: 'justify-end' }"
  >
    <template #body>
      <div v-if="lead" class="space-y-6">
        <!-- Lead Header -->
        <div class="flex items-center gap-4">
          <UAvatar :alt="`${lead.first_name} ${lead.last_name}`" size="lg">
            <template #fallback>
              <span class="text-lg">
                {{ getInitials(lead.first_name, lead.last_name) }}
              </span>
            </template>
          </UAvatar>
          <div class="flex-1">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ lead.first_name }} {{ lead.last_name }}
            </h3>
            <div class="flex items-center gap-2 mt-1">
              <UBadge :color="getStatusColor(lead.status)">
                {{ lead.status }}
              </UBadge>
            </div>
          </div>
        </div>

        <!-- Lead Details -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-4">
            <div>
              <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Telefon
              </div>
              <div class="mt-1 text-base text-gray-900 dark:text-white">
                {{ lead.phone }}
              </div>
            </div>

            <div>
              <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Manba
              </div>
              <div class="mt-1 text-base text-gray-900 dark:text-white">
                {{ lead.source }}
              </div>
            </div>

            <div>
              <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Qiziqayotgan kurs
              </div>
              <div class="mt-1 text-base text-gray-900 dark:text-white">
                {{ getCourseTitle(lead.course_id) }}
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Yaratilgan sana
              </div>
              <div class="mt-1 text-base text-gray-900 dark:text-white">
                {{ formatDate(lead.createdAt) }}
              </div>
            </div>

            <div>
              <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Oxirgi yangilanish
              </div>
              <div class="mt-1 text-base text-gray-900 dark:text-white">
                {{ formatDate(lead.updatedAt) }}
              </div>
            </div>

            <div v-if="lead.question">
              <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Savol
              </div>
              <div class="mt-1 text-base text-gray-900 dark:text-white">
                {{ lead.question }}
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div
          v-if="lead.notes"
          class="pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Eslatmalar
          </div>
          <div
            class="mt-2 text-base text-gray-900 dark:text-white whitespace-pre-wrap"
          >
            {{ lead.notes }}
          </div>
        </div>

        <!-- Trial Lessons -->
        <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-2 mb-3">
            <UIcon name="i-lucide-calendar" class="w-4 h-4 text-primary" />
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
              Sinov darslari
            </h4>
          </div>

          <div v-if="trialLessons.length > 0" class="space-y-3">
            <div
              v-for="trial in trialLessons"
              :key="trial.id"
              class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <UBadge
                      :color="getTrialStatusColor(trial.status)"
                      size="sm"
                    >
                      {{ getTrialStatusLabel(trial.status) }}
                    </UBadge>
                  </div>
                  <div class="text-sm text-gray-700 dark:text-gray-300">
                    <div class="flex items-center gap-1 mb-1">
                      <UIcon name="i-lucide-user" class="w-3 h-3" />
                      <span>{{ getTeacherName(trial) }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <UIcon name="i-lucide-clock" class="w-3 h-3" />
                      <span>{{ formatDateTime(trial.scheduledAt) }}</span>
                    </div>
                  </div>
                  <div
                    v-if="trial.notes"
                    class="mt-2 text-xs text-gray-600 dark:text-gray-400"
                  >
                    {{ trial.notes }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            v-else
            class="text-sm text-gray-500 dark:text-gray-400 text-center py-4"
          >
            Sinov darslari yo'q
          </div>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex gap-2">
        <UButton
          variant="outline"
          label="Tahrirlash"
          icon="i-lucide-pencil"
          @click="lead && emit('edit', lead)"
        />
        <UButton variant="outline" label="Yopish" @click="close" />
      </div>
    </template>
  </UModal>
</template>
