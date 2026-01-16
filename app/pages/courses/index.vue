<template>
  <div>
    <!-- Page header section -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold">Courses</h1>
        <p class="text-muted-foreground">
          Manage and organize language courses and levels
        </p>
      </div>
      <Button @click="openNewCourseDialog">
        <Icon name="lucide:plus" class="h-4 w-4 mr-2" />
        Add New Course
      </Button>
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
      <p class="text-lg text-muted-foreground">Loading courses...</p>
    </div>

    <!-- Error state -->
    <Alert v-else-if="error" variant="destructive" class="mb-6">
      <AlertTitle>Error loading courses</AlertTitle>
      <AlertDescription>
        {{ error }}
        <Button variant="link" class="p-0 h-auto" @click="loadCourses">
          Try again
        </Button>
      </AlertDescription>
    </Alert>

    <!-- Empty state -->
    <div v-else-if="!courses.length" class="border rounded-lg p-12 text-center">
      <div class="flex justify-center mb-4">
        <Icon name="lucide:book-x" class="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 class="text-xl font-semibold mb-2">No courses found</h3>
      <p class="text-muted-foreground mb-6 max-w-md mx-auto">
        You haven't created any courses yet. Get started by adding your first
        course to organize your language programs.
      </p>
      <Button @click="openNewCourseDialog">
        <Icon name="lucide:plus" class="h-4 w-4 mr-2" />
        Add Your First Course
      </Button>
    </div>

    <!-- Courses table -->
    <div v-else>
      <Card>
        <CardContent class="p-0">
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead class="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="course in courses" :key="course.id">
                  <TableCell class="font-medium">
                    <div class="flex items-center">
                      <Icon
                        name="lucide:book"
                        class="h-4 w-4 mr-2 text-primary"
                      />
                      {{ course.title }}
                    </div>
                  </TableCell>
                  <TableCell>{{ course.level }}</TableCell>
                  <TableCell>
                    <Badge :variant="course.isActive ? 'default' : 'outline'">
                      {{ course.isActive ? "Active" : "Inactive" }}
                    </Badge>
                  </TableCell>
                  <TableCell>{{ formatDate(course.createdAt) }}</TableCell>
                  <TableCell>{{ formatDate(course.updatedAt) }}</TableCell>
                  <TableCell class="text-right">
                    <div class="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        @click="viewCourseDetails(course)"
                        title="View groups in this level"
                      >
                        <Icon name="lucide:users" class="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        @click="editCourse(course)"
                        title="Edit course"
                      >
                        <Icon name="lucide:pencil" class="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                          <Button variant="ghost" size="icon">
                            <Icon name="lucide:more-vertical" class="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem @click="toggleCourseStatus(course)">
                            <Icon
                              :name="
                                course.isActive
                                  ? 'lucide:eye-off'
                                  : 'lucide:eye'
                              "
                              class="h-4 w-4 mr-2"
                            />
                            {{ course.isActive ? "Deactivate" : "Activate" }}
                            Course
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            @click="confirmDeleteCourse(course)"
                            class="text-destructive"
                          >
                            <Icon name="lucide:trash-2" class="h-4 w-4 mr-2" />
                            Delete Course
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

    <!-- Create/Edit Course Dialog -->
    <Dialog v-model:open="courseDialog">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{{
            isEditing ? "Edit Course" : "Create New Course"
          }}</DialogTitle>
          <DialogDescription>
            {{
              isEditing
                ? "Update the course details below."
                : "Add a new language course to your curriculum."
            }}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="title">Course Title</Label>
            <Input
              id="title"
              v-model="formData.title"
              placeholder="e.g. Elementary (A2)"
            />
          </div>
          <div class="grid gap-2">
            <Label for="level">Level</Label>
            <Input
              id="level"
              v-model="formData.level"
              placeholder="e.g. A2, B1, B2"
            />
          </div>
          <div class="grid gap-2">
            <Label for="description">Description (optional)</Label>
            <Textarea
              id="description"
              v-model="formData.description"
              placeholder="Enter course description"
              rows="3"
            />
          </div>
          <div class="flex items-center space-x-2">
            <Checkbox id="isActive" v-model="formData.isActive" />
            <Label for="isActive">Course is active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="courseDialog = false">
            Cancel
          </Button>
          <Button type="submit" @click="saveCourse" :disabled="isSaving">
            <Icon
              v-if="isSaving"
              name="lucide:loader-2"
              class="h-4 w-4 mr-2 animate-spin"
            />
            {{ isEditing ? "Update Course" : "Create Course" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <AlertDialog v-model:open="deleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently delete the course
            <span class="font-semibold">{{ selectedCourse?.title }}</span
            >. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            @click="deleteCourse"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Icon
              v-if="isDeleting"
              name="lucide:loader-2"
              class="h-4 w-4 mr-2 animate-spin"
            />
            {{ isDeleting ? "Deleting..." : "Delete Course" }}
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

// API and auth setup
const { apiService } = useAuth();
const { toast } = useToast();

// State variables
const courses = ref<Course[]>([]);
const isLoading = ref(true);
const error = ref("");
const courseDialog = ref(false);
const deleteDialog = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const selectedCourse = ref<Course | null>(null);
const formData = ref({
  id: "",
  title: "",
  level: "",
  description: "",
  isActive: true,
});

// Load courses on component mount
onMounted(async () => {
  await loadCourses();
});

// Fetch courses from API
const loadCourses = async () => {
  isLoading.value = true;
  error.value = "";

  try {
    const response = await api.get<Course[]>(apiService.value, "/courses");

    // Store courses and exclude units array
    courses.value = response.map((course) => {
      // Create a new object without the units property
      const { units, ...courseWithoutUnits } = course;
      return courseWithoutUnits;
    });
  } catch (err) {
    console.error("Error loading courses:", err);
    error.value = "Failed to load courses. Please try again.";
  } finally {
    isLoading.value = false;
  }
};

// Format date for display
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Dialog functions
const openNewCourseDialog = () => {
  isEditing.value = false;
  formData.value = {
    id: "",
    title: "",
    level: "",
    description: "",
    isActive: true,
  };
  courseDialog.value = true;
};

const editCourse = (course: Course) => {
  isEditing.value = true;
  selectedCourse.value = course;
  formData.value = {
    id: course.id,
    title: course.title,
    level: course.level,
    description: course.description || "",
    isActive: course.isActive,
  };
  courseDialog.value = true;
};

const viewCourseDetails = (course: Course) => {
  navigateTo(`/courses/${course.id}`);
};

const confirmDeleteCourse = (course: Course) => {
  selectedCourse.value = course;
  deleteDialog.value = true;
};

// API actions
const saveCourse = async () => {
  if (!formData.value.title || !formData.value.level) {
    toast({
      title: "Validation Error",
      description: "Title and level are required fields.",
      variant: "destructive",
    });
    return;
  }

  isSaving.value = true;

  try {
    let response;

    if (isEditing.value) {
      // Update existing course
      response = await api.patch<Course>(
        apiService.value,
        `/courses/${formData.value.id}`,
        formData.value
      );

      // Update the course in the local array
      const index = courses.value.findIndex((c) => c.id === formData.value.id);
      if (index !== -1) {
        courses.value[index] = { ...response };
      }

      toast({
        title: "Success",
        description: "Course updated successfully.",
      });
    } else {
      // Create new course
      response = await api.post<Course>(
        apiService.value,
        "/courses",
        formData.value
      );

      // Add the new course to the local array
      courses.value.push({ ...response });

      toast({
        title: "Success",
        description: "New course created successfully.",
      });
    }

    courseDialog.value = false;
  } catch (err) {
    console.error("Error saving course:", err);
    toast({
      title: "Error",
      description: isEditing.value
        ? "Failed to update course. Please try again."
        : "Failed to create course. Please try again.",
      variant: "destructive",
    });
  } finally {
    isSaving.value = false;
  }
};

const toggleCourseStatus = async (course: Course) => {
  try {
    const updatedCourse = await api.patch<Course>(
      apiService.value,
      `/courses/${course.id}`,
      { isActive: !course.isActive }
    );

    // Update the course in the local array
    const index = courses.value.findIndex((c) => c.id === course.id);
    if (index !== -1 && updatedCourse) {
      courses.value[index].isActive = updatedCourse.isActive;
    }

    toast({
      title: "Success",
      description: updatedCourse.isActive
        ? "Course activated successfully."
        : "Course deactivated successfully.",
    });
  } catch (err) {
    console.error("Error toggling course status:", err);
    toast({
      title: "Error",
      description: "Failed to update course status. Please try again.",
      variant: "destructive",
    });
  }
};

const deleteCourse = async () => {
  if (!selectedCourse.value) return;

  isDeleting.value = true;

  try {
    await api.delete(apiService.value, `/courses/${selectedCourse.value.id}`);

    // Remove the course from the local array
    courses.value = courses.value.filter(
      (c) => c.id !== selectedCourse.value?.id
    );

    toast({
      title: "Success",
      description: "Course deleted successfully.",
    });

    deleteDialog.value = false;
  } catch (err) {
    console.error("Error deleting course:", err);
    toast({
      title: "Error",
      description: "Failed to delete course. Please try again.",
      variant: "destructive",
    });
  } finally {
    isDeleting.value = false;
  }
};
</script>
