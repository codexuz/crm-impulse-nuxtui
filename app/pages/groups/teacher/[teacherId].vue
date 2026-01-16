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
        <p class="text-xl font-medium">Loading teacher's groups...</p>
      </div>
    </div>

    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">
          {{ teacherName ? `${teacherName}'s Groups` : "Teacher's Groups" }}
        </h2>
        <p class="text-muted-foreground">
          View and manage groups assigned to this teacher
        </p>
      </div>
      <Button variant="outline" @click="navigateTo('/groups')">
        <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
        Back to All Groups
      </Button>
    </div>

    <!-- Teacher Info Card -->
    <div v-if="teacherInfo" class="mb-6 p-6 border rounded-lg shadow-sm">
      <div class="flex items-center gap-4">
        <Avatar class="h-16 w-16">
          <AvatarImage
            v-if="teacherInfo.avatar_url"
            :src="teacherInfo.avatar_url"
            alt="Teacher avatar"
          />
          <AvatarFallback>
            {{ getInitials(teacherInfo.first_name, teacherInfo.last_name) }}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 class="text-xl font-semibold">
            {{ teacherInfo.first_name }} {{ teacherInfo.last_name }}
          </h3>
          <p class="text-muted-foreground">{{ teacherInfo.phone }}</p>
          <Badge v-if="teacherInfo.is_active" variant="success" class="mt-1"
            >Active</Badge
          >
          <Badge v-else variant="destructive" class="mt-1">Inactive</Badge>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <Input
        v-model="search"
        placeholder="Search groups by name..."
        class="sm:max-w-xs"
      />
    </div>

    <!-- Groups Table -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Group Name</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="isLoading">
            <TableCell colspan="5" class="text-center py-10">
              <div class="flex justify-center">
                <Icon
                  name="lucide:loader-2"
                  class="h-8 w-8 animate-spin text-primary"
                />
              </div>
              <p class="text-muted-foreground mt-2">Loading groups...</p>
            </TableCell>
          </TableRow>
          <TableRow v-else-if="filteredGroups.length === 0">
            <TableCell colspan="5" class="text-center py-10">
              <div class="flex justify-center">
                <Icon
                  name="lucide:users-x"
                  class="h-8 w-8 text-muted-foreground"
                />
              </div>
              <p class="text-muted-foreground mt-2">
                No groups found for this teacher
              </p>
              <Button variant="link" @click="loadTeacherGroups" class="mt-2">
                Refresh data
              </Button>
            </TableCell>
          </TableRow>
          <TableRow v-for="group in filteredGroups" :key="group.id">
            <TableCell class="font-medium">{{ group.name }}</TableCell>
            <TableCell>{{ getLevelName(group.level_id) }}</TableCell>
            <TableCell>{{ formatDate(group.createdAt) }}</TableCell>
            <TableCell>{{ formatDate(group.updatedAt) }}</TableCell>
            <TableCell>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  @click="() => navigateTo(`/groups/${group.id}`)"
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
                      @click="() => navigateTo(`/groups/${group.id}/students`)"
                    >
                      <Icon name="lucide:users" class="mr-2 h-4 w-4" />
                      Manage Students
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @click="() => navigateTo(`/groups/${group.id}`)"
                    >
                      <Icon name="lucide:clipboard-list" class="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Group, Teacher } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const { apiService } = useAuth();
const { toast } = useToast();
const route = useRoute();

// Teacher ID from route params
const teacherId = computed(() => route.params.teacherId as string);

// Data
const groups = ref<Group[]>([]);
const teacherInfo = ref<Teacher | null>(null);
const isLoading = ref(true);
const search = ref("");
const levels = ref<{ id: string; title: string }[]>([]);

// Computed properties
const teacherName = computed(() => {
  if (!teacherInfo.value) return "";
  return `${teacherInfo.value.first_name} ${teacherInfo.value.last_name}`;
});

const filteredGroups = computed(() => {
  if (!groups.value) return [];

  let result = [...groups.value];

  // Apply search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    result = result.filter((group) =>
      group.name.toLowerCase().includes(searchLower)
    );
  }

  return result;
});

// Methods
const loadTeacherGroups = async () => {
  isLoading.value = true;
  try {
    const response = await api.get<Group[]>(
      apiService.value,
      `/groups/teacher/${teacherId.value}`
    );

    groups.value = response;

    // Extract teacher info from the first group if available
    if (response.length > 0 && response[0].teacher) {
      teacherInfo.value = response[0].teacher as Teacher;
    } else {
      // Fetch teacher info separately if not included in groups response
      await loadTeacherInfo();
    }

    // Load levels for level name display
    await loadLevels();
  } catch (error) {
    console.error("Failed to load teacher's groups:", error);
    toast({
      title: "Error",
      description: "Failed to load teacher's groups. Please try again.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const loadTeacherInfo = async () => {
  try {
    const response = await api.get<Teacher>(
      apiService.value,
      `/users/teachers/${teacherId.value}`
    );
    teacherInfo.value = response;
  } catch (error) {
    console.error("Failed to load teacher information:", error);
  }
};

const loadLevels = async () => {
  try {
    const response = await api.get<any[]>(apiService.value, `/levels`);
    levels.value = response;
  } catch (error) {
    console.error("Failed to load levels:", error);
  }
};

// Helper functions
const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

const getLevelName = (levelId: string): string => {
  const level = levels.value.find((l) => l.id === levelId);
  return level ? level.title : "Unknown Level";
};

// Load data on component mount
onMounted(async () => {
  await loadTeacherGroups();
});
</script>
