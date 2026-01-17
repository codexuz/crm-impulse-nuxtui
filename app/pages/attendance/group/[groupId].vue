<template>
  <UDashboardPanel id="group-attendance">
    <template #header>
      <UDashboardNavbar
        :title="`Guruh davomati - ${group.name || 'Yuklanmoqda...'}`"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            @click="navigateTo('/groups')"
          />
        </template>

        <template #description>
          {{ formatDate(selectedDate) }} uchun guruh talabalarining davomatini
          belgilang
        </template>

        <template #right>
          <UInput
            v-model="dateInputValue"
            type="date"
            icon="i-lucide-calendar"
            class="w-48"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div>
        <!-- Attendance Table -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold">
                Talabalar davomati - {{ formatDate(selectedDate) }}
              </h3>
              <div class="flex gap-2">
                <UButton
                  icon="i-lucide-refresh-cw"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  @click="fetchAttendanceData"
                  :disabled="isLoading || isSaving"
                  :loading="isLoading"
                >
                  Yangilash
                </UButton>
                <UButton
                  icon="i-lucide-save"
                  color="primary"
                  size="sm"
                  @click="saveAttendance"
                  :disabled="isLoading || isSaving || !hasChanges"
                  :loading="isSaving"
                >
                  Saqlash
                </UButton>
              </div>
            </div>
          </template>

          <UTable
            :data="groupStudents"
            :columns="columns"
            :loading="isLoading"
            :empty="'Bu guruhda talabalar topilmadi'"
          />
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { useAuth } from "~/composables/useAuth";
import { api } from "~/lib/api";

const UAvatar = resolveComponent("UAvatar");
const UBadge = resolveComponent("UBadge");
const USelectMenu = resolveComponent("USelectMenu");
const UInput = resolveComponent("UInput");

const route = useRoute();
const groupId = computed(() => route.params.groupId as string);
const { apiService } = useAuth();
const toast = useToast();

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

// Status options
const statusOptions = [
  { value: "present", label: "Keldi" },
  { value: "absent", label: "Kelmadi" },
];

// Table columns with render functions
const columns: TableColumn<any>[] = [
  {
    accessorKey: "index",
    header: "#",
    cell: ({ row }) => {
      const index = groupStudents.value.findIndex(
        (s) => s.student.user_id === row.original.student.user_id,
      );
      return h("span", { class: "font-medium" }, index + 1);
    },
  },
  {
    accessorKey: "student",
    header: "Talaba",
    cell: ({ row }) => {
      const student = row.original.student;
      return h("div", { class: "flex items-center gap-3" }, [
        h(
          UAvatar,
          {
            src: student.avatar_url,
            alt: `${student.first_name} ${student.last_name}`,
            size: "sm",
          },
          student.avatar_url
            ? undefined
            : {
                fallback: () =>
                  getInitials(student.first_name, student.last_name),
              },
        ),
        h("div", {}, [
          h(
            "div",
            { class: "font-medium" },
            `${student.first_name} ${student.last_name}`,
          ),
          h("div", { class: "text-xs text-gray-500" }, student.phone || ""),
        ]),
      ]);
    },
  },
  {
    accessorKey: "status",
    header: "Holat",
    cell: ({ row }) => {
      const studentId = row.original.student.user_id;
      const currentStatus = getAttendanceData(studentId).status;

      return h(
        "div",
        { class: "w-48" },
        h(
          USelectMenu,
          {
            modelValue: currentStatus,
            "onUpdate:modelValue": (value: string) => {
              getAttendanceData(studentId).status = value;
            },
            items: statusOptions,
            valueKey: "value",
            placeholder: "Holatni tanlang",
            disabled: isSaving.value,
            size: "md",
          },
          {
            label: () => {
              const selected = statusOptions.find(
                (s) => s.value === currentStatus,
              );
              if (!selected) return "Holatni tanlang";

              return h("div", { class: "flex items-center gap-2" }, [
                h("span", {
                  class: `h-2 w-2 rounded-full ${
                    currentStatus === "present"
                      ? "bg-green-500"
                      : currentStatus === "absent"
                        ? "bg-red-500"
                        : "bg-gray-300"
                  }`,
                }),
                h("span", {}, selected.label),
              ]);
            },
            option: ({ option }: any) => {
              return h("div", { class: "flex items-center gap-2" }, [
                h("span", {
                  class: `h-2 w-2 rounded-full ${
                    option.value === "present" ? "bg-green-500" : "bg-red-500"
                  }`,
                }),
                h("span", {}, option.label),
              ]);
            },
          },
        ),
      );
    },
  },
  {
    accessorKey: "note",
    header: "Izoh",
    cell: ({ row }) => {
      const studentId = row.original.student.user_id;
      const currentNote = getAttendanceData(studentId).note;

      return h(UInput, {
        modelValue: currentNote,
        "onUpdate:modelValue": (value: string) => {
          getAttendanceData(studentId).note = value;
        },
        placeholder: "Ixtiyoriy izoh...",
        disabled: isSaving.value,
        size: "md",
      });
    },
  },
];

// Computed
const hasChanges = computed(() => {
  return Object.values(attendanceData).some((data) => data.status !== "");
});

const dateInputValue = computed({
  get: () => formatDateForApi(selectedDate.value),
  set: (value: string) => {
    selectedDate.value = new Date(value + "T00:00:00Z");
  },
});

// Fetch group details
const fetchGroupDetails = async () => {
  try {
    const response = await api.get<any>(
      apiService.value,
      `/groups/${groupId.value}`,
    );
    Object.assign(group, response);
  } catch (error) {
    console.error("Failed to fetch group details:", error);
    toast.add({
      title: "Xatolik",
      description: "Guruh ma'lumotlarini yuklashda xatolik",
      color: "error",
    });
  }
};

// Fetch group students
const fetchGroupStudents = async () => {
  try {
    const response = await api.get<any[]>(
      apiService.value,
      `/group-students/group/${groupId.value}`,
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
    toast.add({
      title: "Xatolik",
      description: "Talabalarni yuklashda xatolik",
      color: "error",
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

    // Get existing attendance records for this group and date
    const response = await api.get<any[]>(
      apiService.value,
      `/attendance/group/${groupId.value}/daterange?startDate=${formattedDate}&endDate=${formattedDate}`,
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
    toast.add({
      title: "Xatolik",
      description: "Davomat yozuvlarini yuklashda xatolik",
      color: "error",
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
          error,
        );
        hasErrors = true;
      }
    }

    if (hasErrors) {
      toast.add({
        title: "Ogohlantirish",
        description: "Ba'zi davomat yozuvlari saqlanmadi",
        color: "warning",
      });
    } else {
      toast.add({
        title: "Muvaffaqiyat",
        description: "Davomat muvaffaqiyatli saqlandi!",
        color: "success",
      });
    }
  } catch (error) {
    console.error("Failed to save attendance:", error);
    toast.add({
      title: "Xatolik",
      description: "Davomatni saqlashda xatolik",
      color: "error",
    });
  } finally {
    isSaving.value = false;
  }
};

// Helper functions
const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(date);
};

const formatDateForApi = (date: Date): string => {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
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
