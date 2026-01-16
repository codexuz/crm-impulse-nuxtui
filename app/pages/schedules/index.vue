<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Lesson Schedules</h1>
        <p class="text-muted-foreground">
          View and manage all scheduled classes
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="default"
          size="default"
          @click="navigateTo('/schedules/create')"
        >
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          Create Schedule
        </Button>
        <Select v-model="filters.groupId" class="w-[200px]">
          <SelectTrigger>
            <SelectValue placeholder="All Groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            <SelectItem
              v-for="group in groups"
              :key="group.id"
              :value="group.id"
            >
              {{ group.name }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select v-model="filters.teacherId" class="w-[200px]">
          <SelectTrigger>
            <SelectValue placeholder="All Teachers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teachers</SelectItem>
            <SelectItem
              v-for="teacher in teachers"
              :key="teacher.user_id"
              :value="teacher.user_id"
            >
              {{ teacher.first_name }} {{ teacher.last_name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <Card>
      <CardHeader class="pb-2">
        <div class="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            class="h-8"
            :class="
              calendarView === 'day' ? 'bg-primary text-primary-foreground' : ''
            "
            @click="calendarView = 'day'"
          >
            Day
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="h-8"
            :class="
              calendarView === 'week'
                ? 'bg-primary text-primary-foreground'
                : ''
            "
            @click="calendarView = 'week'"
          >
            Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="h-8"
            :class="
              calendarView === 'month'
                ? 'bg-primary text-primary-foreground'
                : ''
            "
            @click="calendarView = 'month'"
          >
            Month
          </Button>
          <div class="ml-auto flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              class="h-8"
              @click="navigatePrevious"
            >
              <Icon name="lucide:chevron-left" class="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="h-8"
              @click="navigateToday"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="h-8"
              @click="navigateNext"
            >
              <Icon name="lucide:chevron-right" class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div class="calendar-container">
          <!-- Calendar Header -->
          <div class="grid grid-cols-7 gap-1 mb-2">
            <template
              v-if="calendarView === 'week' || calendarView === 'month'"
            >
              <div
                v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
                class="text-center font-medium text-sm py-2"
              >
                {{ day }}
              </div>
            </template>
            <template v-else>
              <div class="col-span-7 text-center font-medium">
                {{ formatCalendarDate(currentDate) }}
              </div>
            </template>
          </div>

          <!-- Month View -->
          <div
            v-if="calendarView === 'month'"
            class="grid grid-cols-7 gap-1 h-[600px]"
          >
            <template v-for="(day, index) in calendarDays" :key="index">
              <div
                class="border rounded p-1 h-full overflow-auto"
                :class="
                  isCurrentDay(day)
                    ? 'bg-primary/10 border-primary'
                    : !isSameMonth(day, currentDate)
                    ? 'bg-muted/20 text-muted-foreground'
                    : ''
                "
              >
                <div class="text-right text-xs mb-1">{{ day.getDate() }}</div>
                <div
                  v-for="lesson in getFilteredLessonsForDay(day)"
                  :key="`${lesson.id}-${index}`"
                  class="mb-1 p-1 text-xs rounded cursor-pointer"
                  :class="getLessonStatusClass(lesson)"
                  @click="showLessonDetails(lesson)"
                >
                  {{ formatTime(lesson.startTime) }} - {{ lesson.groupName }}
                </div>
              </div>
            </template>
          </div>

          <!-- Week View -->
          <div
            v-else-if="calendarView === 'week'"
            class="grid grid-cols-7 gap-1"
          >
            <template v-for="(day, index) in weekDays" :key="index">
              <div
                class="border rounded p-1 h-[600px] overflow-auto"
                :class="isCurrentDay(day) ? 'bg-primary/10 border-primary' : ''"
              >
                <div class="text-center text-xs mb-2 font-medium">
                  {{ formatDate(day) }}
                </div>
                <div
                  v-for="lesson in getFilteredLessonsForDay(day)"
                  :key="`${lesson.id}-${index}`"
                  class="mb-1 p-2 text-xs rounded cursor-pointer"
                  :class="getLessonStatusClass(lesson)"
                  @click="showLessonDetails(lesson)"
                >
                  <div class="font-bold">
                    {{ formatTime(lesson.startTime) }} -
                    {{ formatTime(lesson.endTime) }}
                  </div>
                  <div>{{ lesson.groupName }}</div>
                  <div class="text-xs">
                    {{ lesson.teacherName }}
                  </div>
                  <div class="text-xs">Room: {{ lesson.roomNumber }}</div>
                </div>
              </div>
            </template>
          </div>

          <!-- Day View -->
          <div v-else class="border rounded p-2 h-[600px] overflow-auto">
            <div
              v-for="hour in Array.from({ length: 15 }, (_, i) => i + 8)"
              :key="hour"
              class="relative h-12 border-b"
            >
              <div class="absolute left-0 text-xs text-muted-foreground w-14">
                {{ formatHour(hour) }}
              </div>
              <div
                v-for="lesson in getFilteredLessonsForHour(currentDate, hour)"
                :key="lesson.id"
                class="absolute left-16 right-0 rounded px-2 py-1 cursor-pointer"
                :class="getLessonStatusClass(lesson)"
                :style="getLessonPositionStyle(lesson, hour)"
                @click="showLessonDetails(lesson)"
              >
                <div class="font-bold text-xs">{{ lesson.groupName }}</div>
                <div class="text-xs">
                  {{ formatTime(lesson.startTime) }} -
                  {{ formatTime(lesson.endTime) }}
                </div>
                <div class="text-xs">{{ lesson.teacherName }}</div>
                <div class="text-xs">Room: {{ lesson.roomNumber }}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Lesson Details Dialog -->
    <Dialog v-model:open="showDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lesson Details</DialogTitle>
          <DialogDescription>
            Information about the selected lesson
          </DialogDescription>
        </DialogHeader>
        <div v-if="selectedLesson" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="text-sm font-medium mb-1">Group</h4>
              <p>{{ selectedLesson.groupName }}</p>
            </div>
            <div>
              <h4 class="text-sm font-medium mb-1">Teacher</h4>
              <p>{{ selectedLesson.teacherName }}</p>
            </div>
            <div>
              <h4 class="text-sm font-medium mb-1">Date</h4>
              <p>{{ formatCalendarDate(selectedLesson.startTime) }}</p>
            </div>
            <div>
              <h4 class="text-sm font-medium mb-1">Time</h4>
              <p>
                {{ formatTime(selectedLesson.startTime) }} -
                {{ formatTime(selectedLesson.endTime) }}
              </p>
            </div>
            <div>
              <h4 class="text-sm font-medium mb-1">Room</h4>
              <p>{{ selectedLesson.roomNumber }}</p>
            </div>
            <div>
              <h4 class="text-sm font-medium mb-1">Day Type</h4>
              <p>{{ selectedLesson.dayTime || "All days" }}</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showDialog = false">Close</Button>
          <Button @click="editLesson">Edit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";
import { api } from "~/lib/api";

definePageMeta({
  middleware: ["auth"],
});

const { apiService } = useAuth();
const { toast } = useToast();

// State variables
const isLoading = ref(false);
const calendarView = ref<"day" | "week" | "month">("day");
const currentDate = ref(new Date());
const lessonSchedules = ref<any[]>([]);
const groups = ref<any[]>([]);
const teachers = ref<any[]>([]);
const filters = reactive({
  groupId: "all",
  teacherId: "all",
});

// Dialog state
const showDialog = ref(false);
const selectedLesson = ref<any>(null);

// Fetch data
const fetchLessonSchedules = async () => {
  isLoading.value = true;
  try {
    const response = await api.get<any[]>(
      apiService.value,
      "/lesson-schedules"
    );

    // Process lesson schedules for the calendar view
    lessonSchedules.value = response.map((lesson) => {
      // Parse dates using the Uzbekistan timezone
      const startTime = new Date(lesson.start_time);
      const endTime = new Date(lesson.end_time);

      return {
        id: lesson.id,
        groupId: lesson.group?.id,
        groupName: lesson.group?.name || "Unknown Group",
        teacherId: lesson.group?.teacher?.user_id,
        roomNumber: lesson.room_number,
        dayTime: lesson.day_time, // odd/even days
        startTime,
        endTime,
        teacherName:
          `${lesson.group?.teacher?.first_name || ""} ${
            lesson.group?.teacher?.last_name || ""
          }`.trim() || "Unknown Teacher",
        status: lesson.status || "active",
      };
    });
  } catch (error) {
    console.error("Failed to fetch lesson schedules:", error);
    toast({
      title: "Error",
      description: "Failed to load lesson schedules",
      variant: "destructive",
    });
    lessonSchedules.value = [];
  } finally {
    isLoading.value = false;
  }
};

const fetchGroups = async () => {
  try {
    groups.value = await api.get<any[]>(apiService.value, "/groups");
  } catch (error) {
    console.error("Failed to fetch groups:", error);
    toast({
      title: "Error",
      description: "Failed to load groups",
      variant: "destructive",
    });
    groups.value = [];
  }
};

const fetchTeachers = async () => {
  try {
    teachers.value = await api.get<any[]>(apiService.value, "/users/teachers");
  } catch (error) {
    console.error("Failed to fetch teachers:", error);
    toast({
      title: "Error",
      description: "Failed to load teachers",
      variant: "destructive",
    });
    teachers.value = [];
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

// Calendar navigation functions
const navigatePrevious = () => {
  const current = new Date(currentDate.value);
  if (calendarView.value === "day") {
    currentDate.value = addDays(current, -1);
  } else if (calendarView.value === "week") {
    currentDate.value = addDays(current, -7);
  } else {
    const newDate = new Date(current);
    newDate.setMonth(current.getMonth() - 1);
    currentDate.value = newDate;
  }
};

const navigateNext = () => {
  const current = new Date(currentDate.value);
  if (calendarView.value === "day") {
    currentDate.value = addDays(current, 1);
  } else if (calendarView.value === "week") {
    currentDate.value = addDays(current, 7);
  } else {
    const newDate = new Date(current);
    newDate.setMonth(current.getMonth() + 1);
    currentDate.value = newDate;
  }
};

const navigateToday = () => {
  currentDate.value = new Date();
};

// Calendar utility functions
const isCurrentDay = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

const isSameMonth = (date1: Date, date2: Date): boolean => {
  return (
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

// Calendar data computed properties
const weekDays = computed(() => {
  const date = new Date(currentDate.value);
  const day = date.getDay();

  // Set to beginning of week (Sunday)
  date.setDate(date.getDate() - day);

  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  return days;
});

const calendarDays = computed(() => {
  const date = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth(),
    1
  );
  const days = [];

  // Get to the first Sunday before or on the 1st of the month
  while (date.getDay() !== 0) {
    date.setDate(date.getDate() - 1);
  }

  // Generate 6 weeks of days (42 days)
  for (let i = 0; i < 42; i++) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  return days;
});

// Filter lessons based on user selection
const filterLessons = (lessons: any[]) => {
  return lessons.filter((lesson) => {
    // Apply group filter
    if (
      filters.groupId &&
      filters.groupId !== "all" &&
      lesson.groupId !== filters.groupId
    ) {
      return false;
    }

    // Apply teacher filter
    if (
      filters.teacherId &&
      filters.teacherId !== "all" &&
      lesson.teacherId !== filters.teacherId
    ) {
      return false;
    }

    return true;
  });
};

// Get filtered lessons for a specific day
const getFilteredLessonsForDay = (day: Date) => {
  const lessons = lessonSchedules.value.filter((lesson) =>
    isSameDay(new Date(lesson.startTime), day)
  );
  return filterLessons(lessons);
};

// Get filtered lessons for a specific hour
const getFilteredLessonsForHour = (day: Date, hour: number) => {
  const lessons = lessonSchedules.value.filter((lesson) => {
    const lessonDate = new Date(lesson.startTime);
    return isSameDay(lessonDate, day) && lessonDate.getHours() === hour;
  });
  return filterLessons(lessons);
};

// Get position and height for a lesson in day view
const getLessonPositionStyle = (lesson: any, hour: number) => {
  const startTime = new Date(lesson.startTime);
  const endTime = new Date(lesson.endTime);

  const minuteOffset = (startTime.getMinutes() / 60) * 100;
  const durationMinutes =
    (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  const heightPercentage = (durationMinutes / 60) * 100;

  return {
    top: `${minuteOffset}%`,
    height: `${heightPercentage}%`,
  };
};

// Get color class based on lesson status
const getLessonStatusClass = (lesson: any) => {
  switch (lesson.status) {
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "rescheduled":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-primary/20";
  }
};

// Show lesson details
const showLessonDetails = (lesson: any) => {
  selectedLesson.value = lesson;
  showDialog.value = true;
};

// Edit lesson
const editLesson = () => {
  const lessonId = selectedLesson.value?.id;
  if (lessonId) {
    navigateTo(`/schedules/edit/${lessonId}`);
  }
  showDialog.value = false;
};

// Fetch data on component mount
onMounted(async () => {
  await Promise.all([fetchLessonSchedules(), fetchGroups(), fetchTeachers()]);
});

// Watch for filter changes to update the calendar
watch([filters.groupId, filters.teacherId], () => {
  // No need to refetch data, just re-apply filters
});
</script>

<style scoped>
.calendar-container {
  min-height: 600px;
}
</style>
