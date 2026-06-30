<template>
  <UDashboardPanel id="support-assignments">
    <template #header>
      <UDashboardNavbar title="Support biriktirishlar" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #description>
          Support o'qituvchilarni guruhlarga kunlar va vaqt bilan biriktiring
        </template>
        <template #right>
          <SupportAssignmentModal :support-teachers="supportTeachers" :groups="groups" :teachers="mainTeachers"
            @submit="loadAssignments" />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #right>
          <USelectMenu v-model="filterTeacher" :items="teacherFilterOptions" value-key="value"
            placeholder="Support o'qituvchi" searchable class="w-52">
            <template #label>
              {{
                teacherFilterOptions.find((t) => t.value === filterTeacher)
                  ?.label || "Support o'qituvchi"
              }}
            </template>
          </USelectMenu>

          <USelectMenu v-model="filterMainTeacher" :items="mainTeacherFilterOptions" value-key="value"
            placeholder="O'qituvchi" searchable class="w-52">
            <template #label>
              {{
                mainTeacherFilterOptions.find((t) => t.value === filterMainTeacher)
                  ?.label || "O'qituvchi"
              }}
            </template>
          </USelectMenu>

          <USelectMenu v-model="filterGroup" :items="groupFilterOptions" value-key="value" placeholder="Guruh"
            searchable class="w-44">
            <template #label>
              {{
                groupFilterOptions.find((g) => g.value === filterGroup)?.label ||
                "Guruh"
              }}
            </template>
          </USelectMenu>

          <USelectMenu v-model="filterDays" :items="daysFilterOptions" value-key="value" placeholder="Kunlar"
            class="w-40">
            <template #label>
              {{
                daysFilterOptions.find((d) => d.value === filterDays)?.label ||
                "Kunlar"
              }}
            </template>
          </USelectMenu>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div>
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold">Biriktirishlar ro'yxati</h3>
        </template>

        <UTable :data="assignments" :columns="columns" :loading="isLoading" :empty="'Biriktirishlar topilmadi'" />

        <template #footer>
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-500">
              <span class="font-medium">{{ paginationStart }}</span> dan
              <span class="font-medium">{{ paginationEnd }}</span> gacha, jami
              <span class="font-medium">{{ totalRecords }}</span> ta biriktirish
            </div>

            <UPagination :page="currentPage" :total="totalRecords" :items-per-page="pageLimit" show-last
              show-first @update:page="(p: number) => (currentPage = p)" />
          </div>
        </template>
      </UCard>
      </div>
    </template>

    <!-- Edit modal (controlled) -->
    <SupportAssignmentModal v-if="editing" v-model:open="editOpen" :support-teachers="supportTeachers" :groups="groups"
      :teachers="mainTeachers" :assignment="editing" @submit="onEdited">
      <span class="hidden" />
    </SupportAssignmentModal>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch, h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";
import type { SupportAssignment, Group, Teacher } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");

const { apiService } = useAuth();
const toast = useToast();

definePageMeta({ layout: "default", middleware: "auth" });

const assignments = ref<SupportAssignment[]>([]);
const groups = ref<Group[]>([]);
const supportTeachers = ref<Teacher[]>([]);
const mainTeachers = ref<Teacher[]>([]);
const isLoading = ref(true);

// Pagination
const currentPage = usePaginationState("page", 1);
const pageLimit = ref(10);
const totalRecords = ref(0);

const paginationStart = computed(() =>
  totalRecords.value === 0
    ? 0
    : (currentPage.value - 1) * pageLimit.value + 1,
);
const paginationEnd = computed(() =>
  Math.min(currentPage.value * pageLimit.value, totalRecords.value),
);

const editing = ref<SupportAssignment | null>(null);
const editOpen = ref(false);

// Filters
const filterTeacher = ref("all");
const filterMainTeacher = ref("all");
const filterGroup = ref("all");
const filterDays = ref("all");

const teacherFilterOptions = computed(() => [
  { value: "all", label: "Barcha yordamchi o'qituvchilar" },
  ...supportTeachers.value.map((t) => ({
    value: t.user_id,
    label: `${t.first_name} ${t.last_name}`,
  })),
]);

const mainTeacherFilterOptions = computed(() => [
  { value: "all", label: "Barcha o'qituvchilar" },
  ...mainTeachers.value.map((t) => ({
    value: t.user_id,
    label: `${t.first_name} ${t.last_name}`,
  })),
]);

const groupFilterOptions = computed(() => [
  { value: "all", label: "Barcha guruhlar" },
  ...groups.value.map((g) => ({ value: g.id, label: g.name })),
]);

const daysFilterOptions = [
  { value: "all", label: "Barcha kunlar" },
  { value: "odd", label: "Toq kunlar" },
  { value: "even", label: "Juft kunlar" },
  { value: "every_day", label: "Har kuni" },
  { value: "other_day", label: "Boshqa kunlar" },
];

const dayLabels: Record<string, string> = {
  odd: "Toq kunlar",
  even: "Juft kunlar",
  every_day: "Har kuni",
  other_day: "Boshqa kunlar",
};

const timeRange = (a: SupportAssignment) => {
  if (!a.start_time && !a.end_time) return "—";
  return `${(a.start_time || "").slice(0, 5)} - ${(a.end_time || "").slice(0, 5)}`;
};

