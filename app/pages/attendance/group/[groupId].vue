<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Group Attendance</h1>
        <p class="text-muted-foreground">
          {{ group.name || "Loading group details..." }}
        </p>
      </div>
      <div>
        <div class="flex flex-col space-y-2">
          <Input type="date" v-model="dateInputValue" class="w-[180px]" />
        </div>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Attendance for {{ formatDate(selectedDate) }}</CardTitle>
        <CardDescription>
          Mark attendance status for each student in the group
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="isLoading" class="flex justify-center py-8">
          <div class="animate-spin mr-2">
            <Icon name="lucide:loader" class="h-6 w-6" />
          </div>
          <span>Loading...</span>
        </div>
        <div v-else-if="groupStudents.length === 0" class="py-8 text-center">
          <p class="text-muted-foreground">No students found in this group</p>
        </div>
        <div v-else>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-12">#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="(student, index) in groupStudents"
                :key="student.student.user_id"
              >
                <TableCell class="font-medium">{{ index + 1 }}</TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Avatar v-if="student.student.avatar_url">
                      <AvatarImage :src="student.student.avatar_url" />
                      <AvatarFallback>{{
                        getInitials(
                          student.student.first_name,
                          student.student.last_name
                        )
                      }}</AvatarFallback>
                    </Avatar>
                    <Avatar v-else>
                      <AvatarFallback>{{
                        getInitials(
                          student.student.first_name,
                          student.student.last_name
                        )
                      }}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div>
                        {{ student.student.first_name }}
                        {{ student.student.last_name }}
                      </div>
                      <div class="text-xs text-muted-foreground">
                        {{ student.student.phone }}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    v-model="getAttendanceData(student.student.user_id).status"
                    :disabled="isSaving"
                  >
                    <SelectTrigger class="w-[180px]">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">
                        <div class="flex items-center">
                          <span
                            class="h-2 w-2 rounded-full bg-green-500 mr-2"
                          ></span>
                          Present
                        </div>
                      </SelectItem>
                      <SelectItem value="absent">
                        <div class="flex items-center">
                          <span
                            class="h-2 w-2 rounded-full bg-red-500 mr-2"
                          ></span>
                          Absent
                        </div>
                      </SelectItem>
                      <SelectItem value="late">
                        <div class="flex items-center">
                          <span
                            class="h-2 w-2 rounded-full bg-yellow-500 mr-2"
                          ></span>
                          Late
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    v-model="getAttendanceData(student.student.user_id).note"
                    placeholder="Optional note"
                    :disabled="isSaving"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter class="flex justify-between">
        <Button
          variant="outline"
          @click="fetchAttendanceData"
          :disabled="isLoading || isSaving"
        >
          Refresh
        </Button>
        <Button
          @click="saveAttendance"
          :disabled="isLoading || isSaving || !hasChanges"
        >
          <Icon
            v-if="isSaving"
            name="lucide:loader"
            class="mr-2 h-4 w-4 animate-spin"
          />
          <Icon v-else name="lucide:save" class="mr-2 h-4 w-4" />
          Save Attendance
        </Button>
      </CardFooter>
    </Card>

    <div
      v-if="showSuccessAlert"
      class="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded"
    >
      <div class="flex items-center">
        <Icon name="lucide:check-circle" class="h-5 w-5 mr-2" />
        <span>Attendance saved successfully!</span>
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
const groupStudents = ref<any[]>([]);
const selectedDate = ref(new Date());
const attendanceData = reactive<
  Record<string, { status: string; note: string }>
>({});
const showSuccessAlert = ref(false);

// Computed
const hasChanges = computed(() => {
  return Object.values(attendanceData).some((data) => data.status !== "");
});

