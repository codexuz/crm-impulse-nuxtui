<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          Group Lesson Schedules
        </h1>
        <p class="text-muted-foreground">
          {{ group.name || "Loading group details..." }}
        </p>
      </div>
      <Button variant="default" @click="openCreateModal">
        <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
        Add Schedule
      </Button>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Scheduled Lessons</CardTitle>
        <CardDescription>All scheduled lessons for this group</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="isLoading" class="flex justify-center py-8">
          <div class="animate-spin mr-2">
            <Icon name="lucide:loader" class="h-6 w-6" />
          </div>
          <span>Loading...</span>
        </div>
        <div v-else-if="schedules.length === 0" class="py-8 text-center">
          <p class="text-muted-foreground">No schedules found for this group</p>
        </div>
        <div v-else>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Day Type</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead class="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="schedule in schedules" :key="schedule.id">
                <TableCell>
                  {{ formatTime(schedule.start_time) }} -
                  {{ formatTime(schedule.end_time) }}
                </TableCell>
                <TableCell>{{ schedule.room_number }}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {{ getDayTypeLabel(schedule.day_time) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  {{ schedule.group?.teacher?.first_name }}
                  {{ schedule.group?.teacher?.last_name }}
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      @click="openEditModal(schedule)"
                    >
                      <Icon name="lucide:pencil" class="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      @click="confirmDelete(schedule)"
                    >
                      <Icon name="lucide:trash" class="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <!-- Create/Edit Modal -->
    <Dialog v-model:open="showModal">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{
            isEditing ? "Edit Lesson Schedule" : "Create Lesson Schedule"
          }}</DialogTitle>
          <DialogDescription>
            {{
              isEditing
                ? "Update the lesson schedule details"
                : "Add a new lesson schedule for this group"
            }}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="date" class="text-right">Date</Label>
            <Input
              id="date"
              type="date"
              v-model="formData.date"
              class="col-span-3"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="startTime" class="text-right">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              v-model="formData.startTime"
              class="col-span-3"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="endTime" class="text-right">End Time</Label>
            <Input
              id="endTime"
              type="time"
              v-model="formData.endTime"
              class="col-span-3"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="roomNumber" class="text-right">Room</Label>
            <Input
              id="roomNumber"
              v-model="formData.roomNumber"
              placeholder="Room number"
              class="col-span-3"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="dayTime" class="text-right">Day Type</Label>
            <Select v-model="formData.dayTime" class="col-span-3">
              <SelectTrigger id="dayTime">
                <SelectValue placeholder="Select day type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="odd">Odd days</SelectItem>
                <SelectItem value="even">Even days</SelectItem>
                <SelectItem value="both">All days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showModal = false">Cancel</Button>
          <Button @click="saveSchedule" :disabled="isSaving">
            <Icon
              v-if="isSaving"
              name="lucide:loader"
              class="mr-2 h-4 w-4 animate-spin"
            />
            <span>{{ isEditing ? "Update" : "Create" }}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Modal -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the selected lesson schedule. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            @click="deleteSchedule"
            class="bg-destructive text-destructive-foreground"
          >
            <Icon
              v-if="isDeleting"
              name="lucide:loader"
              class="mr-2 h-4 w-4 animate-spin"
            />
            <span>Delete</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";
import { api } from "~/lib/api";

const route = useRoute();
const groupId = computed(() => route.params.groupId as string);
const { apiService } = useAuth();
const { toast } = useToast();

definePageMeta({
  middleware: ["auth"],
});

// State variables
const isLoading = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const showModal = ref(false);
const showDeleteDialog = ref(false);
const isEditing = ref(false);
const selectedSchedule = ref<any>(null);
const schedules = ref<any[]>([]);
const group = reactive({
  id: "",
  name: "",
  teacher_id: "",
  teacher: {
    first_name: "",
    last_name: "",
    user_id: "",
  },
});

// Form data for create/edit
const formData = reactive({
  date: "",
  startTime: "",
  endTime: "",
  roomNumber: "",
  dayTime: "both",
});

// Fetch group details
const fetchGroupDetails = async () => {
  try {
    const response = await api.get<any>(
      apiService.value,
      `/groups/${groupId.value}`
    );
    Object.assign(group, response);
  } catch (error) {
    console.error("Failed to fetch group details:", error);
    toast({
      title: "Error",
      description: "Failed to load group details",
      variant: "destructive",
    });
  }
};

// Fetch group lesson schedules
const fetchSchedules = async () => {
  isLoading.value = true;
  try {
    const response = await api.get<any[]>(
      apiService.value,
      `/lesson-schedules/group/${groupId.value}`
    );
    schedules.value = response || [];
  } catch (error) {
    console.error("Failed to fetch schedules:", error);
    toast({
      title: "Error",
      description: "Failed to load schedules",
      variant: "destructive",
    });
    schedules.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Tashkent",
  });
};

