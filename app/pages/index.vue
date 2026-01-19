<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Boshqaruv paneli" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UTooltip text="Bildirishnomalar" :shortcuts="['N']">
            <UButton color="neutral" variant="ghost" square>
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Dashboard Overview -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <UCard>
          <div class="flex flex-row items-center justify-between pb-2">
            <div class="text-sm font-medium text-gray-600 dark:text-gray-400">
              Jami talabalar
            </div>
            <UIcon name="i-lucide-users" class="size-4 text-gray-400" />
          </div>
          <div class="text-2xl font-bold">{{ dashboard.totalStudents }}</div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            +{{ dashboard.newStudents }} yangi bu oyda
          </p>
        </UCard>

        <UCard>
          <div class="flex flex-row items-center justify-between pb-2">
            <div class="text-sm font-medium text-gray-600 dark:text-gray-400">
              Faol guruhlar
            </div>
            <UIcon name="i-lucide-users-2" class="size-4 text-gray-400" />
          </div>
          <div class="text-2xl font-bold">{{ dashboard.activeGroups }}</div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            +{{ dashboard.recentGroups }} yangi bu oyda
          </p>
        </UCard>

        <UCard>
          <div class="flex flex-row items-center justify-between pb-2">
            <div class="text-sm font-medium text-gray-600 dark:text-gray-400">
              Yaqinlashayotgan to'lovlar
            </div>
            <UIcon name="i-lucide-alert-circle" class="size-4 text-gray-400" />
          </div>
          <div class="text-2xl font-bold">{{ upcomingPayments.length }}</div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ formatCurrency(dashboard.pendingPaymentsAmount) }} kutilmoqda
          </p>
        </UCard>

        <UCard>
          <div class="flex flex-row items-center justify-between pb-2">
            <div class="text-sm font-medium text-gray-600 dark:text-gray-400">
              Yangi leadlar
            </div>
            <UIcon name="i-lucide-user-plus" class="size-4 text-gray-400" />
          </div>
          <div class="text-2xl font-bold">{{ dashboard.newLeads }}</div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ dashboard.leadsConverted }} talabalarga aylantirildi
          </p>
        </UCard>
      </div>

      <!-- Lesson Schedules Section -->
      <div class="mt-6">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold">Dars jadvallari</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Barcha rejalashtirilgan darslarni ko'rish
                </p>
              </div>
              <div class="flex items-center gap-2">
                <UButton
                  variant="outline"
                  size="sm"
                  icon="i-lucide-chevron-left"
                  @click="navigatePrevious"
                />
                <UButton variant="outline" size="sm" @click="navigateToday">
                  Bugun
                </UButton>
                <UButton
                  variant="outline"
                  size="sm"
                  icon="i-lucide-chevron-right"
                  @click="navigateNext"
                />
              </div>
            </div>
          </template>

          <!-- Calendar Header -->
          <div class="mb-4 text-center">
            <h4 class="text-lg font-medium">
              {{ formatCalendarDate(dashboard.currentDate) }}
            </h4>
          </div>

          <!-- Daily Schedule -->
          <div
            v-if="todayLessons.length === 0"
            class="text-center py-8 text-gray-500 dark:text-gray-400"
          >
            Bu kun uchun darslar yo'q
          </div>
          <UScrollArea
            v-else
            v-slot="{ item: lesson }"
            :items="todayLessons"
            class="w-full h-96"
          >
            <div
              class="border rounded-lg p-4 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors mb-2"
              @click="showLessonDetails(lesson)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <UIcon name="i-lucide-clock" class="size-4" />
                    <span class="font-semibold">
                      {{ lesson.startTime }} - {{ lesson.endTime }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2 mb-1">
                    <UIcon name="i-lucide-users" class="size-4" />
                    <span class="font-medium">{{ lesson.groupName }}</span>
                  </div>
                  <div class="flex items-center gap-2 mb-1">
                    <UIcon name="i-lucide-user" class="size-4" />
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                      {{ lesson.teacherName }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-book-open" class="size-4" />
                    <span class="text-lg text-gray-600 dark:text-gray-400">
                      {{ lesson.lessonName }}
                    </span>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2">
                  <UBadge
                    :color="lesson.days === 'odd' ? 'blue' : 'green'"
                    variant="soft"
                  >
                    {{ lesson.days === "odd" ? "Toq kunlar" : "Juft kunlar" }}
                  </UBadge>
                </div>
              </div>
            </div>
          </UScrollArea>
        </UCard>
      </div>
      <!-- Recent Leads and Quick Actions -->
      <div class="grid gap-4 md:grid-cols-2 mt-4">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">So'nggi leadlar</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Eng yangi potentsial talabalar
            </p>
          </template>

          <div class="space-y-4">
            <div
              v-for="(lead, index) in dashboard.recentLeads"
              :key="index"
              class="flex items-start gap-3"
            >
              <div class="rounded-full bg-primary/10 p-2">
                <UIcon name="i-lucide-user" class="size-4 text-primary" />
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium">{{ lead.name }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ lead.phone }} | {{ lead.source }}
                </p>
                <p
                  v-if="lead.question"
                  class="text-xs text-gray-500 dark:text-gray-400 mt-1"
                >
                  Savol: {{ lead.question }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Holat: {{ lead.status }}
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Tezkor harakatlar</h3>
          </template>

          <div class="flex flex-wrap gap-2">
            <UButton
              variant="outline"
              size="sm"
              icon="i-lucide-user-plus"
              @click="navigateTo('/students')"
            >
              Talaba qo'shish
            </UButton>
            <UButton
              variant="outline"
              size="sm"
              icon="i-lucide-user-cog"
              @click="navigateTo('/teachers')"
            >
              O'qituvchi qo'shish
            </UButton>
            <UButton
              variant="outline"
              size="sm"
              icon="i-lucide-users"
              @click="navigateTo('/groups')"
            >
              Guruh yaratish
            </UButton>
            <UButton
              variant="outline"
              size="sm"
              icon="i-lucide-book"
              @click="navigateTo('/courses')"
            >
              Kurs qo'shish
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Lesson Details Modal -->
      <UModal v-model:open="lessonDetailsModal">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Dars tafsilotlari</h3>
          </div>
        </template>

        <template #body>
          <div v-if="selectedLesson" class="space-y-4">
            <div>
              <label
                class="text-sm font-medium text-gray-500 dark:text-gray-400"
                >Dars nomi</label
              >
              <p class="text-base mt-1">{{ selectedLesson.lessonName }}</p>
            </div>

            <div>
              <label
                class="text-sm font-medium text-gray-500 dark:text-gray-400"
                >Guruh</label
              >
              <p class="text-base mt-1">{{ selectedLesson.groupName }}</p>
            </div>

            <div>
              <label
                class="text-sm font-medium text-gray-500 dark:text-gray-400"
                >O'qituvchi</label
              >
              <p class="text-base mt-1">{{ selectedLesson.teacherName }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="text-sm font-medium text-gray-500 dark:text-gray-400"
                  >Boshlanish vaqti</label
                >
                <p class="text-base mt-1">{{ selectedLesson.startTime }}</p>
              </div>
              <div>
                <label
                  class="text-sm font-medium text-gray-500 dark:text-gray-400"
                  >Tugash vaqti</label
                >
                <p class="text-base mt-1">{{ selectedLesson.endTime }}</p>
              </div>
            </div>

            <div>
              <label
                class="text-sm font-medium text-gray-500 dark:text-gray-400"
                >Dars kunlari</label
              >
              <div class="mt-1">
                <UBadge
                  :color="selectedLesson.days === 'odd' ? 'blue' : 'green'"
                  variant="soft"
                >
                  {{
                    selectedLesson.days === "odd" ? "Toq kunlar" : "Juft kunlar"
                  }}
                </UBadge>
              </div>
            </div>

            <div>
              <label
                class="text-sm font-medium text-gray-500 dark:text-gray-400"
                >Sana</label
              >
              <p class="text-base mt-1">
                {{ formatSimpleDate(selectedLesson.date) }}
              </p>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="outline"
              @click="lessonDetailsModal = false"
            >
              Yopish
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useAuth } from "~/composables/useAuth";
import { api } from "~/lib/api";

definePageMeta({
  middleware: ["auth"],
});

const { apiService } = useAuth();

// Reactive dashboard data
const dashboard = reactive({
  totalStudents: 0,
  newStudents: 0,
  activeGroups: 0,
  recentGroups: 0,
  pendingPaymentsAmount: 0,
  newLeads: 0,
  leadsConverted: 0,
  recentLeads: [] as any[],
  lessonSchedules: [] as any[],
  currentDate: new Date(),
});

// Reactive state for debitor students
const debitorStudents = ref<any[]>([]);

// Reactive state for upcoming payments
const upcomingPayments = ref<any[]>([]);

// Modal state
const lessonDetailsModal = ref(false);
const selectedLesson = ref<any>(null);

// Fetch dashboard data from API
const fetchDashboardData = async () => {
  try {
    // Get student stats
    try {
      const studentsResponse = await api.get<{ data: any[]; total: number }>(
        apiService.value,
        "/users/students?limit=1000",
      );
      const students = studentsResponse.data || [];
      dashboard.totalStudents = studentsResponse.total || students.length;

      // Calculate new students (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dashboard.newStudents = students.filter(
        (s) => new Date(s.created_at) > thirtyDaysAgo,
      ).length;
    } catch (studentError) {
      console.error("Failed to fetch student data:", studentError);
      dashboard.totalStudents = 0;
      dashboard.newStudents = 0;
    }

    // Get group stats
    let groups = [];
    try {
      const groupsResponse = await api.get<{ data: any[]; total: number }>(
        apiService.value,
        "/groups?limit=1000",
      );
      groups = groupsResponse.data || [];
      dashboard.activeGroups = groupsResponse.total || groups.length;

      // Calculate recent groups (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dashboard.recentGroups = groups.filter(
        (g) => new Date(g.createdAt) > thirtyDaysAgo,
      ).length;
    } catch (groupError) {
      console.error("Failed to fetch group data:", groupError);
      dashboard.activeGroups = 0;
      dashboard.recentGroups = 0;
    }

    // Get upcoming payments data
    try {
      const upcomingResponse = await api.get<any[]>(
        apiService.value,
        "/student-payments/upcoming?days=7",
      );

      upcomingPayments.value = upcomingResponse || [];

      // Calculate total pending amount
      dashboard.pendingPaymentsAmount = upcomingPayments.value.reduce(
        (total, payment) => total + (payment.amount || 0),
        0,
      );
    } catch (upcomingError) {
      console.error("Failed to fetch upcoming payments:", upcomingError);
      upcomingPayments.value = [];
      dashboard.pendingPaymentsAmount = 0;
    }

    // Get leads data
    try {
      const leadsResponse = await api.get<{ leads: any[]; total: number }>(
        apiService.value,
        "/leads?limit=1000",
      );
      const leads = leadsResponse.leads || [];
      dashboard.newLeads = leads.length;
      dashboard.leadsConverted = leads.filter(
        (l) =>
          l.status === "O'qishga yozildi" || l.status === "O'qishga yozildi",
      ).length;

      // Get recent leads (up to 5)
      dashboard.recentLeads = leads
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5)
        .map((lead) => ({
          name: `${lead.first_name} ${lead.last_name}`,
          phone: lead.phone,
          question: lead.question,
          status: lead.status,
          source: lead.source,
        }));
    } catch (leadsError) {
      console.error("Failed to fetch leads data:", leadsError);
      dashboard.newLeads = 0;
      dashboard.leadsConverted = 0;
      dashboard.recentLeads = [];
    }

    // Get lesson schedules
    try {
      const lessonSchedules = await api.get<any[]>(
        apiService.value,
        "/lesson-schedules",
      );

      // Process lesson schedules for the daily view
      dashboard.lessonSchedules = lessonSchedules.map((lesson) => {
        return {
          id: lesson.id,
          groupId: lesson.group_id,
          groupName: lesson.group?.name || "Unknown Group",
          lessonName: lesson.lesson_name || "No lesson name",
          date: lesson.date,
          days: lesson.group?.days || "",
          startTime: lesson.group?.lesson_start || "",
          endTime: lesson.group?.lesson_end || "",
          teacherName:
            `${lesson.group?.teacher?.first_name || ""} ${
              lesson.group?.teacher?.last_name || ""
            }`.trim() || "Unknown Teacher",
        };
      });
    } catch (scheduleError) {
      console.error("Failed to fetch lesson schedules:", scheduleError);
      dashboard.lessonSchedules = [];
    }
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
  }
};