const columns: TableColumn<SupportAssignment>[] = [
  {
    accessorKey: "teacher",
    header: "Support o'qituvchi",
    cell: ({ row }) => {
      const t = row.original.teacher;
      return h(
        "span",
        { class: "font-medium" },
        t ? `${t.first_name} ${t.last_name}` : "—",
      );
    },
  },
  {
    accessorKey: "main_teacher",
    header: "O'qituvchi",
    cell: ({ row }) => {
      const t = row.original.main_teacher;
      return h(
        "span",
        { class: "text-sm" },
        t ? `${t.first_name} ${t.last_name}` : "—",
      );
    },
  },
  {
    accessorKey: "group",
    header: "Guruh",
    cell: ({ row }) => {
      const g = row.original.group;
      return g
        ? h(UBadge, { variant: "subtle", color: "primary" }, () => g.name)
        : h("span", { class: "text-gray-400 text-sm" }, "—");
    },
  },
  {
    accessorKey: "days",
    header: "Kunlar",
    cell: ({ row }) =>
      h(
        "span",
        { class: "text-sm" },
        row.original.days ? dayLabels[row.original.days] : "—",
      ),
  },
  {
    accessorKey: "time",
    header: "Vaqt",
    cell: ({ row }) => h("span", { class: "text-sm" }, timeRange(row.original)),
  },
  {
    accessorKey: "is_active",
    header: "Holat",
    cell: ({ row }) =>
      h(
        UBadge,
        {
          variant: "subtle",
          color: row.original.is_active ? "success" : "neutral",
        },
        () => (row.original.is_active ? "Faol" : "Nofaol"),
      ),
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) => {
      return h("div", { class: "flex items-center gap-1" }, [
        h(UButton, {
          variant: "ghost",
          color: "primary",
          icon: "i-lucide-eye",
          size: "sm",
          square: true,
          title: "Davomatni ko'rish",
          onClick: () =>
            navigateTo(
              `/support-attendance/group/${row.original.group_id}?assignment_id=${row.original.id}&teacher_id=${row.original.support_teacher_id}`,
            ),
        }),
        h(UButton, {
          variant: "ghost",
          color: "neutral",
          icon: "i-lucide-pencil",
          size: "sm",
          square: true,
          title: "Tahrirlash",
          onClick: () => openEdit(row.original),
        }),
        h(UButton, {
          variant: "ghost",
          color: "error",
          icon: "i-lucide-trash-2",
          size: "sm",
          square: true,
          title: "O'chirish",
          onClick: () => removeAssignment(row.original.id),
        }),
      ]);
    },
  },
];

const loadAssignments = async () => {
  isLoading.value = true;
  try {
    const params = new URLSearchParams();
    params.append("page", currentPage.value.toString());
    params.append("limit", pageLimit.value.toString());
    if (filterTeacher.value !== "all")
      params.append("support_teacher_id", filterTeacher.value);
    if (filterMainTeacher.value !== "all")
      params.append("teacher_id", filterMainTeacher.value);
    if (filterGroup.value !== "all")
      params.append("group_id", filterGroup.value);
    if (filterDays.value !== "all") params.append("days", filterDays.value);

    const res = await api.get<{
      data: SupportAssignment[];
      total: number;
      totalPages: number;
      currentPage: number;
    }>(apiService.value, `/support-assignments?${params.toString()}`);
    assignments.value = res.data || [];
    totalRecords.value = res.total || 0;
  } catch (error) {
    console.error("Failed to load support assignments:", error);
    toast.add({
      title: "Xatolik",
      description: "Biriktirishlarni yuklashda xatolik",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const loadGroups = async () => {
  try {
    const res = await api.get<{ data: Group[] }>(
      apiService.value,
      "/groups?limit=1000",
    );
    groups.value = res.data || [];
  } catch (error) {
    console.error("Failed to load groups:", error);
  }
};

const loadSupportTeachers = async () => {
  try {
    const res = await api.get<{ data: Teacher[] }>(
      apiService.value,
      "/users/support-teachers?limit=1000",
    );
    supportTeachers.value = res.data || [];
  } catch (error) {
    console.error("Failed to load support teachers:", error);
  }
};

const loadMainTeachers = async () => {
  try {
    const res = await api.get<{ data: Teacher[] }>(
      apiService.value,
      "/users/teachers?limit=1000",
    );
    mainTeachers.value = res.data || [];
  } catch (error) {
    console.error("Failed to load teachers:", error);
  }
};

const openEdit = (assignment: SupportAssignment) => {
  editing.value = assignment;
  editOpen.value = true;
};

const onEdited = () => {
  editOpen.value = false;
  editing.value = null;
  loadAssignments();
};

const removeAssignment = async (id: string) => {
  if (!confirm("Ushbu biriktirishni o'chirmoqchimisiz?")) return;
  try {
    await api.delete(apiService.value, `/support-assignments/${id}`);
    toast.add({
      title: "O'chirildi",
      description: "Biriktirish o'chirildi",
      color: "success",
    });
    loadAssignments();
  } catch (error: any) {
    toast.add({
      title: "Xatolik",
      description: error.message || "O'chirishda xatolik",
      color: "error",
    });
  }
};

watch([filterTeacher, filterMainTeacher, filterGroup, filterDays], () => {
  currentPage.value = 1;
  loadAssignments();
});

watch(currentPage, () => {
  loadAssignments();
});

onMounted(async () => {
  await Promise.all([loadGroups(), loadSupportTeachers(), loadMainTeachers()]);
  await loadAssignments();
});
</script>
