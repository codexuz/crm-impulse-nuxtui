<template>
    <UDashboardPanel id="exam-detail">
        <template #header>
            <UDashboardNavbar title="Imtihon ma'lumoti" :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" @click="useRouter().back()" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div v-if="isLoading" class="flex items-center justify-center py-20">
                <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
            </div>

            <div v-else-if="exam" class="space-y-6">
                <!-- Exam Info Card -->
                <UCard>
                    <div class="flex flex-col md:flex-row gap-6">
                        <div class="flex-1 space-y-3">
                            <div class="flex items-center gap-3">
                                <h2 class="text-xl font-bold">{{ exam.title }}</h2>
                                <UBadge :color="statusColors[exam.status] || 'neutral'" variant="subtle">
                                    {{ statusLabels[exam.status] || exam.status }}
                                </UBadge>
                                <UBadge :color="exam.is_online ? 'primary' : 'neutral'" variant="subtle">
                                    {{ exam.is_online ? "Online" : "Offline" }}
                                </UBadge>
                            </div>

                            <div class="flex items-center gap-3">
                                <USwitch :model-value="exam.bonusOrPenaltyAdded ?? false"
                                    :loading="isUpdatingBonus" :disabled="isUpdatingBonus"
                                    @update:model-value="toggleBonusOrPenalty" />
                                <span class="text-sm font-medium">
                                    {{ exam.bonusOrPenaltyAdded ? "Bonus/Jarima qo'shilgan" : "Bonus/Jarima qo'shilmagan" }}
                                </span>
                            </div>

                            <div class="space-y-2 text-sm">
                                <div class="flex items-center gap-3">
                                    <UIcon name="i-lucide-layers" class="size-4 text-muted" />
                                    <span class="text-muted w-32">Guruh:</span>
                                    <span class="font-medium">{{ groupName }}</span>
                                </div>

                                <div class="flex items-center gap-3">
                                    <UIcon name="i-lucide-user" class="size-4 text-muted" />
                                    <span class="text-muted w-32">O'qituvchi:</span>
                                    <span class="font-medium">{{ teacherName }}</span>
                                </div>

                                <div class="flex items-center gap-3">
                                    <UIcon name="i-lucide-bar-chart" class="size-4 text-muted" />
                                    <span class="text-muted w-32">Daraja:</span>
                                    <span class="font-medium capitalize">{{ exam.level }}</span>
                                </div>

                                <div class="flex items-center gap-3">
                                    <UIcon name="i-lucide-calendar" class="size-4 text-muted" />
                                    <span class="text-muted w-32">Sana:</span>
                                    <span class="font-medium">{{ formatDate(exam.scheduled_at) }}</span>
                                </div>

                                <div class="flex items-center gap-3">
                                    <UIcon name="i-lucide-clock" class="size-4 text-muted" />
                                    <span class="text-muted w-32">Yaratilgan:</span>
                                    <span class="font-medium">{{ formatDate(exam.created_at) }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Stats Summary -->
                        <div v-if="results.length > 0" class="border-l pl-6 space-y-3 min-w-48">
                            <div class="flex justify-between items-center border-b pb-2">
                                <div class="flex items-center gap-2">
                                    <UIcon name="i-lucide-users" class="size-4 text-primary" />
                                    <span class="text-sm text-muted font-medium">Ishtirokchilar:</span>
                                </div>
                                <span class="text-lg font-bold">{{ results.length }}</span>
                            </div>
                            <div class="flex justify-between items-center border-b pb-2">
                                <div class="flex items-center gap-2">
                                    <UIcon name="i-lucide-check-circle" class="size-4 text-green-500" />
                                    <span class="text-sm text-muted font-medium">O'tganlar:</span>
                                </div>
                                <span class="text-lg font-bold text-green-600">{{ passedCount }}</span>
                            </div>
                            <div class="flex justify-between items-center border-b pb-2">
                                <div class="flex items-center gap-2">
                                    <UIcon name="i-lucide-x-circle" class="size-4 text-red-500" />
                                    <span class="text-sm text-muted font-medium">Yiqilganlar:</span>
                                </div>
                                <span class="text-lg font-bold text-red-600">{{ failedCount }}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-2">
                                    <UIcon name="i-lucide-percent" class="size-4 text-amber-500" />
                                    <span class="text-sm text-muted font-medium">O'rtacha ball:</span>
                                </div>
                                <span class="text-lg font-bold">{{ averagePercentage }}%</span>
                            </div>
                        </div>
                    </div>
                </UCard>

                <!-- Exam Results Table -->
                <UCard>
                    <template #header>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <h3 class="text-base font-semibold">Natijalar</h3>
                                <UBadge variant="subtle" size="sm">{{ results.length }}</UBadge>
                            </div>
                        </div>
                    </template>

                    <UTable :data="results" :columns="resultColumns" :loading="isLoadingResults"
                        :empty="'Natijalar topilmadi'" />
                </UCard>
            </div>

            <div v-else class="flex flex-col items-center justify-center py-20 text-muted">
                <UIcon name="i-lucide-file-x" class="size-12 mb-4" />
                <p>Imtihon topilmadi</p>
            </div>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Exam, ExamResult, Teacher } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import { h, resolveComponent } from "vue";

const UBadge = resolveComponent("UBadge");

const { apiService } = useAuth();
const toast = useToast();
const route = useRoute();

definePageMeta({
    layout: "default",
    middleware: "auth",
});

const examId = computed(() => route.params.id as string);

