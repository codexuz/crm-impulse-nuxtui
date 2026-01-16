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
        <p class="text-xl font-medium">Loading group details...</p>
      </div>
    </div>

    <!-- Back button and page header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" @click="navigateTo('/groups')">
            <Icon name="lucide:arrow-left" class="h-4 w-4 mr-1" />
            Back to Groups
          </Button>
          <Badge v-if="group" variant="outline" class="ml-2">
            ID: {{ group.id }}
          </Badge>
        </div>
        <h1 class="text-3xl font-bold mt-2">
          {{ group?.name || "Group Details" }}
        </h1>
      </div>
      <div class="flex gap-2">
        <Button
          variant="outline"
          @click="navigateTo(`/groups/${groupId}/students`)"
        >
          <Icon name="lucide:users" class="mr-2 h-4 w-4" />
          Manage Students
        </Button>
        <Dialog>
          <DialogTrigger as-child>
            <Button>
              <Icon name="lucide:pencil" class="mr-2 h-4 w-4" />
              Edit Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
              <DialogDescription>
                Make changes to the group information
              </DialogDescription>
            </DialogHeader>
            <form @submit.prevent="updateGroup" class="space-y-4 py-4">
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="name" class="text-right">Name</Label>
                <Input
                  id="name"
                  v-model="editForm.name"
                  class="col-span-3"
                  placeholder="Group name"
                />
              </div>
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="level" class="text-right">Level</Label>
                <Select v-model="editForm.level_id" class="col-span-3">
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="level in levels"
                      :key="level.id"
                      :value="level.id"
                    >
                      {{ level.title }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="grid grid-cols-4 items-center gap-4">
                <Label for="teacher" class="text-right">Teacher</Label>
                <Select v-model="editForm.teacher_id" class="col-span-3">
                  <SelectTrigger id="teacher">
                    <SelectValue placeholder="Assign teacher" />
                  </SelectTrigger>
                  <SelectContent>
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
              <DialogFooter>
                <Button type="submit" :disabled="isUpdating">
                  <Icon
                    v-if="isUpdating"
                    name="lucide:loader-2"
                    class="mr-2 h-4 w-4 animate-spin"
                  />
                  {{ isUpdating ? "Saving..." : "Save Changes" }}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

    <!-- Group details card -->
    <div class="grid gap-6 md:grid-cols-1 lg:grid-cols-1 mb-8">
      <!-- Basic Info -->
      <Card>
        <CardHeader>
          <CardTitle>Group Information</CardTitle>
          <CardDescription>Basic details about this group</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Name:</span>
              <span class="font-medium">{{ group?.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Level:</span>
              <span class="font-medium">{{
                getLevelName(group?.level_id)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Created:</span>
              <span class="font-medium">{{
                formatDate(group?.createdAt)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Last Updated:</span>
              <span class="font-medium">{{
                formatDate(group?.updatedAt)
              }}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Confirmation Dialog for Delete -->
    <AlertDialog v-model:open="confirmDelete">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the group
            and remove all associated student enrollments.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            @click="deleteGroup"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Icon
              v-if="isDeleting"
              name="lucide:loader-2"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ isDeleting ? "Deleting..." : "Delete" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import type { Group } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const { apiService } = useAuth();
const { toast } = useToast();
const route = useRoute();

// Group ID from route params
const groupId = computed(() => route.params.id as string);

// Data
const group = ref<Group | null>(null);
const levels = ref<{ id: string; title: string }[]>([]);
const teachers = ref<any[]>([]);

// UI states
const isLoading = ref(true);
const isUpdating = ref(false);
const isDeleting = ref(false);
const confirmDelete = ref(false);

// Edit form
const editForm = ref({
  name: "",
  teacher_id: "",
  level_id: "",
});

// Methods
const loadGroupDetails = async () => {
  isLoading.value = true;
  try {
    const response = await api.get<any>(
      apiService.value,
      `/groups/${groupId.value}`
    );

    if (!response || typeof response !== "object") {
      throw new Error("Invalid response format");
    }

    // Store basic group info
    group.value = {
      id: response.id,
      name: response.name || "Unnamed Group",
      teacher_id: response.teacher_id,
      level_id: response.level_id,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };

    // Set form values for editing
    editForm.value = {
      name: response.name || "",
      teacher_id: response.teacher_id || "",
      level_id: response.level_id || "",
    };

    try {
      // Load related data
      await Promise.all([loadLevels(), loadTeachers()]);
    } catch (innerError) {
      console.error("Error loading related data:", innerError);
      // Continue with partial data
    }
  } catch (error) {
    console.error("Failed to load group details:", error);
    toast({
      title: "Error",
      description: "Failed to load group details. Please try again.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const loadLevels = async () => {
  try {
    const response = await api.get<any[]>(apiService.value, `/courses`);
    levels.value = response;
  } catch (error) {
    console.error("Failed to load levels:", error);
  }
};

const loadTeachers = async () => {
  try {
    const response = await api.get<any[]>(apiService.value, `/users/teachers`);
    teachers.value = response.filter((t) => t.is_active);
  } catch (error) {
    console.error("Failed to load teachers:", error);
  }
};

const updateGroup = async () => {
  isUpdating.value = true;
  try {
    const response = await api.patch<Group>(
      apiService.value,
      `/groups/${groupId.value}`,
      editForm.value
    );

    // Update local group data
    group.value = response;

    toast({
      title: "Success",
      description: "Group information updated successfully",
    });
  } catch (error) {
    console.error("Failed to update group:", error);
    toast({
      title: "Error",
      description: "Failed to update group information. Please try again.",
      variant: "destructive",
    });
  } finally {
    isUpdating.value = false;
  }
};

const deleteGroup = async () => {
  isDeleting.value = true;
  try {
    await api.delete<void>(apiService.value, `/groups/${groupId.value}`);

    toast({
      title: "Success",
      description: "Group deleted successfully",
    });

    // Navigate back to groups list
    navigateTo("/groups");
  } catch (error) {
    console.error("Failed to delete group:", error);
    toast({
      title: "Error",
      description: "Failed to delete group. Please try again.",
      variant: "destructive",
    });
  } finally {
    isDeleting.value = false;
    confirmDelete.value = false;
  }
};

// Helper functions
const formatDate = (dateString?: string, includeTime = false): string => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);

  if (includeTime) {
    return date.toLocaleString();
  }

  return date.toLocaleDateString();
};

const getLevelName = (levelId?: string): string => {
  if (!levelId) return "N/A";

  const level = levels.value.find((l) => l.id === levelId);
  return level ? level.title : "Unknown Level";
};

// Load data on component mount
onMounted(async () => {
  await loadGroupDetails();
});
</script>
