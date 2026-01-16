<template>
  <div>
    <!-- Page header with back button -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" @click="navigateTo('/courses')">
            <Icon name="lucide:arrow-left" class="h-4 w-4 mr-1" />
            Back to Courses
          </Button>
        </div>
        <h1 class="text-3xl font-bold mt-2">
          {{ course?.title || "Course Details" }}
        </h1>
        <div class="flex items-center mt-1">
          <Badge class="mr-2">{{ course?.level || "N/A" }}</Badge>
          <Badge :variant="course?.isActive ? 'default' : 'outline'">
            {{ course?.isActive ? "Active" : "Inactive" }}
          </Badge>
        </div>
        <p class="text-muted-foreground mt-2">
          {{ course?.description || "No description available" }}
        </p>
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-20"
    >
      <Icon
        name="lucide:loader-2"
        class="h-12 w-12 animate-spin text-primary mb-4"
      />
      <p class="text-lg text-muted-foreground">Loading course details...</p>
    </div>

    <!-- Error state -->
    <Alert v-else-if="error" variant="destructive" class="mb-6">
      <AlertTitle>Error loading course details</AlertTitle>
      <AlertDescription>
        {{ error }}
        <Button variant="link" class="p-0 h-auto" @click="loadCourseDetails">
          Try again
        </Button>
      </AlertDescription>
    </Alert>

    <!-- Course not found -->
    <Alert v-else-if="!course" variant="destructive" class="mb-6">
      <AlertTitle>Course not found</AlertTitle>
      <AlertDescription>
        The requested course could not be found.
        <Button
          variant="link"
          class="p-0 h-auto"
          @click="navigateTo('/courses')"
        >
          Return to Courses
        </Button>
      </AlertDescription>
    </Alert>

    <!-- Groups in this course's level -->
    <div v-else>
      <Card>
        <CardHeader>
          <CardTitle
            >Groups in {{ course.title }} (Level {{ course.level }})</CardTitle
          >
          <CardDescription>
            All active and inactive groups associated with this course level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <!-- Loading state for groups -->
          <div v-if="isLoadingGroups" class="py-8 text-center">
            <Icon
              name="lucide:loader-2"
              class="h-8 w-8 animate-spin text-primary mx-auto mb-2"
            />
            <p class="text-muted-foreground">Loading groups...</p>
          </div>

          <!-- Empty state for groups -->
          <div
            v-else-if="!groups.length"
            class="py-12 text-center border rounded-md"
          >
            <Icon
              name="lucide:users-x"
              class="h-10 w-10 text-muted-foreground mx-auto mb-4"
            />
            <h3 class="text-xl font-semibold mb-2">No groups found</h3>
            <p class="text-muted-foreground mb-6 max-w-md mx-auto">
              There are no groups currently using this course level.
            </p>
            <Button @click="openNewGroupDialog">
              <Icon name="lucide:plus" class="h-4 w-4 mr-2" />
              Create First Group
            </Button>
          </div>

          <!-- Groups table -->
          <div v-else class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead class="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="group in groups" :key="group.id">
                  <TableCell class="font-medium">
                    <div class="flex items-center">
                      <Icon
                        name="lucide:users"
                        class="h-4 w-4 mr-2 text-primary"
                      />
                      {{ group.name || "Unnamed Group" }}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div class="flex items-center">
                      <Avatar class="h-6 w-6 mr-2">
                        <AvatarFallback>{{
                          getTeacherInitials(group)
                        }}</AvatarFallback>
                      </Avatar>
                      {{ getTeacherName(group) }}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge :variant="group.isActive ? 'default' : 'outline'">
                      {{ group.isActive ? "Active" : "Inactive" }}
                    </Badge>
                  </TableCell>
                  <TableCell>{{ group.studentCount || 0 }}</TableCell>
                  <TableCell>{{ formatDate(group.startDate) }}</TableCell>
                  <TableCell class="text-right">
                    <div class="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        @click="navigateTo(`/groups/${group.id}`)"
                        title="View group details"
                      >
                        <Icon name="lucide:eye" class="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        @click="navigateTo(`/groups/${group.id}/students`)"
                        title="Manage students"
                      >
                        <Icon name="lucide:users" class="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                          <Button variant="ghost" size="icon">
                            <Icon name="lucide:more-vertical" class="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem @click="editGroup(group)">
                            <Icon name="lucide:pencil" class="h-4 w-4 mr-2" />
                            Edit Group
                          </DropdownMenuItem>
                          <DropdownMenuItem @click="toggleGroupStatus(group)">
                            <Icon
                              :name="
                                group.isActive ? 'lucide:eye-off' : 'lucide:eye'
                              "
                              class="h-4 w-4 mr-2"
                            />
                            {{ group.isActive ? "Deactivate" : "Activate" }}
                            Group
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            @click="confirmDeleteGroup(group)"
                            class="text-destructive"
                          >
                            <Icon name="lucide:trash-2" class="h-4 w-4 mr-2" />
                            Delete Group
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
    </div>

    <!-- Create/Edit Group Dialog (Placeholder) -->
    <Dialog v-model:open="groupDialog">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{
            isEditingGroup ? "Edit Group" : "Create New Group"
          }}</DialogTitle>
          <DialogDescription>
            {{
              isEditingGroup
                ? "Update the group details below."
                : "Create a new group for this course level."
            }}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="name">Group Name</Label>
            <Input
              id="name"
              v-model="groupFormData.name"
              placeholder="e.g. Monday 18:00"
            />
          </div>
          <div class="grid gap-2">
            <Label for="teacher">Teacher</Label>
            <Select v-model="groupFormData.teacherId">
              <SelectTrigger id="teacher">
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="teacher in teachers"
                  :key="teacher.id"
                  :value="teacher.id"
                >
                  {{ teacher.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-2">
            <Label for="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              v-model="groupFormData.startDate"
            />
          </div>
          <div class="flex items-center space-x-2">
            <Checkbox id="isActive" v-model="groupFormData.isActive" />
            <Label for="isActive">Group is active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="groupDialog = false">
            Cancel
          </Button>
          <Button type="submit" @click="saveGroup" :disabled="isSavingGroup">
            <Icon
              v-if="isSavingGroup"
              name="lucide:loader-2"
              class="h-4 w-4 mr-2 animate-spin"
            />
            {{ isEditingGroup ? "Update Group" : "Create Group" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Group Confirmation Dialog -->
    <AlertDialog v-model:open="deleteGroupDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently delete the group
            <span class="font-semibold">{{ selectedGroup?.name }}</span
            >. All student enrollment data will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            @click="deleteGroup"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Icon
              v-if="isDeletingGroup"
              name="lucide:loader-2"
              class="h-4 w-4 mr-2 animate-spin"
            />
            {{ isDeletingGroup ? "Deleting..." : "Delete Group" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Group {
  id: string;
  name: string;
  isActive: boolean;
  level_id: string;
  teacher_id: string;
  startDate: string;
  studentCount?: number;
  teacherFirstName?: string;
  teacherLastName?: string;
}

interface Teacher {
  id: string;
  name: string;
}

// Route and API setup
const route = useRoute();
const courseId = computed(() => route.params.id as string);
const { apiService } = useAuth();
const { toast } = useToast();

// State variables for course
const course = ref<Course | null>(null);
const isLoading = ref(true);
const error = ref("");

// State variables for groups
const groups = ref<Group[]>([]);
const isLoadingGroups = ref(true);
const groupsError = ref("");

// State variables for teachers (for the group form)
const teachers = ref<Teacher[]>([
  { id: "1", name: "John Doe" },
  { id: "2", name: "Jane Smith" },
]);

// Dialog and form state
const groupDialog = ref(false);
const deleteGroupDialog = ref(false);
const isEditingGroup = ref(false);
const isSavingGroup = ref(false);
const isDeletingGroup = ref(false);
const selectedGroup = ref<Group | null>(null);
const groupFormData = ref({
  id: "",
  name: "",
  teacherId: "",
  startDate: "",
  isActive: true,
});

// Load data on component mount
onMounted(async () => {
  await loadCourseDetails();
});

// Load course details
const loadCourseDetails = async () => {
  isLoading.value = true;
  error.value = "";

  try {
    const response = await api.get<Course>(
      apiService.value,
      `/courses/${courseId.value}`
    );

    if (response) {
      // Store course data without units
      const { units, ...courseWithoutUnits } = response;
      course.value = courseWithoutUnits;

      // Load groups for this level
      await loadGroups();
    } else {
      error.value = "Course not found";
    }
  } catch (err) {
    console.error("Error loading course details:", err);
    error.value = "Failed to load course details. Please try again.";
  } finally {
    isLoading.value = false;
  }
};

// Load groups for this course's level
const loadGroups = async () => {
  if (!course.value) return;

  isLoadingGroups.value = true;
  groupsError.value = "";

  try {
    const response = await api.get<Group[]>(
      apiService.value,
      `/groups/level/${course.value.id}`
    );

    groups.value = Array.isArray(response) ? response : [];

    // Optionally load additional group data like student counts
    // await loadGroupDetails();
  } catch (err) {
    console.error("Error loading groups:", err);
    groupsError.value = "Failed to load groups for this level.";
    groups.value = [];
  } finally {
    isLoadingGroups.value = false;
  }
};

// Format date for display
const formatDate = (dateString?: string) => {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Get teacher initials
const getTeacherInitials = (group: Group) => {
  if (group.teacherFirstName && group.teacherLastName) {
    return `${group.teacherFirstName.charAt(0)}${group.teacherLastName.charAt(
      0
    )}`;
  }
  return "TN";
};

// Get teacher full name
const getTeacherName = (group: Group) => {
  if (group.teacherFirstName && group.teacherLastName) {
    return `${group.teacherFirstName} ${group.teacherLastName}`;
  }
  return "Unassigned";
};

// Dialog functions
const openNewGroupDialog = () => {
  isEditingGroup.value = false;
  groupFormData.value = {
    id: "",
    name: "",
    teacherId: "",
    startDate: new Date().toISOString().split("T")[0],
    isActive: true,
  };
  groupDialog.value = true;
};

const editGroup = (group: Group) => {
  isEditingGroup.value = true;
  selectedGroup.value = group;
  groupFormData.value = {
    id: group.id,
    name: group.name,
    teacherId: group.teacher_id,
    startDate: group.startDate || new Date().toISOString().split("T")[0],
    isActive: group.isActive,
  };
  groupDialog.value = true;
};

const confirmDeleteGroup = (group: Group) => {
  selectedGroup.value = group;
  deleteGroupDialog.value = true;
};

// API actions for groups
const saveGroup = async () => {
  if (!course.value || !groupFormData.value.name) {
    toast({
      title: "Validation Error",
      description: "Group name is required.",
      variant: "destructive",
    });
    return;
  }

  isSavingGroup.value = true;

  try {
    let response;

    if (isEditingGroup.value) {
      // Update existing group
      response = await api.patch<Group>(
        apiService.value,
        `/groups/${groupFormData.value.id}`,
        {
          name: groupFormData.value.name,
          teacher_id: groupFormData.value.teacherId,
          startDate: groupFormData.value.startDate,
          isActive: groupFormData.value.isActive,
        }
      );

      // Update the group in the local array
      const index = groups.value.findIndex(
        (g) => g.id === groupFormData.value.id
      );
      if (index !== -1 && response) {
        groups.value[index] = { ...response };
      }

      toast({
        title: "Success",
        description: "Group updated successfully.",
      });
    } else {
      // Create new group
      response = await api.post<Group>(apiService.value, "/groups", {
        name: groupFormData.value.name,
        teacher_id: groupFormData.value.teacherId,
        level_id: course.value.id,
        startDate: groupFormData.value.startDate,
        isActive: groupFormData.value.isActive,
      });

      // Add the new group to the local array
      if (response) {
        groups.value.push(response);
      }

      toast({
        title: "Success",
        description: "New group created successfully.",
      });
    }

    groupDialog.value = false;
  } catch (err) {
    console.error("Error saving group:", err);
    toast({
      title: "Error",
      description: isEditingGroup.value
        ? "Failed to update group. Please try again."
        : "Failed to create group. Please try again.",
      variant: "destructive",
    });
  } finally {
    isSavingGroup.value = false;
  }
};

const toggleGroupStatus = async (group: Group) => {
  try {
    const updatedGroup = await api.patch<Group>(
      apiService.value,
      `/groups/${group.id}`,
      { isActive: !group.isActive }
    );

    // Update the group in the local array
    const index = groups.value.findIndex((g) => g.id === group.id);
    if (index !== -1 && updatedGroup) {
      groups.value[index].isActive = updatedGroup.isActive;
    }

    toast({
      title: "Success",
      description: updatedGroup.isActive
        ? "Group activated successfully."
        : "Group deactivated successfully.",
    });
  } catch (err) {
    console.error("Error toggling group status:", err);
    toast({
      title: "Error",
      description: "Failed to update group status. Please try again.",
      variant: "destructive",
    });
  }
};

const deleteGroup = async () => {
  if (!selectedGroup.value) return;

  isDeletingGroup.value = true;

  try {
    await api.delete(apiService.value, `/groups/${selectedGroup.value.id}`);

    // Remove the group from the local array
    groups.value = groups.value.filter((g) => g.id !== selectedGroup.value?.id);

    toast({
      title: "Success",
      description: "Group deleted successfully.",
    });

    deleteGroupDialog.value = false;
  } catch (err) {
    console.error("Error deleting group:", err);
    toast({
      title: "Error",
      description: "Failed to delete group. Please try again.",
      variant: "destructive",
    });
  } finally {
    isDeletingGroup.value = false;
  }
};
</script>
