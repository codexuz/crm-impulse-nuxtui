<script setup lang="ts">
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
}

const open = defineModel<boolean>("open");

const props = defineProps<{
  lead: Lead | null;
  statusOptions: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  updated: [];
}>();

const { apiService } = useAuth();
const toast = useToast();

const isSubmitting = ref(false);
const selectedStatus = ref("");

// Computed options without "all" option
const statusOptionsFiltered = computed(() =>
  props.statusOptions.filter((opt) => opt.value !== ""),
);

// Watch for lead changes to set initial status
watch(
  () => props.lead,
  (newLead) => {
    if (newLead) {
      selectedStatus.value = newLead.status;
    }
  },
  { immediate: true },
);

const handleSubmit = async () => {
  if (!props.lead?.id || !selectedStatus.value) return;

  isSubmitting.value = true;
  try {
    await api.patch(apiService.value, `/leads/${props.lead.id}`, {
      status: selectedStatus.value,
    });

    toast.add({
      title: "Muvaffaqiyatli",
      description: "Lead holati o'zgartirildi",
      color: "success",
    });

    open.value = false;
    emit("updated");
  } catch (error: any) {
    console.error("Failed to change status:", error);
    toast.add({
      title: "Xatolik",
      description: error.message || "Holatni o'zgartirishda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <UModal
    v-model:open="open"
    title="Lead holatini o'zgartirish"
    description="Lead holatini tanlang"
    :ui="{ content: 'w-[calc(100vw-2rem)] max-w-md' }"
  >
    <template #body>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div v-if="lead" class="space-y-4">
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="text-sm text-gray-500 dark:text-gray-400">Lead</div>
            <div
              class="text-base font-medium text-gray-900 dark:text-white mt-1"
            >
              {{ lead.first_name }} {{ lead.last_name }}
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Yangi holat
            </label>
            <USelectMenu
              v-model="selectedStatus"
              :items="statusOptionsFiltered"
              value-key="value"
              placeholder="Holatni tanlang"
              size="lg"
              icon="i-lucide-flag"
            />
          </div>
        </div>
      </form>
    </template>

    <template #footer="{ close }">
      <div class="flex justify-end gap-2">
        <UButton
          type="button"
          color="neutral"
          variant="outline"
          label="Bekor qilish"
          @click="close"
          :disabled="isSubmitting"
        />
        <UButton
          type="button"
          label="Saqlash"
          icon="i-lucide-save"
          :loading="isSubmitting"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
