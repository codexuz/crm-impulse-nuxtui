<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Create New Schedule</h1>
        <p class="text-muted-foreground">Schedule a new lesson for a group</p>
      </div>
      <Button variant="outline" size="sm" @click="navigateBack">
        <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
        Back to Schedules
      </Button>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Schedule Details</CardTitle>
        <CardDescription>
          Enter the details for the new lesson schedule
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="createSchedule" class="space-y-6">
          <!-- Group Selection -->
          <div class="space-y-2">
            <Label for="group">Group</Label>
            <Select v-model="schedule.group_id" id="group" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="group in groups"
                  :key="group.id"
                  :value="group.id"
                >
                  {{ group.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">
              The group this lesson is scheduled for
            </p>
          </div>

          <!-- Room Number -->
          <div class="space-y-2">
            <Label for="room">Room Number</Label>
            <Input
              v-model="schedule.room_number"
              id="room"
              placeholder="Enter room number"
              required
            />
          </div>

          <!-- Day Type -->
          <div class="space-y-2">
            <Label for="dayType">Day Type</Label>
            <Select v-model="schedule.day_time" id="dayType" required>
              <SelectTrigger>
                <SelectValue placeholder="Select day type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                <SelectItem value="odd">Odd Days</SelectItem>
                <SelectItem value="even">Even Days</SelectItem>
              </SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">
              Specify if this lesson occurs on odd days, even days, or all days
            </p>
          </div>

          <!-- Date and Time -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="startDate">Start Date</Label>
              <DatePicker v-model="startDate" id="startDate" required />
            </div>
            <div class="space-y-2">
              <Label for="startTime">Start Time</Label>
              <div class="grid grid-cols-2 gap-2">
                <Select v-model="startHour" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="hour in 24"
                      :key="hour - 1"
                      :value="(hour - 1).toString().padStart(2, '0')"
                    >
                      {{ (hour - 1).toString().padStart(2, "0") }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select v-model="startMinute" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Minute" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="minute in [0, 15, 30, 45]"
                      :key="minute"
                      :value="minute.toString().padStart(2, '0')"
                    >
                      {{ minute.toString().padStart(2, "0") }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div class="space-y-2">
              <Label for="endDate">End Date</Label>
              <DatePicker v-model="endDate" id="endDate" required />
            </div>
            <div class="space-y-2">
              <Label for="endTime">End Time</Label>
              <div class="grid grid-cols-2 gap-2">
                <Select v-model="endHour" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="hour in 24"
                      :key="hour - 1"
                      :value="(hour - 1).toString().padStart(2, '0')"
                    >
                      {{ (hour - 1).toString().padStart(2, "0") }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select v-model="endMinute" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Minute" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="minute in [0, 15, 30, 45]"
                      :key="minute"
                      :value="minute.toString().padStart(2, '0')"
                    >
                      {{ minute.toString().padStart(2, "0") }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter class="flex justify-between">
        <Button variant="outline" @click="navigateBack">Cancel</Button>
        <Button @click="createSchedule" :disabled="isCreating || !isFormValid">
          <Icon
            v-if="isCreating"
            name="lucide:loader"
            class="mr-2 h-4 w-4 animate-spin"
          />
          <Icon v-else name="lucide:plus" class="mr-2 h-4 w-4" />
          Create Schedule
        </Button>
      </CardFooter>
    </Card>

    <!-- Success Alert -->
    <div
      v-if="showSuccessAlert"
      class="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded"
    >
      <div class="flex items-center">
        <Icon name="lucide:check-circle" class="h-5 w-5 mr-2" />
        <span>Schedule created successfully!</span>
        <button @click="showSuccessAlert = false" class="ml-4">
          <Icon name="lucide:x" class="h-4 w-4" />
        </button>
      </div>
    </div>
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
const isCreating = ref(false);
const showSuccessAlert = ref(false);
const groups = ref<any[]>([]);
const schedule = reactive({
  group_id: "",
  room_number: "",
  day_time: "all", // Default to all days
  notes: "",
});

// Date and time handling
const startDate = ref(new Date());
const endDate = ref(new Date());
const startHour = ref("09");
const startMinute = ref("00");
const endHour = ref("10");
const endMinute = ref("30");

// Recurring schedule options
const isRecurring = ref(false);
const recurringSettings = reactive({
  frequency: "weekly",
  daysOfWeek: {
    0: false, // Sunday
    1: true, // Monday
    2: false,
    3: true,
    4: false,
    5: true,
    6: false,
  },
});

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

// Form validation
const isFormValid = computed(() => {
  return (
    !!schedule.group_id &&
    !!schedule.room_number &&
    !!schedule.day_time &&
    !!startDate.value &&
    !!startHour.value &&
    !!startMinute.value &&
    !!endDate.value &&
    !!endHour.value &&
    !!endMinute.value
  );
});

// Navigation
const navigateBack = () => {
  navigateTo("/schedules");
};

// Fetch all groups for the dropdown
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

// Format the date and time for the API
const formatDateTime = (date: Date, hour: string, minute: string): string => {
  const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  return `${formattedDate}T${hour}:${minute}:00+05:00`; // Uzbekistan timezone
};

// Create the schedule
const createSchedule = async () => {
  if (!isFormValid.value) {
    toast({
      title: "Validation Error",
      description: "Please fill in all required fields",
      variant: "destructive",
    });
    return;
  }

  isCreating.value = true;

  try {
    // Format the start and end times
    const formattedStartTime = formatDateTime(
      startDate.value,
      startHour.value,
      startMinute.value
    );

    const formattedEndTime = formatDateTime(
      endDate.value,
      endHour.value,
      endMinute.value
    );

    // Prepare the data to send to the API
    const scheduleData = {
      group_id: schedule.group_id,
      room_number: schedule.room_number,
      day_time: schedule.day_time,
      start_time: formattedStartTime,
      end_time: formattedEndTime,
      notes: schedule.notes,
    };

    // Add recurring schedule information if enabled
    if (isRecurring.value) {
      Object.assign(scheduleData, {
        recurring: true,
        recurring_frequency: recurringSettings.frequency,
        recurring_days: Object.entries(recurringSettings.daysOfWeek)
          .filter(([_, selected]) => selected)
          .map(([day, _]) => parseInt(day)),
      });
    }

    // Send the POST request to create the schedule
    const response = await api.post(
      apiService.value,
      "/lesson-schedules",
      scheduleData
    );

    // Show success message
    showSuccessAlert.value = true;
    setTimeout(() => {
      showSuccessAlert.value = false;
    }, 3000);

    toast({
      title: "Success",
      description: "Schedule created successfully",
    });

    // Optionally redirect to the schedule list or the created schedule
    if (response && response.id) {
      setTimeout(() => {
        navigateTo(`/schedules/edit/${response.id}`);
      }, 1500);
    } else {
      setTimeout(() => {
        navigateTo("/schedules");
      }, 1500);
    }
  } catch (error) {
    console.error("Failed to create schedule:", error);
    toast({
      title: "Error",
      description: "Failed to create schedule",
      variant: "destructive",
    });
  } finally {
    isCreating.value = false;
  }
};

// Fetch initial data
onMounted(async () => {
  await fetchGroups();

  // Set default end date to same as start date
  endDate.value = new Date(startDate.value);

  // Default the end time to be 90 minutes after start time
  const endTimeHours = parseInt(startHour.value) + 1;
  const endTimeMinutes = parseInt(startMinute.value) + 30;

  // Handle overflow
  let adjustedHours = endTimeHours;
  let adjustedMinutes = endTimeMinutes;

  if (endTimeMinutes >= 60) {
    adjustedHours += 1;
    adjustedMinutes = endTimeMinutes - 60;
  }

  // Ensure values stay within bounds
  if (adjustedHours >= 24) {
    adjustedHours = 23;
    adjustedMinutes = 59;
  }

  endHour.value = adjustedHours.toString().padStart(2, "0");
  endMinute.value = adjustedMinutes.toString().padStart(2, "0");
});
</script>
