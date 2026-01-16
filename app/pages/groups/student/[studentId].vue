<template>
  <div>
    <!-- Full page loader -->
    <div
      v-if="isLoading"
      class="fixed inset-0 bg-background/80 flex items-center justify-center z-50"
    >
      <div class="text-center space-y-4">
        <Icon
          name="lucide:loader-2"
          class="h-12 w-12 animate-spin text-primary mx-auto"
        />
        <p class="text-xl font-medium">Loading student's groups...</p>
      </div>
    </div>

    <!-- Back button and page header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" @click="navigateTo('/students')">
            <Icon name="lucide:arrow-left" class="h-4 w-4 mr-1" />
            Back to Students
          </Button>
        </div>
        <h1 class="text-3xl font-bold mt-2">
          {{ studentName ? `${studentName}'s Groups` : "Student's Groups" }}
        </h1>
        <p class="text-muted-foreground">
          View and manage all groups this student is enrolled in
        </p>
      </div>
    </div>

    <!-- Student Profile Card -->
    <Card class="mb-6">
      <CardContent class="pt-6">
        <div class="flex items-center space-x-4">
          <Avatar class="h-16 w-16">
            <AvatarImage
              v-if="student?.avatar_url"
              :src="student.avatar_url"
              alt="Student avatar"
            />
            <AvatarFallback>
              {{ getInitials(student?.first_name, student?.last_name) }}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 class="text-lg font-semibold">
              {{ student?.first_name }} {{ student?.last_name }}
            </h3>
            <p class="text-muted-foreground">{{ student?.phone }}</p>
            <div class="flex items-center mt-1 gap-2">
              <Badge v-if="student?.is_active" variant="success">Active</Badge>
              <Badge v-else variant="destructive">Inactive</Badge>
              <span class="text-xs text-muted-foreground">
                ID: {{ studentId }}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Groups Table -->
    <Card>
      <CardHeader>
        <CardTitle>Enrolled Groups</CardTitle>
        <CardDescription>
          Groups the student is currently or previously enrolled in
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Enrolled At</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="isLoading">
                <TableCell colspan="6" class="text-center py-10">
                  <div class="flex justify-center">
                    <Icon
                      name="lucide:loader-2"
                      class="h-8 w-8 animate-spin text-primary"
                    />
                  </div>
                  <p class="text-muted-foreground mt-2">Loading groups...</p>
                </TableCell>
              </TableRow>
              <TableRow v-else-if="enrichedGroupData.length === 0">
                <TableCell colspan="6" class="text-center py-10">
                  <div class="flex justify-center">
                    <Icon
                      name="lucide:folder-x"
                      class="h-8 w-8 text-muted-foreground"
                    />
                  </div>
                  <p class="text-muted-foreground mt-2">
                    No groups found for this student
                  </p>
                  <Button
                    variant="link"
                    @click="loadStudentGroups"
                    class="mt-2"
                  >
                    Refresh data
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow v-for="group in enrichedGroupData" :key="group.id">
                <TableCell class="font-medium">
                  {{ group.groupName || "Unknown Group" }}
                </TableCell>
                <TableCell>
                  <Badge :variant="getStatusVariant(group.status)">
                    {{ capitalizeFirstLetter(group.status) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  {{ group.levelName || "Unknown Level" }}
                </TableCell>
                <TableCell>
                  {{ formatDate(group.enrolled_at) }}
                </TableCell>
                <TableCell>
                  {{ group.teacherName || "Unknown Teacher" }}
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      @click="navigateTo(`/groups/${group.group_id}`)"
                    >
                      <Icon name="lucide:eye" class="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon">
                          <Icon name="lucide:more-vertical" class="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          @click="
                            navigateTo(`/groups/${group.group_id}/students`)
                          "
                        >
                          <Icon name="lucide:users" class="mr-2 h-4 w-4" />
                          View Classmates
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="changeGroupStatus(group)">
                          <Icon name="lucide:edit-3" class="mr-2 h-4 w-4" />
                          Change Status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          @click="confirmUnenroll(group)"
                          class="text-destructive focus:text-destructive"
                        >
                          <Icon name="lucide:user-minus" class="mr-2 h-4 w-4" />
                          Unenroll from Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <!-- Status Change Dialog -->
    <Dialog v-model:open="statusDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Enrollment Status</DialogTitle>
          <DialogDescription>
            Update the student's status in this group
          </DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <Label for="status-select">Select Status</Label>
          <Select v-model="newStatus" class="w-full mt-1">
            <SelectTrigger id="status-select">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="removed">Removed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="frozen">Frozen</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="statusDialog = false">
            Cancel
          </Button>
          <Button @click="updateEnrollmentStatus" :disabled="isUpdating">
            <Icon
              v-if="isUpdating"
              name="lucide:loader-2"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ isUpdating ? "Updating..." : "Update Status" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Confirmation Dialog for Unenroll -->
    <AlertDialog v-model:open="confirmDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will unenroll the student from this group. All attendance and
            progress data will remain, but the student will no longer be
            considered a member of the group.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            @click="unenrollStudent"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Icon
              v-if="isDeleting"
              name="lucide:loader-2"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ isDeleting ? "Unenrolling..." : "Unenroll" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const { apiService } = useAuth();
const { toast } = useToast();
const route = useRoute();

// Student ID from route params
const studentId = computed(() => route.params.studentId as string);

// Data
const student = ref<any>(null);
const studentGroups = ref<any[]>([]);
const groups = ref<Record<string, any>>({});
const levels = ref<Record<string, any>>({});
const teachers = ref<Record<string, any>>({});

// UI states
const isLoading = ref(true);
const isUpdating = ref(false);
const isDeleting = ref(false);
const statusDialog = ref(false);
const confirmDialog = ref(false);
const selectedGroup = ref<any>(null);
const newStatus = ref("");

// Computed properties
const studentName = computed(() => {
  if (!student.value) return "";
  return `${student.value.first_name} ${student.value.last_name}`;
});

const enrichedGroupData = computed(() => {
  return studentGroups.value.map((group) => {
    const groupData = groups.value[group.group_id] || {};
    const levelData = levels.value[groupData.level_id] || {};
    const teacherData = teachers.value[groupData.teacher_id] || {};

    return {
      ...group,
      groupName: groupData.name,
      levelName: levelData.title,
      teacherName:
        teacherData.first_name && teacherData.last_name
          ? `${teacherData.first_name} ${teacherData.last_name}`
          : "Unassigned",
    };
  });
});

// Methods
const loadStudentGroups = async () => {
  isLoading.value = true;
  try {
    // Load student's groups
    const response = await api.get<any[]>(
      apiService.value,
      `/group-students/student/${studentId.value}`
    );

    studentGroups.value = Array.isArray(response) ? response : [];

    // Load student info
    await loadStudentInfo();

    // Load related data
    if (studentGroups.value.length > 0) {
      await Promise.all([
        loadGroupsInfo(),
        loadLevelsInfo(),
        loadTeachersInfo(),
      ]);
    }
  } catch (error) {
    console.error("Failed to load student groups:", error);
    toast({
      title: "Error",
      description: "Failed to load student groups. Please try again.",
      variant: "destructive",
    });
    studentGroups.value = [];
  } finally {
    isLoading.value = false;
  }
};

const loadStudentInfo = async () => {
  try {
    const response = await api.get<any>(
      apiService.value,
      `/users/students/${studentId.value}`
    );

    if (response && typeof response === "object") {
      student.value = response;
    }
  } catch (error) {
    console.error("Failed to load student information:", error);
    toast({
      title: "Warning",
      description: "Could not load student information",
      variant: "destructive",
    });
  }
};

const loadGroupsInfo = async () => {
  try {
    // Extract group IDs from enrollments
    const groupIds = [...new Set(studentGroups.value.map((sg) => sg.group_id))];

    // Create a map of group IDs to group data
    const groupsMap: Record<string, any> = {};

    // Fetch each group in parallel
    await Promise.all(
      groupIds.map(async (groupId) => {
        try {
          const groupData = await api.get<any>(
            apiService.value,
            `/groups/${groupId}`
          );

          if (groupData && typeof groupData === "object") {
            groupsMap[groupId] = groupData;
          }
        } catch (err) {
          console.error(`Failed to load group ${groupId}:`, err);
        }
      })
    );

    groups.value = groupsMap;
  } catch (error) {
    console.error("Failed to load groups information:", error);
  }
};

const loadLevelsInfo = async () => {
  try {
    const response = await api.get<any[]>(apiService.value, `/courses`);

    if (Array.isArray(response)) {
      const levelsMap: Record<string, any> = {};
      response.forEach((level) => {
        if (level && level.id) {
          levelsMap[level.id] = level;
        }
      });
      levels.value = levelsMap;
    }
  } catch (error) {
    console.error("Failed to load levels information:", error);
  }
};

const loadTeachersInfo = async () => {
  try {
    const response = await api.get<any[]>(apiService.value, `/users/teachers`);

    if (Array.isArray(response)) {
      const teachersMap: Record<string, any> = {};
      response.forEach((teacher) => {
        if (teacher && teacher.user_id) {
          teachersMap[teacher.user_id] = teacher;
        }
      });
      teachers.value = teachersMap;
    }
  } catch (error) {
    console.error("Failed to load teachers information:", error);
  }
};

const changeGroupStatus = (group: any) => {
  selectedGroup.value = group;
  newStatus.value = group.status;
  statusDialog.value = true;
};

const updateEnrollmentStatus = async () => {
  if (!selectedGroup.value) return;

  isUpdating.value = true;
  try {
    const response = await api.patch<any>(
      apiService.value,
      `/group-students/${selectedGroup.value.id}`,
      { status: newStatus.value }
    );

    // Update status in the local data
    const index = studentGroups.value.findIndex(
      (g) => g.id === selectedGroup.value.id
    );
    if (index !== -1 && response) {
      studentGroups.value[index] = response;
    }

    toast({
      title: "Success",
      description: "Enrollment status updated successfully",
    });

    statusDialog.value = false;
  } catch (error) {
    console.error("Failed to update enrollment status:", error);
    toast({
      title: "Error",
      description: "Failed to update status. Please try again.",
      variant: "destructive",
    });
  } finally {
    isUpdating.value = false;
  }
};

const confirmUnenroll = (group: any) => {
  selectedGroup.value = group;
  confirmDialog.value = true;
};

const unenrollStudent = async () => {
  if (!selectedGroup.value) return;

  isDeleting.value = true;
  try {
    await api.delete<void>(
      apiService.value,
      `/group-students/${selectedGroup.value.id}`
    );

    // Remove from local data
    studentGroups.value = studentGroups.value.filter(
      (g) => g.id !== selectedGroup.value.id
    );

    toast({
      title: "Success",
      description: "Student unenrolled successfully",
    });

    confirmDialog.value = false;
  } catch (error) {
    console.error("Failed to unenroll student:", error);
    toast({
      title: "Error",
      description: "Failed to unenroll student. Please try again.",
      variant: "destructive",
    });
  } finally {
    isDeleting.value = false;
  }
};

// Helper functions
const getInitials = (firstName?: string, lastName?: string): string => {
  if (!firstName || !lastName) return "??";
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

const capitalizeFirstLetter = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const getStatusVariant = (status: string): string => {
  switch (status?.toLowerCase()) {
    case "active":
      return "success";
    case "removed":
      return "destructive";
    case "completed":
      return "default";
    case "frozen":
      return "secondary";
    default:
      return "outline";
  }
};

// Load data on component mount
onMounted(async () => {
  await loadStudentGroups();
});
</script>