const dateInputValue = computed({
  get: () => formatDateForApi(selectedDate.value),
  set: (value: string) => {
    selectedDate.value = new Date(value + "T00:00:00");
  },
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

// Fetch group students
const fetchGroupStudents = async () => {
  try {
    const response = await api.get<any[]>(
      apiService.value,
      `/group-students/group/${groupId.value}`
    );
    groupStudents.value = response || [];

    // Initialize attendance data for each student
    groupStudents.value.forEach((student) => {
      if (!attendanceData[student.student.user_id]) {
        attendanceData[student.student.user_id] = {
          status: "",
          note: "",
        };
      }
    });
  } catch (error) {
    console.error("Failed to fetch group students:", error);
    toast({
      title: "Error",
      description: "Failed to load students",
      variant: "destructive",
    });
  }
};

// Fetch existing attendance data for the selected date
const fetchAttendanceData = async () => {
  isLoading.value = true;

  try {
    // Reset attendance data
    groupStudents.value.forEach((student) => {
      attendanceData[student.student.user_id] = {
        status: "",
        note: "",
      };
    });

    // Format date for API call (YYYY-MM-DD)
    const formattedDate = formatDateForApi(selectedDate.value);

    // Get existing attendance records for this group and date using the date range endpoint
    const response = await api.get<any[]>(
      apiService.value,
      `/attendance/group/${groupId.value}/daterange?startDate=${formattedDate}&endDate=${formattedDate}`
    );

    // Update attendance data with existing records
    if (response && response.length > 0) {
      response.forEach((record) => {
        if (attendanceData[record.student_id]) {
          attendanceData[record.student_id] = {
            status: record.status,
            note: record.note || "",
          };
        }
      });
    }
  } catch (error) {
    console.error("Failed to fetch attendance data:", error);
    toast({
      title: "Error",
      description: "Failed to load attendance records",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

// Save attendance records
const saveAttendance = async () => {
  isSaving.value = true;
  const formattedDate = formatDateForApi(selectedDate.value);
  let hasErrors = false;

  try {
    // Create an array of attendance records to save
    const attendanceRecords = Object.entries(attendanceData)
      .filter(([_, data]) => data.status !== "") // Only save records with a status
      .map(([studentId, data]) => ({
        group_id: groupId.value,
        student_id: studentId,
        teacher_id: group.teacher?.user_id || group.teacher_id,
        status: data.status,
        note: data.note,
        date: formattedDate,
      }));

    // Save each attendance record
    for (const record of attendanceRecords) {
      try {
        await api.post(apiService.value, "/attendance", record);
      } catch (error) {
        console.error(
          `Failed to save attendance for student ${record.student_id}:`,
          error
        );
        hasErrors = true;
      }
    }

    if (hasErrors) {
      toast({
        title: "Warning",
        description: "Some attendance records failed to save",
      });
    } else {
      showSuccessAlert.value = true;
      setTimeout(() => {
        showSuccessAlert.value = false;
      }, 3000);
    }
  } catch (error) {
    console.error("Failed to save attendance:", error);
    toast({
      title: "Error",
      description: "Failed to save attendance",
      variant: "destructive",
    });
  } finally {
    isSaving.value = false;
  }
};

// Helper functions
const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.charAt(0) || ""}${
    lastName?.charAt(0) || ""
  }`.toUpperCase();
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tashkent",
  }).format(date);
};

const formatDateForApi = (date: Date): string => {
  const d = new Date(date);
  // Adjust to Uzbekistan timezone
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to get attendance data safely
const getAttendanceData = (studentId: string) => {
  if (!attendanceData[studentId]) {
    attendanceData[studentId] = { status: "", note: "" };
  }
  return attendanceData[studentId];
};

// Fetch initial data
onMounted(async () => {
  isLoading.value = true;

  // Initialize date to today
  selectedDate.value = new Date();

  await Promise.all([fetchGroupDetails(), fetchGroupStudents()]);
  await fetchAttendanceData();
  isLoading.value = false;
});

// Watch for date changes to reload attendance data
watch(selectedDate, () => {
  fetchAttendanceData();
});
</script>