const formatTime = (timeString: string) => {
  return new Date(timeString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tashkent",
  });
};

const getDayTypeLabel = (dayTime: string): string => {
  switch (dayTime) {
    case "odd":
      return "Odd days";
    case "even":
      return "Even days";
    case "both":
      return "All days";
    default:
      return dayTime || "All days";
  }
};

// Format date for API
const formatDateForApi = (date: Date): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Format date for HTML date input (YYYY-MM-DD)
const formatDateForInput = (date: Date): string => {
  return formatDateForApi(date);
};

// Parse time string to Date
const parseTimeToDate = (timeString: string): Date => {
  const [hoursStr, minutesStr] = timeString.split(":");
  const hours = hoursStr ? parseInt(hoursStr, 10) : 0;
  const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Modal functions
const openCreateModal = () => {
  isEditing.value = false;
  // Reset form
  const today = new Date();
  formData.date = formatDateForInput(today);
  formData.startTime = "09:00";
  formData.endTime = "10:30";
  formData.roomNumber = "";
  formData.dayTime = "both";

  showModal.value = true;
};

const openEditModal = (schedule: any) => {
  isEditing.value = true;
  selectedSchedule.value = schedule;

  // Parse date and times
  const startDateTime = new Date(schedule.start_time);
  const endDateTime = new Date(schedule.end_time);

  // Format date for date input (YYYY-MM-DD)
  formData.date = formatDateForInput(startDateTime);

  // Format hours and minutes for time input
  formData.startTime = `${String(startDateTime.getHours()).padStart(
    2,
    "0"
  )}:${String(startDateTime.getMinutes()).padStart(2, "0")}`;
  formData.endTime = `${String(endDateTime.getHours()).padStart(
    2,
    "0"
  )}:${String(endDateTime.getMinutes()).padStart(2, "0")}`;

  formData.roomNumber = schedule.room_number;
  formData.dayTime = schedule.day_time || "both";

  showModal.value = true;
};

const confirmDelete = (schedule: any) => {
  selectedSchedule.value = schedule;
  showDeleteDialog.value = true;
};

// Save (create or update) a schedule
const saveSchedule = async () => {
  isSaving.value = true;

  try {
    // Create start_time and end_time using the selected date with the selected times
    const selectedDate = new Date(formData.date);
    const startDateTime = parseTimeToDate(formData.startTime);
    const endDateTime = parseTimeToDate(formData.endTime);

    // Set the date part from the selected date
    startDateTime.setFullYear(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );
    endDateTime.setFullYear(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    const scheduleData = {
      group_id: groupId.value,
      room_number: formData.roomNumber,
      day_time: formData.dayTime,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
    };

    if (isEditing.value && selectedSchedule.value) {
      // Update existing schedule
      await api.patch(
        apiService.value,
        `/lesson-schedules/${selectedSchedule.value.id}`,
        scheduleData
      );
      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
    } else {
      // Create new schedule
      await api.post(apiService.value, "/lesson-schedules", scheduleData);
      toast({
        title: "Success",
        description: "Schedule created successfully",
      });
    }

    // Close modal and refresh data
    showModal.value = false;
    await fetchSchedules();
  } catch (error) {
    console.error("Failed to save schedule:", error);
    toast({
      title: "Error",
      description: "Failed to save schedule",
      variant: "destructive",
    });
  } finally {
    isSaving.value = false;
  }
};

// Delete a schedule
const deleteSchedule = async () => {
  if (!selectedSchedule.value) return;

  isDeleting.value = true;
  try {
    await api.delete(
      apiService.value,
      `/lesson-schedules/${selectedSchedule.value.id}`
    );

    toast({
      title: "Success",
      description: "Schedule deleted successfully",
    });

    // Close dialog and refresh data
    showDeleteDialog.value = false;
    await fetchSchedules();
  } catch (error) {
    console.error("Failed to delete schedule:", error);
    toast({
      title: "Error",
      description: "Failed to delete schedule",
      variant: "destructive",
    });
  } finally {
    isDeleting.value = false;
  }
};

// Fetch initial data
onMounted(async () => {
  await Promise.all([fetchGroupDetails(), fetchSchedules()]);
});
</script>
