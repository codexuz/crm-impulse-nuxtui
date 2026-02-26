<template>
    <UDashboardPanel id="student-detail">
        <template #header>
            <UDashboardNavbar title="O'quvchi ma'lumoti" :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost"
                        @click="navigateTo('/students')" />
                </template>

                <template #right>
                    <UButton icon="i-lucide-pencil" color="neutral" variant="ghost" square @click="openEditModal" />
                    <UPopover v-model:open="deletePopoverOpen">
                        <UButton icon="i-lucide-trash-2" color="error" variant="ghost" square />
                        <template #content>
                            <div class="p-4 max-w-sm space-y-3">
                                <h4 class="font-semibold text-sm">Ishonchingiz komilmi?</h4>
                                <p class="text-sm text-muted">Bu talabani butunlay o'chiradi.</p>
                                <div class="flex justify-end gap-2">
                                    <UButton color="neutral" variant="subtle" label="Bekor qilish" size="sm"
                                        @click="deletePopoverOpen = false" />
                                    <UButton color="error" :label="isDeleting ? 'O\'chirilmoqda...' : 'O\'chirish'"
                                        :loading="isDeleting" size="sm" @click="deleteStudent" />
                                </div>
                            </div>
                        </template>
                    </UPopover>
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div v-if="isLoading" class="flex items-center justify-center py-20">
                <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-primary" />
            </div>

            <div v-else-if="student" class="space-y-6">
                <!-- Student Profile Header -->
                <UCard>
                    <div class="flex flex-col md:flex-row gap-6">
                        <div class="flex items-start gap-4 flex-1">
                            <UAvatar :src="student.avatar_url || undefined"
                                :alt="`${student.first_name} ${student.last_name}`" size="3xl">
                                <template #fallback>
                                    <span class="text-2xl font-semibold">
                                        {{ getInitials(student.first_name, student.last_name) }}
                                    </span>
                                </template>
                            </UAvatar>

                            <div class="space-y-3 flex-1">
                                <div>
                                    <h2 class="text-xl font-bold">{{ student.first_name }} {{ student.last_name }}</h2>
                                </div>

                                <div class="space-y-2 text-sm">
                                    <div class="flex items-center gap-3">
                                        <UIcon name="i-lucide-phone" class="size-4 text-muted" />
                                        <span class="text-muted w-32">Telefon raqam:</span>
                                        <span class="font-medium">{{ student.phone }}</span>
                                        <UButton icon="i-lucide-phone-call" color="success" variant="ghost" size="xs"
                                            square :href="`tel:${student.phone}`" />
                                    </div>

                                    <div class="flex items-center gap-3">
                                        <UIcon name="i-lucide-building" class="size-4 text-muted" />
                                        <span class="text-muted w-32">Filiallari:</span>
                                        <span class="font-medium">{{ getBranchName() }}</span>
                                    </div>

                                    <div class="flex items-center gap-3">
                                        <UIcon name="i-lucide-key-round" class="size-4 text-muted" />
                                        <span class="text-muted w-32">Login:</span>
                                        <UBadge variant="subtle" size="sm">
                                            <UIcon name="i-lucide-copy" class="size-3 mr-1 cursor-pointer"
                                                @click="copyToClipboard(student.username)" />
                                            {{ student.username }}
                                        </UBadge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Stats -->
                        <div class="border-l pl-6 space-y-3 min-w-48">
                            <div class="flex justify-between items-center border-b pb-2">
                                <div class="flex items-center gap-2">
                                    <UIcon name="i-lucide-trophy" class="size-4 text-amber-500" />
                                    <span class="text-sm text-muted font-medium">Rank:</span>
                                </div>
                                <span class="text-lg font-bold">{{ student.student_profile?.points || 0 }}</span>
                            </div>
                            <div class="flex justify-between items-center border-b pb-2">
                                <div class="flex items-center gap-2">
                                    <UIcon name="i-lucide-flame" class="size-4 text-orange-500" />
                                    <span class="text-sm text-muted font-medium">Streak:</span>
                                </div>
                                <span class="text-lg font-bold">{{ student.student_profile?.streaks || 0 }}</span>
                            </div>
                            <div class="flex justify-between items-center border-b pb-2">
                                <div class="flex items-center gap-2">
                                    <UIcon name="i-lucide-coins" class="size-4 text-yellow-500" />
                                    <span class="text-sm text-muted font-medium">Coins:</span>
                                </div>
                                <span class="text-lg font-bold">{{ student.student_profile?.coins || 0 }}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-medium"
                                    :class="totalBalance < 0 ? 'text-red-500' : 'text-muted'">
                                    Balans:
                                </span>
                                <span class="text-lg font-bold" :class="totalBalance < 0 ? 'text-red-500' : ''">
                                    {{ formatCurrency(totalBalance) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </UCard>

                <!-- Tabs -->
                <UTabs v-model="activeTab" :items="tabItems" variant="link" :ui="{ trigger: 'px-2 py-1 text-xs' }">
                    <template #content="{ item }">
                        <!-- Guruhlar Tab -->
                        <div v-if="item.value === 'groups'" class="mt-4 space-y-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <h3 class="text-base font-semibold">Guruhlar ro'yxati</h3>
                                    <UBadge variant="subtle" size="sm">{{ studentGroups.length }}</UBadge>
                                </div>
                                <UButton icon="i-lucide-plus" label="Guruhga qo'shish" size="sm"
                                    @click="openAddGroupModal" />
                            </div>

                            <div v-if="studentGroups.length === 0" class="text-center py-8 text-muted">
                                Hech qanday guruhga yozilmagan
                            </div>

                            <div v-else class="grid gap-4 md:grid-cols-2">
                                <UCard v-for="groupItem in studentGroups" :key="groupItem.id">
                                    <div class="space-y-3">
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center gap-2">
                                                <UIcon name="i-lucide-layers" class="size-5 text-primary" />
                                                <span class="font-semibold">{{ groupItem.group?.name || "Noma'lum guruh"
                                                    }}</span>
                                            </div>
                                            <UPopover>
                                                <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs"
                                                    square />
                                                <template #content>
                                                    <div class="p-3 space-y-2 max-w-xs">
                                                        <p class="text-sm">Talabani guruhdan chiqarishni xohlaysizmi?
                                                        </p>
                                                        <div class="flex justify-end gap-2">
                                                            <UButton size="xs" variant="subtle" label="Bekor qilish"
                                                                color="neutral" />
                                                            <UButton size="xs" color="error" label="Chiqarish"
                                                                @click="removeFromGroup(groupItem.id)" />
                                                        </div>
                                                    </div>
                                                </template>
                                            </UPopover>
                                        </div>

                                        <div v-if="groupItem.group?.teacher" class="flex items-center gap-2 text-sm">
                                            <UIcon name="i-lucide-graduation-cap" class="size-4 text-muted" />
                                            <span class="text-muted">O'qituvchi:</span>
                                            <span class="font-medium">{{ groupItem.group.teacher.first_name }} {{
                                                groupItem.group.teacher.last_name
                                                }}</span>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <UBadge :color="groupItem.status === 'active' ? 'success' : 'neutral'"
                                                variant="subtle">
                                                {{ groupItem.status === 'active' ? 'Aktiv' : groupItem.status }}
                                            </UBadge>
                                        </div>

                                        <div class="border-t pt-3 space-y-2 text-sm">
                                            <div class="flex items-center gap-2">
                                                <UIcon name="i-lucide-calendar" class="size-4 text-muted" />
                                                <span class="text-muted">Dars kunlari</span>
                                            </div>
                                            <div v-if="groupItem.group?.days" class="ml-6 text-muted">
                                                {{ groupItem.group.days }},{{ groupItem.group.lesson_start || '' }} - {{
                                                    groupItem.group.lesson_end || '' }}
                                            </div>

                                            <div class="flex items-center justify-between">
                                                <div class="flex items-center gap-2">
                                                    <UIcon name="i-lucide-user-plus" class="size-4 text-muted" />
                                                    <span class="text-muted">Qo'shilgan sana:</span>
                                                </div>
                                                <span>{{ formatDate(groupItem.enrolled_at) }}</span>
                                            </div>

                                            <div class="flex items-center justify-between">
                                                <div class="flex items-center gap-2">
                                                    <UIcon name="i-lucide-activity" class="size-4 text-muted" />
                                                    <span class="text-muted">Aktivlashtirilgan sana:</span>
                                                </div>
                                                <span>{{ formatDate(groupItem.createdAt) }}</span>
                                            </div>

                                            <div v-if="getNextPaymentDate(groupItem)"
                                                class="flex items-center justify-between">
                                                <div class="flex items-center gap-2">
                                                    <UIcon name="i-lucide-credit-card" class="size-4 text-muted" />
                                                    <span class="text-muted">Keyingi to'lov</span>
                                                </div>
                                                <span>{{ getNextPaymentDate(groupItem) }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </UCard>
                            </div>
                        </div>

                        <!-- To'lovlar Tab -->
                        <div v-if="item.value === 'payments'" class="mt-4">
                            <UCard>
                                <template #header>
                                    <div class="flex items-center justify-between">
                                        <h3 class="text-base font-semibold">To'lovlar tarixi</h3>
                                        <UButton icon="i-lucide-plus" label="To'lov qo'shish" size="sm"
                                            @click="openAddPaymentModal" />
                                    </div>
                                </template>

                                <UTable :data="studentPayments" :columns="paymentColumns" :loading="isPaymentsLoading"
                                    :empty="'To\'lovlar topilmadi'" />
                            </UCard>
                        </div>

                        <!-- Ota-onalar Tab -->
                        <div v-if="item.value === 'parents'" class="mt-4 space-y-4">
                            <div class="flex items-center justify-between">
                                <h3 class="text-base font-semibold">Ota-onalar</h3>
                                <UButton icon="i-lucide-plus" label="Ota-ona qo'shish" size="sm"
                                    @click="openAddParentModal" />
                            </div>

                            <div v-if="studentParents.length === 0" class="text-center py-8 text-muted">
                                Ota-onalar ma'lumoti topilmadi
                            </div>

                            <div v-else class="grid gap-4 md:grid-cols-2">
                                <UCard v-for="parent in studentParents" :key="parent.id">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3">
                                            <UAvatar :alt="parent.full_name" size="md">
                                                <template #fallback>
                                                    {{ parent.full_name?.charAt(0)?.toUpperCase() || 'P' }}
                                                </template>
                                            </UAvatar>
                                            <div>
                                                <div class="font-medium">{{ parent.full_name }}</div>
                                                <div class="text-sm text-muted">{{ parent.phone_number }}</div>
                                                <div v-if="parent.additional_number" class="text-xs text-muted">
                                                    Qo'shimcha: {{ parent.additional_number }}
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-1">
                                            <UButton icon="i-lucide-phone-call" color="success" variant="ghost"
                                                size="xs" square :href="`tel:${parent.phone_number}`" />
                                            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs"
                                                square @click="deleteParent(parent.id)" />
                                        </div>
                                    </div>
                                </UCard>
                            </div>
                        </div>


                    </template>
                </UTabs>
            </div>

            <div v-else class="text-center py-20 text-muted">
                Talaba topilmadi
            </div>

            <!-- Edit Student Modal -->
            <StudentsEditStudentModal v-model:open="editDialog" :student="editingStudent" @updated="loadStudentData" />

            <!-- Add Group Modal -->
            <UModal v-model:open="addGroupDialog" :ui="{ width: 'sm:max-w-[425px]' }">
                <template #header>
                    <h3 class="text-lg font-semibold">Guruhga qo'shish</h3>
                </template>

                <template #body>
                    <div class="space-y-4">
                        <UFormField label="O'qituvchi" required>
                            <USelectMenu v-model="selectedTeacherId" :items="teacherOptions" value-key="value"
                                :loading="isLoadingTeachers" placeholder="O'qituvchini tanlang" searchable
                                icon="i-lucide-user" class="w-full">
                                <template #label>
                                    <span>{{teacherOptions.find((t) => t.value === selectedTeacherId)?.label ||
                                        `O'qituvchini tanlang` }}</span>
                                </template>
                            </USelectMenu>
                        </UFormField>

                        <UFormField label="Guruh" required>
                            <USelectMenu v-model="selectedGroupId" :items="groupOptions" value-key="value"
                                :loading="isLoadingGroups" :disabled="!selectedTeacherId" placeholder="Guruhni tanlang"
                                searchable icon="i-lucide-layers" class="w-full">
                                <template #label>
                                    <span>{{groupOptions.find((g) => g.value === selectedGroupId)?.label || `Guruhni
                                        tanlang` }}</span>
                                </template>
                            </USelectMenu>
                        </UFormField>

                        <UFormField label="Qo'shilgan sana" required>
                            <UInput v-model="enrollmentDate" type="date" icon="i-lucide-calendar" class="w-full" />
                        </UFormField>

                        <UFormField label="Holat">
                            <USelectMenu v-model="enrollmentStatus" :items="enrollmentStatusOptions" class="w-full" />
                        </UFormField>
                    </div>
                </template>

                <template #footer>
                    <div class="flex justify-end gap-3">
                        <UButton color="neutral" variant="subtle" label="Bekor qilish"
                            @click="addGroupDialog = false" />
                        <UButton :label="isAddingToGroup ? 'Qo\'shilmoqda...' : 'Qo\'shish'" :loading="isAddingToGroup"
                            :disabled="!selectedGroupId || !enrollmentDate" @click="addToGroup" />
                    </div>
                </template>
            </UModal>

            <!-- Add Payment Modal -->
            <UModal v-model:open="addPaymentDialog" :ui="{ width: 'sm:max-w-[425px]' }">
                <template #header>
                    <h3 class="text-lg font-semibold">To'lov qo'shish</h3>
                </template>

                <template #body>
                    <div class="space-y-4">
                        <UFormField label="Summa" required>
                            <UInput v-model="newPayment.amount" type="number" placeholder="Summani kiriting"
                                icon="i-lucide-banknote" class="w-full" />
                        </UFormField>

                        <UFormField label="To'lov usuli" required>
                            <USelectMenu v-model="newPayment.payment_method" :items="paymentMethodOptions"
                                placeholder="To'lov usulini tanlang" icon="i-lucide-wallet" class="w-full" />
                        </UFormField>

                        <UFormField label="To'lov sanasi" required>
                            <UInput v-model="newPayment.payment_date" type="date" icon="i-lucide-calendar"
                                class="w-full" />
                        </UFormField>

                        <UFormField label="Keyingi to'lov sanasi">
                            <UInput v-model="newPayment.next_payment_date" type="date" icon="i-lucide-calendar"
                                class="w-full" />
                        </UFormField>

                        <UFormField label="Izoh">
                            <UInput v-model="newPayment.notes" placeholder="Izoh..." icon="i-lucide-text"
                                class="w-full" />
                        </UFormField>
                    </div>
                </template>

                <template #footer>
                    <div class="flex justify-end gap-3">
                        <UButton color="neutral" variant="subtle" label="Bekor qilish"
                            @click="addPaymentDialog = false" />
                        <UButton :label="isAddingPayment ? 'Qo\'shilmoqda...' : 'Qo\'shish'" :loading="isAddingPayment"
                            :disabled="!newPayment.amount || !newPayment.payment_method || !newPayment.payment_date"
                            @click="addPayment" />
                    </div>
                </template>
            </UModal>

            <!-- Add Parent Modal -->
            <UModal v-model:open="addParentDialog" :ui="{ width: 'sm:max-w-[425px]' }">
                <template #header>
                    <h3 class="text-lg font-semibold">Ota-ona qo'shish</h3>
                </template>

                <template #body>
                    <div class="space-y-4">
                        <UFormField label="To'liq ism" required>
                            <UInput v-model="newParent.full_name" placeholder="To'liq ismini kiriting" class="w-full" />
                        </UFormField>

                        <UFormField label="Telefon raqam" required>
                            <UInput v-model="newParent.phone_number" placeholder="+998 xx xxx xx xx" class="w-full" />
                        </UFormField>

                        <UFormField label="Qo'shimcha raqam">
                            <UInput v-model="newParent.additional_number" placeholder="+998 xx xxx xx xx"
                                class="w-full" />
                        </UFormField>
                    </div>
                </template>

                <template #footer>
                    <div class="flex justify-end gap-3">
                        <UButton color="neutral" variant="subtle" label="Bekor qilish"
                            @click="addParentDialog = false" />
                        <UButton :label="isAddingParent ? 'Qo\'shilmoqda...' : 'Qo\'shish'" :loading="isAddingParent"
                            @click="addParent" />
                    </div>
                </template>
            </UModal>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Student, Group, GroupStudent, StudentPayment, StudentParent, Teacher } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

definePageMeta({
    layout: "default",
    middleware: "auth",
});

const route = useRoute();
const toast = useToast();
const { apiService } = useAuth();

const studentId = computed(() => route.params.id as string);

// State
const student = ref<Student | null>(null);
const studentGroups = ref<GroupStudent[]>([]);
const studentPayments = ref<StudentPayment[]>([]);
const studentParents = ref<StudentParent[]>([]);
const isLoading = ref(true);
const isPaymentsLoading = ref(false);
const isDeleting = ref(false);
const isAddingParent = ref(false);
const deletePopoverOpen = ref(false);
const editDialog = ref(false);
const editingStudent = ref<Student | null>(null);
const addParentDialog = ref(false);
const addGroupDialog = ref(false);
const addPaymentDialog = ref(false);
const isAddingToGroup = ref(false);
const isAddingPayment = ref(false);
const isLoadingGroups = ref(false);
const activeTab = ref("groups");

// Group enrollment form
const teachers = ref<Teacher[]>([]);
const allGroups = ref<Group[]>([]);
const isLoadingTeachers = ref(false);
const selectedTeacherId = ref<string>("");
const selectedGroupId = ref<any>(null);
const enrollmentDate = ref(new Date().toISOString().split("T")[0]);
const enrollmentStatus = ref("active");

const enrollmentStatusOptions = [
    { value: "active", label: "Faol" },
    { value: "frozen", label: "Muzlatilgan" },
];

const teacherOptions = computed(() =>
    teachers.value.map((t) => ({
        value: t.user_id,
        label: `${t.first_name} ${t.last_name}`,
    })),
);

const groupOptions = computed(() => {
    if (!selectedTeacherId.value) return [];
    return allGroups.value
        .filter((g) => g.teacher_id === selectedTeacherId.value)
        .map((g) => ({
            value: g.id,
            label: `${g.name} (${g.days || ""})`,
        }));
});

// Payment form
const newPayment = ref({
    amount: 0,
    payment_method: "",
    payment_date: new Date().toISOString().split("T")[0],
    next_payment_date: "",
    notes: "",
});

const paymentMethodOptions = [
    { value: "cash", label: "Naqd" },
    { value: "card", label: "Plastik karta" },
    { value: "transfer", label: "O'tkazma" },
    { value: "click", label: "Click" },
    { value: "payme", label: "Payme" },
];

const newParent = ref({
    full_name: "",
    phone_number: "",
    additional_number: "",
});

// Tab items
const tabItems = [
    { label: "Guruhlar", value: "groups", icon: "i-lucide-layers" },
    { label: "To'lovlar", value: "payments", icon: "i-lucide-credit-card" },
    { label: "Ota ona", value: "parents", icon: "i-lucide-users" },
];

// Payment table columns
const paymentColumns: TableColumn<StudentPayment>[] = [
    {
        accessorKey: "payment_date",
        header: "Sana",
        cell: ({ row }) => formatDate(row.original.payment_date),
    },
    {
        accessorKey: "amount",
        header: "Summa",
        cell: ({ row }) => formatCurrency(row.original.amount),
    },
    {
        accessorKey: "payment_method",
        header: "To'lov usuli",
    },
    {
        accessorKey: "status",
        header: "Holat",
        cell: ({ row }) => {
            const statusMap: Record<string, { label: string; color: string }> = {
                completed: { label: "Bajarildi", color: "success" },
                pending: { label: "Kutilmoqda", color: "warning" },
                failed: { label: "Xato", color: "error" },
            };
            const s = statusMap[row.original.status] || { label: row.original.status, color: "neutral" };
            return h(resolveComponent("UBadge"), { color: s.color as any, variant: "subtle" }, () => s.label);
        },
    },
    {
        accessorKey: "next_payment_date",
        header: "Keyingi to'lov",
        cell: ({ row }) => formatDate(row.original.next_payment_date),
    },
];

// Computed
const totalBalance = computed(() => {
    const completedPayments = studentPayments.value
        .filter((p) => p.status === "completed")
        .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

    const latestPayment = completedPayments[0];
    if (!latestPayment) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextPaymentDate = new Date(latestPayment.next_payment_date);
    nextPaymentDate.setHours(0, 0, 0, 0);

    if (nextPaymentDate >= today) {
        return latestPayment.amount;
    }

    return 0;
});

// Functions
const loadStudentData = async () => {
    isLoading.value = true;
    try {
        // Load student details
        const response = await api.get<Student>(
            apiService.value,
            `/users/${studentId.value}`,
        );
        student.value = response || null;

        if (!student.value) {
            toast.add({
                title: "Xatolik",
                description: "Talaba topilmadi",
                color: "error",
            });
            return;
        }

        // Load groups, payments, and parents in parallel
        await Promise.all([
            loadStudentGroups(),
            loadStudentPayments(),
            loadStudentParents(),
        ]);
    } catch (error) {
        console.error("Failed to load student data:", error);
        toast.add({
            title: "Xatolik",
            description: "Talaba ma'lumotlarini yuklashda xatolik yuz berdi",
            color: "error",
        });
    } finally {
        isLoading.value = false;
    }
};

const loadStudentGroups = async () => {
    try {
        const response = await api.get<GroupStudent[]>(
            apiService.value,
            `/group-students/student/${studentId.value}`,
        );
        studentGroups.value = response || [];
    } catch (error) {
        console.error("Failed to load student groups:", error);
        studentGroups.value = [];
    }
};

const loadStudentPayments = async () => {
    isPaymentsLoading.value = true;
    try {
        const response = await api.get<{ data: StudentPayment[] }>(
            apiService.value,
            `/student-payments/student/${studentId.value}`,
        );
        studentPayments.value = response.data || [];
    } catch (error) {
        console.error("Failed to load student payments:", error);
        studentPayments.value = [];
    } finally {
        isPaymentsLoading.value = false;
    }
};

const loadStudentParents = async () => {
    try {
        const response = await api.get<StudentParent[]>(
            apiService.value,
            `/student-parents/student/${studentId.value}`,
        );
        studentParents.value = Array.isArray(response) ? response : [];
    } catch (error) {
        console.error("Failed to load student parents:", error);
        studentParents.value = [];
    }
};

const removeFromGroup = async (groupStudentId: string) => {
    try {
        await api.delete<void>(apiService.value, `/group-students/${groupStudentId}`);
        toast.add({
            title: "Muvaffaqiyat",
            description: "Talaba guruhdan chiqarildi",
            color: "success",
        });
        await loadStudentGroups();
    } catch (error) {
        console.error("Failed to remove from group:", error);
        toast.add({
            title: "Xatolik",
            description: "Talabani guruhdan chiqarishda xatolik",
            color: "error",
        });
    }
};

const openEditModal = () => {
    if (!student.value) return;
    editingStudent.value = { ...student.value };
    editDialog.value = true;
};

const deleteStudent = async () => {
    if (!student.value) return;
    isDeleting.value = true;
    try {
        await api.delete<void>(apiService.value, `/users/${student.value.user_id}`);
        toast.add({
            title: "Muvaffaqiyat",
            description: "Talaba muvaffaqiyatli o'chirildi",
            color: "success",
        });
        navigateTo("/students");
    } catch (error) {
        console.error("Failed to delete student:", error);
        toast.add({
            title: "Xatolik",
            description: "Talabani o'chirishda xatolik",
            color: "error",
        });
    } finally {
        isDeleting.value = false;
        deletePopoverOpen.value = false;
    }
};

// Group enrollment methods
const loadTeachers = async () => {
    isLoadingTeachers.value = true;
    try {
        const response = await api.get<{ data: Teacher[] }>(
            apiService.value,
            "/users/teachers?page=1&limit=1000",
        );
        teachers.value = response.data || [];
    } catch (error) {
        console.error("Failed to load teachers:", error);
    } finally {
        isLoadingTeachers.value = false;
    }
};

const loadAllGroups = async () => {
    isLoadingGroups.value = true;
    try {
        const response = await api.get<{ data: Group[] }>(
            apiService.value,
            "/groups?page=1&limit=1000",
        );
        allGroups.value = response.data || [];
    } catch (error) {
        console.error("Failed to load groups:", error);
        allGroups.value = [];
    } finally {
        isLoadingGroups.value = false;
    }
};

watch(() => selectedTeacherId.value, () => {
    selectedGroupId.value = null;
});

const openAddGroupModal = async () => {
    selectedTeacherId.value = "";
    selectedGroupId.value = null;
    enrollmentDate.value = new Date().toISOString().split("T")[0];
    enrollmentStatus.value = "active";
    addGroupDialog.value = true;
    await Promise.all([loadTeachers(), loadAllGroups()]);
};

const addToGroup = async () => {
    const groupId = typeof selectedGroupId.value === "object" ? selectedGroupId.value.value : selectedGroupId.value;
    if (!groupId || !enrollmentDate.value) return;

    isAddingToGroup.value = true;
    try {
        await api.post(apiService.value, "/group-students", {
            group_id: groupId,
            student_id: studentId.value,
            enrolled_at: new Date(`${enrollmentDate.value}T00:00:00Z`).toISOString(),
            status: typeof enrollmentStatus.value === "object" ? (enrollmentStatus.value as any).value : enrollmentStatus.value,
        });
        toast.add({
            title: "Muvaffaqiyat",
            description: "Talaba guruhga muvaffaqiyatli qo'shildi",
            color: "success",
        });
        addGroupDialog.value = false;
        await loadStudentGroups();
    } catch (error) {
        console.error("Failed to add to group:", error);
        toast.add({
            title: "Xatolik",
            description: "Talabani guruhga qo'shishda xatolik",
            color: "error",
        });
    } finally {
        isAddingToGroup.value = false;
    }
};

// Payment methods
const openAddPaymentModal = () => {
    newPayment.value = {
        amount: 0,
        payment_method: "",
        payment_date: new Date().toISOString().split("T")[0],
        next_payment_date: "",
        notes: "",
    };
    addPaymentDialog.value = true;
};

const addPayment = async () => {
    if (!newPayment.value.amount || !newPayment.value.payment_method || !newPayment.value.payment_date) {
        toast.add({
            title: "Xatolik",
            description: "Iltimos, barcha majburiy maydonlarni to'ldiring",
            color: "error",
        });
        return;
    }

    isAddingPayment.value = true;
    try {
        const paymentMethod = typeof newPayment.value.payment_method === "object" ? (newPayment.value.payment_method as any).value : newPayment.value.payment_method;
        await api.post(apiService.value, "/student-payments", {
            student_id: studentId.value,
            amount: Number(newPayment.value.amount),
            payment_method: paymentMethod,
            status: "completed",
            payment_date: newPayment.value.payment_date,
            next_payment_date: newPayment.value.next_payment_date || undefined,
            notes: newPayment.value.notes || undefined,
        });
        toast.add({
            title: "Muvaffaqiyat",
            description: "To'lov muvaffaqiyatli qo'shildi",
            color: "success",
        });
        addPaymentDialog.value = false;
        await loadStudentPayments();
    } catch (error) {
        console.error("Failed to add payment:", error);
        toast.add({
            title: "Xatolik",
            description: "To'lovni qo'shishda xatolik",
            color: "error",
        });
    } finally {
        isAddingPayment.value = false;
    }
};

const openAddParentModal = () => {
    newParent.value = { full_name: "", phone_number: "", additional_number: "" };
    addParentDialog.value = true;
};

const addParent = async () => {
    if (!newParent.value.full_name || !newParent.value.phone_number) {
        toast.add({
            title: "Xatolik",
            description: "Iltimos, barcha majburiy maydonlarni to'ldiring",
            color: "error",
        });
        return;
    }

    isAddingParent.value = true;
    try {
        await api.post<StudentParent>(apiService.value, "/student-parents", {
            student_id: studentId.value,
            ...newParent.value,
        });
        toast.add({
            title: "Muvaffaqiyat",
            description: "Ota-ona muvaffaqiyatli qo'shildi",
            color: "success",
        });
        addParentDialog.value = false;
        await loadStudentParents();
    } catch (error) {
        console.error("Failed to add parent:", error);
        toast.add({
            title: "Xatolik",
            description: "Ota-onani qo'shishda xatolik",
            color: "error",
        });
    } finally {
        isAddingParent.value = false;
    }
};

const deleteParent = async (parentId: string) => {
    try {
        await api.delete<void>(apiService.value, `/student-parents/${parentId}`);
        toast.add({
            title: "Muvaffaqiyat",
            description: "Ota-ona ma'lumoti o'chirildi",
            color: "success",
        });
        await loadStudentParents();
    } catch (error) {
        console.error("Failed to delete parent:", error);
        toast.add({
            title: "Xatolik",
            description: "Ota-ona ma'lumotini o'chirishda xatolik",
            color: "error",
        });
    }
};

// Helpers
const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
};

const formatDate = (dateString?: string): string => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("uz-UZ", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
};

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("uz-UZ").format(amount);
};

const getBranchName = (): string => {
    return "impulse Filliali";
};

const getGroupBalance = (groupItem: GroupStudent): number => {
    // Calculate balance from payments for this group
    const groupPayments = studentPayments.value.filter(
        (p) => p.status === "completed",
    );
    // Return a portion or total - simplified for now
    return totalBalance.value;
};

const getNextPaymentDate = (groupItem: GroupStudent): string | null => {
    const payment = studentPayments.value.find(
        (p) => p.next_payment_date,
    );
    return payment ? formatDate(payment.next_payment_date) : null;
};

const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        toast.add({
            title: "Nusxalandi",
            description: `"${text}" nusxalandi`,
            color: "success",
        });
    } catch {
        // fallback
    }
};

// Initialize
onMounted(() => {
    loadStudentData();
});
</script>