// Helper functions
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Tashkent",
  }).format(date);
};

const formatDatetime = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  }).format(date);
};

const formatCalendarDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tashkent",
  }).format(date);
};

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  }).format(date);
};

const formatHour = (hour: number): string => {
  return `${hour.toString().padStart(2, "0")}:00`;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "UZS",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatSimpleDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Tashkent",
  }).format(date);
};

// Calendar navigation functions
const navigatePrevious = () => {
  const current = new Date(dashboard.currentDate);
  dashboard.currentDate = addDays(current, -1);
};

const navigateNext = () => {
  const current = new Date(dashboard.currentDate);
  dashboard.currentDate = addDays(current, 1);
};

const navigateToday = () => {
  dashboard.currentDate = new Date();
};

// Get lessons for the selected day
const todayLessons = computed(() => {
  const currentDateStr = dashboard.currentDate.toISOString().split("T")[0];
  return dashboard.lessonSchedules
    .filter((lesson) => lesson.date === currentDateStr)
    .sort((a, b) => {
      // Sort by start time
      return a.startTime.localeCompare(b.startTime);
    });
});

// Show lesson details in a modal
const showLessonDetails = (lesson: any) => {
  selectedLesson.value = lesson;
  lessonDetailsModal.value = true;
};

// Navigation helper
const navigateTo = (path: string) => {
  window.location.href = path;
};

// Fetch data on component mount
onMounted(() => {
  fetchDashboardData();
});
</script>
