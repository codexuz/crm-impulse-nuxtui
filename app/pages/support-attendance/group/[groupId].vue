<template>
  <UDashboardPanel id="support-group-attendance">
    <template #header>
      <UDashboardNavbar
        :title="`Support davomati - ${group.name || 'Yuklanmoqda...'}`"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            @click="navigateTo('/support-assignments')"
          />
        </template>
        <template #description>
          {{ formatDate(selectedDate) }} uchun support sessiyasi davomatini belgilang
        </template>
        <template #right>
          <UInput v-model="dateInputValue" type="date" icon="i-lucide-calendar" class="w-48" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4">
        <!-- Stats -->
        <div v-if="stats" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <UCard :ui="{ body: { base: 'p-4 sm:p-4' } }">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                <UIcon name="i-lucide-clipboard-list" class="w-5 h-5" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Jami yozuvlar</p>
                <p class="text-xl font-semibold">{{ stats.total }}</p>
              </div>
            </div>
          </UCard>
          <UCard :ui="{ body: { base: 'p-4 sm:p-4' } }">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <UIcon name="i-lucide-user-check" class="w-5 h-5" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Kelganlar</p>
                <p class="text-xl font-semibold text-green-600 dark:text-green-400">{{ stats.present }}</p>
              </div>
            </div>
          </UCard>
          <UCard :ui="{ body: { base: 'p-4 sm:p-4' } }">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <UIcon name="i-lucide-user-x" class="w-5 h-5" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Kelmaganlar</p>
                <p class="text-xl font-semibold text-red-600 dark:text-red-400">{{ stats.absent }}</p>
              </div>
            </div>
          </UCard>
          <UCard :ui="{ body: { base: 'p-4 sm:p-4' } }">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <UIcon name="i-lucide-percent" class="w-5 h-5" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Davomat darajasi</p>
                <p class="text-xl font-semibold text-blue-600 dark:text-blue-400">{{ stats.attendanceRate }}%</p>
              </div>
            </div>
          </UCard>
        </div>

        <UCard>
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h3 class="text-base font-semibold">
                Talabalar davomati - {{ formatDate(selectedDate) }}
              </h3>
              <div class="flex flex-wrap items-center gap-3">
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
import { ref, reactive, computed, watch, onMounted, h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { useAuth } from "~/composables/useAuth";
import { api } from "~/lib/api";
import type { SupportAttendance } from "~/types";

const UAvatar = resolveComponent("UAvatar");
const USelectMenu = resolveComponent("USelectMenu");
const UInput = resolveComponent("UInput");

const route = useRoute();
const groupId = computed(() => route.params.groupId as string);
const assignmentId = computed(() => (route.query.assignment_id as string) || undefined);
const teacherIdQuery = computed(() => (route.query.teacher_id as string) || undefined);

const { apiService } = useAuth();
const toast = useToast();

definePageMeta({ middleware: ["auth"] });

const isLoading = ref(false);
const isSaving = ref(false);
const group = reactive({ id: "", name: "" });
const groupStudents = ref<any[]>([]);
const selectedDate = ref(new Date());
const attendanceData = reactive<Record<string, { status: string; note: string }>>({});
const stats = ref<{
  total: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: string;
} | null>(null);

const statusOptions = [
  { value: "present", label: "Keldi" },
  { value: "absent", label: "Kelmadi" },
  { value: "late", label: "Kechikdi" },
];

const dotClass = (status: string) =>
  status === "present"
    ? "bg-green-500"
    : status === "absent"
      ? "bg-red-500"
      : status === "late"
        ? "bg-amber-500"
        : "bg-gray-300";

const getAttendanceData = (studentId: string) => {
  if (!attendanceData[studentId]) {
    attendanceData[studentId] = { status: "", note: "" };
  }
  return attendanceData[studentId];
};

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
            : { fallback: () => getInitials(student.first_name, student.last_name) },
        ),
        h("div", {}, [
          h("div", { class: "font-medium" }, `${student.first_name} ${student.last_name}`),
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
              const selected = statusOptions.find((s) => s.value === currentStatus);
              if (!selected) return "Holatni tanlang";
              return h("div", { class: "flex items-center gap-2" }, [
                h("span", { class: `h-2 w-2 rounded-full ${dotClass(currentStatus)}` }),
                h("span", {}, selected.label),
              ]);
            },
            option: ({ option }: any) =>
              h("div", { class: "flex items-center gap-2" }, [
                h("span", { class: `h-2 w-2 rounded-full ${dotClass(option.value)}` }),
                h("span", {}, option.label),
              ]),
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
      return h(UInput, {
        modelValue: getAttendanceData(studentId).note,
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

const hasChanges = computed(() =>
  Object.values(attendanceData).some((d) => d.status !== ""),
);

const dateInputValue = computed({
  get: () => formatDateForApi(selectedDate.value),
  set: (value: string) => {
    selectedDate.value = new Date(value + "T00:00:00Z");
  },
});

const fetchGroupDetails = async () => {
  try {
    const res = await api.get<any>(apiService.value, `/groups/${groupId.value}`);
    Object.assign(group, res);
  } catch (error) {
    console.error("Failed to fetch group:", error);
  }
};

const fetchGroupStudents = async () => {
  try {
    const res = await api.get<any[]>(
      apiService.value,
      `/group-students/group/${groupId.value}`,
    );
    groupStudents.value = res || [];
    groupStudents.value.forEach((s) => {
      if (!attendanceData[s.student.user_id]) {
        attendanceData[s.student.user_id] = { status: "", note: "" };
      }
    });
  } catch (error) {
    console.error("Failed to fetch students:", error);
    toast.add({
      title: "Xatolik",
      description: "Talabalarni yuklashda xatolik",
      color: "error",
    });
  }
};

const fetchStats = async () => {
  try {
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));
    stats.value = await api.get<any>(
      apiService.value,
      `/support-attendance/stats?group_id=${groupId.value}&startDate=${formatDateForApi(
        startOfMonth,
      )}&endDate=${formatDateForApi(endOfMonth)}`,
    );
  } catch (error) {
    console.error("Failed to fetch stats:", error);
  }
};

const fetchAttendanceData = async () => {
  isLoading.value = true;
  try {
    groupStudents.value.forEach((s) => {
      attendanceData[s.student.user_id] = { status: "", note: "" };
    });

    const formattedDate = formatDateForApi(selectedDate.value);
    const records = await api.get<SupportAttendance[]>(
      apiService.value,
      `/support-attendance?group_id=${groupId.value}&startDate=${formattedDate}&endDate=${formattedDate}`,
    );

    (records || []).forEach((record) => {
      if (attendanceData[record.student_id]) {
        attendanceData[record.student_id] = {
          status: record.status,
          note: record.note || "",
        };
      }
    });
  } catch (error) {
    console.error("Failed to fetch support attendance:", error);
    toast.add({
      title: "Xatolik",
      description: "Davomat yozuvlarini yuklashda xatolik",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const saveAttendance = async () => {
  const teacherId = teacherIdQuery.value;
  if (!teacherId) {
    toast.add({
      title: "Xatolik",
      description: "Support o'qituvchi aniqlanmadi. Biriktirishdan kiring.",
      color: "error",
    });
    return;
  }

  isSaving.value = true;
  const formattedDate = formatDateForApi(selectedDate.value);
  try {
    const records = Object.entries(attendanceData)
      .filter(([, data]) => data.status !== "")
      .map(([student_id, data]) => ({
        student_id,
        status: data.status,
        note: data.note,
      }));

    if (records.length === 0) {
      isSaving.value = false;
      return;
    }

    await api.post(apiService.value, "/support-attendance/bulk", {
      assignment_id: assignmentId.value,
      support_teacher_id: teacherId,
      group_id: groupId.value,
      date: formattedDate,
      records,
    });

    toast.add({
      title: "Muvaffaqiyat",
      description: "Support davomati saqlandi!",
      color: "success",
    });
    fetchStats();
  } catch (error: any) {
    console.error("Failed to save support attendance:", error);
    toast.add({
      title: "Xatolik",
      description: error.message || "Davomatni saqlashda xatolik",
      color: "error",
    });
  } finally {
    isSaving.value = false;
  }
};

const getInitials = (firstName: string, lastName: string): string =>
  `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();

const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(date);

const formatDateForApi = (date: Date): string => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
};

onMounted(async () => {
  isLoading.value = true;
  selectedDate.value = new Date();
  await Promise.all([fetchGroupDetails(), fetchGroupStudents(), fetchStats()]);
  await fetchAttendanceData();
  isLoading.value = false;
});

watch(selectedDate, () => fetchAttendanceData());
</script>
