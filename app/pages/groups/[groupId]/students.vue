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
        <p class="text-xl font-medium">Loading students...</p>
      </div>
    </div>

    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Group Students</h2>
        <p class="text-muted-foreground">
          Manage students enrolled in {{ groupName }}
        </p>
      </div>
      <div class="flex space-x-2">
        <Button variant="outline" @click="navigateTo(`/groups/${groupId}`)">
          <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
          Back to Group
        </Button>
        <Dialog
          v-model:open="addDialog"
          @update:open="(open: boolean) => !open && (studentSearch = '')"
        >
          <DialogTrigger as-child>
            <Button @click="studentSearch = ''">
              <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Student to Group</DialogTitle>
              <DialogDescription>
                Enroll a student in this group
              </DialogDescription>
            </DialogHeader>
            <form @submit.prevent="addStudentToGroup" class="py-4">
              <div class="grid gap-4">
                <div>
                  <Label for="student-select">Select Student</Label>
                  <div class="mb-2">
                    <Input
                      v-model="studentSearch"
                      placeholder="Search students..."
                      class="w-full"
                    />
                  </div>
                  <Select v-model="selectedStudentId" class="w-full mt-1">
                    <SelectTrigger id="student-select">
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="student in filteredStudentsForAdd"
                        :key="student.user_id"
                        :value="student.user_id"
                      >
                        {{ student.first_name }} {{ student.last_name }} ({{
                          student.phone
                        }})
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label for="enrollment-date">Enrollment Date</Label>
                  <Input
                    id="enrollment-date"
                    v-model="enrollmentDate"
                    type="date"
                    class="w-full mt-1"
                  />
                </div>
                <div>
                  <Label for="status-select">Initial Status</Label>
                  <Select v-model="initialStatus" class="w-full mt-1">
                    <SelectTrigger id="status-select">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="frozen">Frozen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter class="mt-6">
                <Button
                  variant="outline"
                  type="button"
                  @click="addDialog = false"
                >
                  Cancel
                </Button>
                <Button type="submit" :disabled="isAddingStudent">
                  <Icon
                    v-if="isAddingStudent"
                    name="lucide:loader-2"
                    class="mr-2 h-4 w-4 animate-spin"
                  />
                  {{ isAddingStudent ? "Adding..." : "Add to Group" }}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <Input
        v-model="search"
        placeholder="Search students..."
        class="sm:max-w-xs"
      />
      <Select v-model="statusFilter" class="sm:max-w-xs">
        <SelectTrigger>
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="removed">Removed</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="frozen">Frozen</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Students Table -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Enrolled At</TableHead>
            <TableHead>Created At</TableHead>
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
              <p class="text-muted-foreground mt-2">Loading students...</p>
            </TableCell>
          </TableRow>
          <TableRow v-else-if="filteredGroupStudents.length === 0">
            <TableCell colspan="5" class="text-center py-10">
              <div class="flex justify-center">
                <Icon
                  name="lucide:users-x"
                  class="h-8 w-8 text-muted-foreground"
                />
              </div>
              <p class="text-muted-foreground mt-2">
                No students found in this group
              </p>
              <Button variant="link" @click="loadGroupStudents" class="mt-2">
                Refresh data
              </Button>
            </TableCell>
          </TableRow>
          <TableRow
            v-for="groupStudent in filteredGroupStudents"
            :key="groupStudent.id"
          >
            <TableCell class="font-medium">
              <div class="flex items-center">
                <Avatar class="h-8 w-8 mr-2">
                  <AvatarFallback>{{
                    groupStudent.student
                      ? getInitials(
                          groupStudent.student.first_name,
                          groupStudent.student.last_name
                        )
                      : "??"
                  }}</AvatarFallback>
                </Avatar>
                {{
                  groupStudent.student
                    ? `${groupStudent.student.first_name} ${groupStudent.student.last_name}`
                    : "Unknown Student"
                }}
              </div>
            </TableCell>
            <TableCell>
              <Badge :variant="getStatusVariant(groupStudent.status)">
                {{ capitalizeFirstLetter(groupStudent.status) }}
              </Badge>
            </TableCell>
            <TableCell>{{ formatDate(groupStudent.enrolled_at) }}</TableCell>
            <TableCell>{{ formatDate(groupStudent.createdAt) }}</TableCell>
            <TableCell>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  @click="viewStudentDetails(groupStudent)"
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
                      @click="changeStudentStatus(groupStudent)"
                    >
                      <Icon name="lucide:edit-3" class="mr-2 h-4 w-4" />
                      Change Status
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      @click="confirmRemoveStudent(groupStudent)"
                      class="text-destructive focus:text-destructive"
                    >
                      <Icon name="lucide:user-minus" class="mr-2 h-4 w-4" />
                      Remove from Group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Status Change Dialog -->
    <Dialog v-model:open="statusDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Student Status</DialogTitle>
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
          <Button variant="outline" @click="statusDialog = false"
            >Cancel</Button
          >
          <Button @click="updateStudentStatus" :disabled="isUpdatingStatus">
            <Icon
              v-if="isUpdatingStatus"
              name="lucide:loader-2"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ isUpdatingStatus ? "Updating..." : "Update Status" }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Student Details Dialog -->
    <Dialog v-model:open="studentDetailsDialog">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
          <DialogDescription>
            Information about the selected student
          </DialogDescription>
        </DialogHeader>
        <div v-if="selectedStudent" class="py-4">
          <div class="flex items-center gap-4 mb-4">
            <Avatar class="h-16 w-16">
              <AvatarFallback class="text-lg">
                {{
                  getInitials(
                    selectedStudent.first_name,
                    selectedStudent.last_name
                  )
                }}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 class="text-lg font-semibold">
                {{ selectedStudent.first_name }} {{ selectedStudent.last_name }}
              </h3>
              <p class="text-muted-foreground">{{ selectedStudent.phone }}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="font-medium text-sm">Contact Information</h4>
              <div class="space-y-1 mt-2">
                <div class="flex">
                  <span class="text-muted-foreground w-20">Phone:</span>
                  <span>{{ selectedStudent.phone }}</span>
                </div>
                <div class="flex">
                  <span class="text-muted-foreground w-20">Username:</span>
                  <span>{{ selectedStudent.username }}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 class="font-medium text-sm">Group Information</h4>
              <div class="space-y-1 mt-2">
                <div class="flex">
                  <span class="text-muted-foreground w-20">Status:</span>
                  <Badge
                    :variant="getStatusVariant(selectedGroupStudent?.status)"
                  >
                    {{ capitalizeFirstLetter(selectedGroupStudent?.status) }}
                  </Badge>
                </div>
                <div class="flex">
                  <span class="text-muted-foreground w-20">Enrolled:</span>
                  <span>{{
                    formatDate(selectedGroupStudent?.enrolled_at)
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="studentDetailsDialog = false"
            >Close</Button
          >
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Confirmation Dialog -->
    <AlertDialog v-model:open="confirmDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the student from this group.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            @click="removeStudentFromGroup"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Icon
              v-if="isRemoving"
              name="lucide:loader-2"
              class="mr-2 h-4 w-4 animate-spin"
            />
            {{ isRemoving ? "Removing..." : "Remove" }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import type { GroupStudent, Student } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

// Extended GroupStudent interface with nested data
interface GroupStudentWithData extends GroupStudent {
  student?: {
    user_id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  group?: {
    id: string;
    name: string;
    teacher_id: string;
    level_id: string;
    teacher?: {
      user_id: string;
      username: string;
      first_name: string;
      last_name: string;
      avatar_url: string | null;
    };
  };
}

const { apiService } = useAuth();
const { toast } = useToast();
const route = useRoute();

// Route params
const groupId = computed(() => route.params.groupId as string);

// Data
const groupStudents = ref<GroupStudentWithData[]>([]);
const students = ref<Student[]>([]);
const isLoading = ref(true);
const groupName = ref("");
const search = ref("");
const studentSearch = ref(""); // For searching students in the add dialog
const statusFilter = ref("all");

// Add student dialog
const addDialog = ref(false);
const selectedStudentId = ref("");
const enrollmentDate = ref(new Date().toISOString().split("T")[0]); // Today's date
const initialStatus = ref("active");
const isAddingStudent = ref(false);

// Status change dialog
const statusDialog = ref(false);
const selectedGroupStudent = ref<GroupStudent | null>(null);
const newStatus = ref("");
const isUpdatingStatus = ref(false);

// Student details dialog
const studentDetailsDialog = ref(false);
const selectedStudent = ref<Student | null>(null);

// Remove student confirmation
const confirmDialog = ref(false);
const groupStudentToRemove = ref<GroupStudent | null>(null);
const isRemoving = ref(false);

// Computed properties
const filteredStudentsForAdd = computed(() => {
  if (!studentSearch.value) {
    return students.value;
  }

  const searchLower = studentSearch.value.toLowerCase();
  return students.value.filter(
    (student) =>
      student.first_name.toLowerCase().includes(searchLower) ||
      student.last_name.toLowerCase().includes(searchLower) ||
      `${student.first_name} ${student.last_name}`
        .toLowerCase()
        .includes(searchLower) ||
      student.phone?.includes(studentSearch.value) ||
      student.username?.toLowerCase().includes(searchLower)
  );
});

const filteredGroupStudents = computed(() => {
  let result = [...groupStudents.value];

  // Apply search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    result = result.filter((groupStudent) => {
      if (!groupStudent.student) return false;

      return (
        groupStudent.student.first_name.toLowerCase().includes(searchLower) ||
        groupStudent.student.last_name.toLowerCase().includes(searchLower) ||
        groupStudent.student.username?.toLowerCase().includes(searchLower) ||
        `${groupStudent.student.first_name} ${groupStudent.student.last_name}`
          .toLowerCase()
          .includes(searchLower)
      );
    });
  }

  // Apply status filter
  if (statusFilter.value !== "all") {
    result = result.filter(
      (groupStudent) => groupStudent.status === statusFilter.value
    );
  }

  return result;
});

// Methods
const loadGroupStudents = async () => {
  isLoading.value = true;
  try {
    // Load group students with nested student and group data
    const response = await api.get<GroupStudentWithData[]>(
      apiService.value,
      `/group-students/group/${groupId.value}`
    );
    groupStudents.value = response;

    // Get group name from first item if available
    if (response.length > 0 && response[0].group) {
      groupName.value = response[0].group.name;
    } else {
      // Fallback: Get group info separately
      await loadGroupInfo();
    }

    // Load all students for the add dialog
    await loadAllStudents();
  } catch (error) {
    console.error("Failed to load group students:", error);
    toast({
      title: "Xatolik",
      description:
        "Guruh talabalarini yuklashda xatolik. Iltimos, qayta urinib ko'ring.",
      variant: "destructive",
    });
  } finally {
    isLoading.value = false;
  }
};

const loadGroupInfo = async () => {
  try {
    const response = await api.get<any>(
      apiService.value,
      `/groups/${groupId.value}`
    );
    groupName.value = response.name;
  } catch (error) {
    console.error("Failed to load group info:", error);
    groupName.value = "this group";
  }
};

const loadAllStudents = async () => {
  try {
    // Fetch all students for dropdown - using high limit to get all
    const params = new URLSearchParams({
      page: "1",
      limit: "1000", // Get all students
    });

    const response = await api.get<{
      data: Student[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(apiService.value, `/users/students?${params.toString()}`);

    students.value = response.data || [];
  } catch (error) {
    console.error("Failed to load students:", error);
    toast({
      title: "Xatolik",
      description:
        "Talabalar ro'yxatini yuklashda xatolik. Ba'zi talaba nomlari to'g'ri ko'rsatilmasligi mumkin.",
      variant: "destructive",
    });
    students.value = [];
  }
};

const addStudentToGroup = async () => {
  if (!selectedStudentId.value) {
    toast({
      title: "Xatolik",
      description: "Iltimos, talabani tanlang",
      variant: "destructive",
    });
    return;
  }

  isAddingStudent.value = true;
  try {
    // Format the date to ISO format with time (2025-07-16T10:00:00Z)
    const formattedDate = new Date(
      `${enrollmentDate.value}T10:00:00Z`
    ).toISOString();

    const response = await api.post<GroupStudentWithData>(
      apiService.value,
      "/group-students",
      {
        group_id: groupId.value,
        student_id: selectedStudentId.value,
        enrolled_at: formattedDate,
        status: initialStatus.value,
      }
    );

    // Reload the list to get fresh data with nested relationships
    await loadGroupStudents();

    toast({
      title: "Muvaffaqiyat",
      description: "Talaba guruhga muvaffaqiyatli qo'shildi",
    });

    // Reset form and search
    selectedStudentId.value = "";
    studentSearch.value = "";
    enrollmentDate.value = new Date().toISOString().split("T")[0];
    initialStatus.value = "active";
    addDialog.value = false;
  } catch (error) {
    console.error("Failed to add student to group:", error);
    toast({
      title: "Xatolik",
      description:
        "Talabani guruhga qo'shishda xatolik. Iltimos, qayta urinib ko'ring.",
      variant: "destructive",
    });
  } finally {
    isAddingStudent.value = false;
  }
};

const changeStudentStatus = (groupStudent: GroupStudent) => {
  selectedGroupStudent.value = groupStudent;
  newStatus.value = groupStudent.status;
  statusDialog.value = true;
};

const updateStudentStatus = async () => {
  if (!selectedGroupStudent.value) return;

  isUpdatingStatus.value = true;
  try {
    const response = await api.patch<GroupStudentWithData>(
      apiService.value,
      `/group-students/${selectedGroupStudent.value.id}`,
      { status: newStatus.value }
    );

    // Reload the list to get fresh data
    await loadGroupStudents();

    toast({
      title: "Muvaffaqiyat",
      description: "Talaba holati muvaffaqiyatli yangilandi",
    });

    statusDialog.value = false;
  } catch (error) {
    console.error("Failed to update student status:", error);
    toast({
      title: "Xatolik",
      description:
        "Talaba holatini yangilashda xatolik. Iltimos, qayta urinib ko'ring.",
      variant: "destructive",
    });
  } finally {
    isUpdatingStatus.value = false;
  }
};

const viewStudentDetails = async (groupStudent: GroupStudentWithData) => {
  if (!groupStudent.student) {
    toast({
      title: "Xatolik",
      description: "Talaba ma'lumotlari topilmadi",
      variant: "destructive",
    });
    return;
  }

  // Convert the nested student to full Student type
  selectedStudent.value = {
    user_id: groupStudent.student.user_id,
    username: groupStudent.student.username,
    first_name: groupStudent.student.first_name,
    last_name: groupStudent.student.last_name,
    phone: "", // Not available in nested data
    roles: [],
    is_active: true,
  };

  selectedGroupStudent.value = groupStudent;
  studentDetailsDialog.value = true;
};

const confirmRemoveStudent = (groupStudent: GroupStudent) => {
  groupStudentToRemove.value = groupStudent;
  confirmDialog.value = true;
};

const removeStudentFromGroup = async () => {
  if (!groupStudentToRemove.value) return;

  isRemoving.value = true;
  try {
    // Use fetch directly for delete to handle 204 No Content
    const response = await fetch(
      `${apiService.value.baseUrl}/group-students/${groupStudentToRemove.value.id}`,
      {
        method: "DELETE",
        headers: apiService.value.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    // Reload the list to get fresh data
    await loadGroupStudents();

    toast({
      title: "Muvaffaqiyat",
      description: "Talaba guruhdan muvaffaqiyatli o'chirildi",
    });

    confirmDialog.value = false;
  } catch (error) {
    console.error("Failed to remove student from group:", error);
    toast({
      title: "Xatolik",
      description:
        "Talabani guruhdan o'chirishda xatolik. Iltimos, qayta urinib ko'ring.",
      variant: "destructive",
    });
  } finally {
    isRemoving.value = false;
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

const capitalizeFirstLetter = (str?: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const getStatusVariant = (status?: string): string => {
  if (!status) return "secondary";

  switch (status) {
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
  await loadGroupStudents();
});
</script>
