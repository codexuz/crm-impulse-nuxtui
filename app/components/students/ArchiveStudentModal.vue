<script setup lang="ts">
import type { Student } from "~/types";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const open = defineModel<boolean>("open");

const props = defineProps<{
    student: Student | null;
}>();

const emit = defineEmits<{
    archived: [];
}>();

const { apiService } = useAuth();
const toast = useToast();

const isSubmitting = ref(false);
const selectedReason = ref("");
const notes = ref("");

const reasonOptions = [
    {
        label: "Kursni muvaffaqiyatli tugatdi",
        value: "Kursni muvaffaqiyatli tugatdi",
    },
    { label: "Narxning qimmatligi", value: "Narxning qimmatligi" },
    {
        label: "Dars o'tilish usuli yoqmaganligi",
        value: "Dars o'tilish usuli yoqmaganligi",
    },
    {
        label: "Guruhdagi muhit (guruh o'quvchilari)",
        value: "Guruhdagi muhit (guruh o'quvchilari)",
    },
    {
        label: "Guruh darajasi to'g'ri kelmaganligi",
        value: "Guruh darajasi to'g'ri kelmaganligi",
    },
    {
        label: "Ustozning tashqi ko'rishni va munosabati",
        value: "Ustozning tashqi ko'rishni va munosabati",
    },
    {
        label: "Markazning joylashuvi noqulayligi",
        value: "Markazning joylashuvi noqulayligi",
    },
    {
        label: "O'quvchining shaxsiy muammolari tufayli (sog'ligi yoki boshqa)",
        value: "O'quvchining shaxsiy muammolari tufayli (sog'ligi yoki boshqa)",
    },
    { label: "Boshqa", value: "Boshqa" },
];

// Reset form when modal opens
watch(open, (val) => {
    if (val) {
        selectedReason.value = "";
        notes.value = "";
    }
});

const handleSubmit = async () => {
    if (!props.student?.user_id || !selectedReason.value) return;

    isSubmitting.value = true;
    try {
        await api.post(apiService.value, "/users/archived-students", {
            user_id: props.student.user_id,
            reason: selectedReason.value,
            notes: notes.value,
        });

        toast.add({
            title: "Muvaffaqiyat",
            description: "Talaba muvaffaqiyatli faolsizlantirildi",
            color: "success",
        });

        open.value = false;
        emit("archived");
    } catch (error: any) {
        console.error("Failed to archive student:", error);
        toast.add({
            title: "Xatolik",
            description:
                error.message ||
                "Talabani faolsizlantirishda xatolik. Iltimos, qayta urinib ko'ring.",
            color: "error",
        });
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <UModal v-model:open="open" title="Talabani faolsizlantirish" description="Faolsizlantirish sababini tanlang"
        :ui="{ content: 'w-[calc(100vw-2rem)] max-w-xl' }">
        <template #body>
            <form @submit.prevent="handleSubmit" class="space-y-6">
                <div v-if="student" class="space-y-4">
                    <!-- Student info -->
                    <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div class="text-sm text-gray-500 dark:text-gray-400">Talaba</div>
                        <div class="text-base font-medium text-gray-900 dark:text-white mt-1">
                            {{ student.first_name }} {{ student.last_name }}
                        </div>
                    </div>

                    <!-- Reason select -->
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Sabab <span class="text-red-500">*</span>
                        </label>
                        <USelectMenu v-model="selectedReason" :items="reasonOptions" value-key="value"
                            placeholder="Sababni tanlang" size="lg" icon="i-lucide-message-circle-warning">
                            <template #item="{ item }">
                                <span class="whitespace-normal wrap-break-words leading-snug">{{ item.label }}</span>
                            </template>
                            <template #label>
                                <span v-if="selectedReason" class="whitespace-normal wrap-break-words leading-snug">{{
                                    reasonOptions.find(r => r.value === selectedReason)?.label }}</span>
                                <span v-else class="text-muted">Sababni tanlang</span>
                            </template>
                        </USelectMenu>
                    </div>

                    <!-- Notes textarea -->
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Izoh
                        </label>
                        <UTextarea v-model="notes" placeholder="Qo'shimcha izoh yozing..." :rows="4" class="w-full"/>
                    </div>
                </div>
            </form>
        </template>

        <template #footer="{ close }">
            <div class="flex justify-end gap-2">
                <UButton type="button" color="neutral" variant="outline" label="Bekor qilish" @click="close"
                    :disabled="isSubmitting" />
                <UButton type="button" color="error" label="Faolsizlantirish" icon="i-lucide-user-x"
                    :loading="isSubmitting" :disabled="!selectedReason" @click="handleSubmit" />
            </div>
        </template>
    </UModal>
</template>
