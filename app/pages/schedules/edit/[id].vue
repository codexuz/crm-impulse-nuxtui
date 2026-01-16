<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Edit Lesson Schedule</h1>
        <p class="text-muted-foreground">
          Update details for this scheduled lesson
        </p>
      </div>
      <Button variant="outline" size="sm" @click="navigateBack">
        <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
        Back to Schedules
      </Button>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin mr-2">
        <Icon name="lucide:loader" class="h-6 w-6" />
      </div>
      <span>Loading...</span>
    </div>

    <div v-else-if="!schedule.id" class="py-12 text-center">
      <p class="text-muted-foreground">Schedule not found</p>
      <Button variant="outline" class="mt-4" @click="navigateBack">
        Back to Schedules
      </Button>
    </div>

    <Card v-else>
      <CardHeader>
        <CardTitle>Schedule Details</CardTitle>
        <CardDescription>
          Update the information for this scheduled lesson
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="saveSchedule" class="space-y-6">
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
            />
          </div>

          <!-- Day Type -->
          <div class="space-y-2">
            <Label for="dayType">Day Type</Label>
            <Select v-model="schedule.day_time" id="dayType">
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
              <DatePicker v-model="startDate" id="startDate" />
            </div>
            <div class="space-y-2">
              <Label for="startTime">Start Time</Label>
              <div class="grid grid-cols-2 gap-2">
                <Select v-model="startHour">
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
                <Select v-model="startMinute">
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
              <DatePicker v-model="endDate" id="endDate" />
            </div>
            <div class="space-y-2">
              <Label for="endTime">End Time</Label>
              <div class="grid grid-cols-2 gap-2">
                <Select v-model="endHour">
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
                <Select v-model="endMinute">
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
        <Button @click="saveSchedule" :disabled="isSaving">
          <Icon
            v-if="isSaving"
            name="lucide:loader"
            class="mr-2 h-4 w-4 animate-spin"
          />
          <Icon v-else name="lucide:save" class="mr-2 h-4 w-4" />
          Save Changes
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
        <span>Schedule updated successfully!</span>
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

const route = useRoute();
const scheduleId = computed(() => route.params.id as string);
const { apiService } = useAuth();
const { toast } = useToast();

// State variables
const isLoading = ref(true);
const isSaving = ref(false);
const showSuccessAlert = ref(false);
const groups = ref<any[]>([]);
const schedule = reactive({
  id: "",
  group_id: "",
  room_number: "",
  day_time: "all", // Default to all days
  start_time: "",
  end_time: "",
  status: "active",
  notes: "",
});

// Date and time handling
const startDate = ref(new Date());
const endDate = ref(new Date());
const startHour = ref("09");
const startMinute = ref("00");
const endHour = ref("10");
const endMinute = ref("30");

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

// Parse date/time from the schedule object into our separate fields
const parseDateTime = (dateTimeStr: string, isStart: boolean) => {
  try {
    const date = new Date(dateTimeStr);
    if (isStart) {
      startDate.value = date;
      startHour.value = date.getHours().toString().padStart(2, "0");
      startMinute.value = date.getMinutes().toString().padStart(2, "0");
    } else {
      endDate.value = date;
      endHour.value = date.getHours().toString().padStart(2, "0");
      endMinute.value = date.getMinutes().toString().padStart(2, "0");
    }
  } catch (error) {
    console.error(`Failed to parse ${isStart ? "start" : "end"} time:`, error);
  }
};

// Fetch the schedule details
const fetchScheduleDetails = async () => {
  isLoading.value = true;
  try {
    const response = await api.get<any>(
      apiService.value,
      `/lesson-schedules/${scheduleId.value}`
    );

    // Update our schedule object with the data
    Object.assign(schedule, {
      id: response.id,
      group_id: response.group_id,
      room_number: response.room_number || "",
      day_time: response.day_time || "all",
      status: response.status || "active",
      notes: response.notes || "",
      start_time: response.start_time,
      end_time: response.end_time,
    });

    // Parse the date and time values
    if (response.start_time) {
      parseDateTime(response.start_time, true);
    }

    if (response.end_time) {
      parseDateTime(response.end_time, false);
    }
  } catch (error) {
    console.error("Failed to fetch schedule details:", error);
    toast({
      title: "Error",
      description: "Failed to load schedule details",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

// Format the date and time for the API
const formatDateTime = (date: Date, hour: string, minute: string): string => {
  const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  return `${formattedDate}T${hour}:${minute}:00+05:00`; // Uzbekistan timezone
};

// Save the updated schedule
const saveSchedule = async () => {
  isSaving.value = true;

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
      status: schedule.status,
      notes: schedule.notes,
    };

    // Send the PATCH request to update the schedule
    await api.patch(
      apiService.value,
      `/lesson-schedules/${scheduleId.value}`,
      scheduleData
    );

    // Show success message
    showSuccessAlert.value = true;
    setTimeout(() => {
      showSuccessAlert.value = false;
    }, 3000);

    toast({
      title: "Success",
      description: "Schedule updated successfully",
    });
  } catch (error) {
    console.error("Failed to update schedule:", error);
    toast({
      title: "Error",
      description: "Failed to update schedule",
      variant: "destructive",
    });
  } finally {
    isSaving.value = false;
  }
};

// Fetch initial data
onMounted(async () => {
  await Promise.all([fetchGroups(), fetchScheduleDetails()]);
});
</script>