// Data
const exam = ref<Exam | null>(null);
const results = ref<ExamResult[]>([]);
const teacher = ref<Teacher | null>(null);
const isLoading = ref(true);
const isLoadingResults = ref(false);
const isUpdatingBonus = ref(false);
const groupName = ref("Noma'lum");

const teacherName = computed(() => {
    if (!teacher.value) return "Noma'lum";
    return `${teacher.value.first_name} ${teacher.value.last_name}`;
});

// Status config
const statusColors: Record<string, string> = {
    scheduled: "info",
    completed: "success",
    cancelled: "error",
};

const statusLabels: Record<string, string> = {
    scheduled: "Rejalashtirilgan",
    completed: "Yakunlangan",
    cancelled: "Bekor qilingan",
};

// Computed stats
const passedCount = computed(() => results.value.filter((r) => r.result === "passed").length);
const failedCount = computed(() => results.value.filter((r) => r.result === "failed").length);
const averagePercentage = computed(() => {
    if (results.value.length === 0) return 0;
    const total = results.value.reduce((sum, r) => sum + parseFloat(r.percentage), 0);
    return Math.round(total / results.value.length);
});

// Results table columns
const resultColumns: TableColumn<ExamResult>[] = [
    {
        accessorKey: "student_id",
        header: "Talaba",
        cell: ({ row }) => {
            const student = row.original.student;
            if (student) {
                return h("span", { class: "font-medium" }, `${student.first_name} ${student.last_name}`);
            }
            return h("span", { class: "text-xs font-mono text-muted" }, row.original.student_id);
        },
    },
    {
        accessorKey: "score",
        header: "Ball",
        cell: ({ row }) => {
            return h("span", { class: "font-medium" }, `${row.original.score}/${row.original.max_score}`);
        },
    },
    {
        accessorKey: "percentage",
        header: "Foiz",
        cell: ({ row }) => {
            const pct = parseFloat(row.original.percentage);
            const color = pct >= 70 ? "success" : pct >= 50 ? "warning" : "error";
            return h(UBadge, { variant: "subtle", color }, () => `${pct}%`);
        },
    },
    {
        accessorKey: "result",
        header: "Natija",
        cell: ({ row }) => {
            const isPassed = row.original.result === "passed";
            return h(
                UBadge,
                {
                    variant: "subtle",
                    color: isPassed ? "success" : "error",
                },
                () => (isPassed ? "O'tdi" : "Yiqildi"),
            );
        },
    },
    {
        accessorKey: "feedback",
        header: "Izoh",
        cell: ({ row }) => {
            return h("span", { class: "text-sm text-muted" }, row.original.feedback || "—");
        },
    },
    {
        accessorKey: "created_at",
        header: "Yaratilgan",
        cell: ({ row }) => {
            return h("span", { class: "text-sm text-muted" }, formatDate(row.original.created_at));
        },
    },
    {
        accessorKey: "updated_at",
        header: "Yangilangan",
        cell: ({ row }) => {
            return h("span", { class: "text-sm text-muted" }, formatDate(row.original.updated_at));
        },
    },
];

// Methods
const loadExam = async () => {
    isLoading.value = true;
    try {
        exam.value = await api.get<Exam>(
            apiService.value,
            `/exams/${examId.value}`,
        );

        // Load group name
        if (exam.value?.group_id) {
            try {
                const groupRes = await api.get<{ name: string }>(
                    apiService.value,
                    `/groups/${exam.value.group_id}`,
                );
                groupName.value = groupRes.name || "Noma'lum";
            } catch {
                groupName.value = "Noma'lum";
            }
        }

        // Load teacher (teacher_id is resolved by backend, falling back to group's teacher)
        if (exam.value?.teacher_id) {
            try {
                teacher.value = await api.get<Teacher>(
                    apiService.value,
                    `/users/${exam.value.teacher_id}`,
                );
            } catch {
                teacher.value = null;
            }
        }
    } catch (error) {
        console.error("Failed to load exam:", error);
        toast.add({
            title: "Xatolik",
            description: "Imtihon ma'lumotini yuklashda xatolik.",
            color: "error",
        });
    } finally {
        isLoading.value = false;
    }
};

const toggleBonusOrPenalty = async (value: boolean) => {
    if (!exam.value) return;
    const previous = exam.value.bonusOrPenaltyAdded ?? false;
    exam.value.bonusOrPenaltyAdded = value; // optimistic update
    isUpdatingBonus.value = true;
    try {
        await api.put(
            apiService.value,
            `/exams/${examId.value}`,
            { bonusOrPenaltyAdded: value },
        );
        toast.add({
            title: "Saqlandi",
            description: value
                ? "Bonus/Jarima qo'shilgan deb belgilandi."
                : "Bonus/Jarima qo'shilmagan deb belgilandi.",
            color: "success",
        });
    } catch (error) {
        console.error("Failed to update bonus/penalty status:", error);
        exam.value.bonusOrPenaltyAdded = previous; // revert on error
        toast.add({
            title: "Xatolik",
            description: "Holatni yangilashda xatolik. Qaytadan urinib ko'ring.",
            color: "error",
        });
    } finally {
        isUpdatingBonus.value = false;
    }
};

const loadResults = async () => {
    isLoadingResults.value = true;
    try {
        results.value = await api.get<ExamResult[]>(
            apiService.value,
            `/exam-results/exam/${examId.value}`,
        );
    } catch (error) {
        console.error("Failed to load exam results:", error);
    } finally {
        isLoadingResults.value = false;
    }
};

// Helpers
const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// Initialize
onMounted(async () => {
    await loadExam();
    await loadResults();
});
</script>
