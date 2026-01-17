<template>
  <UModal v-model:open="isOpen">
    <template #content="{ close }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">
                Talaba holatini o'zgartirish
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Guruhda talabaning holatini yangilang
              </p>
            </div>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              square
              @click="close"
            />
          </div>
        </template>

        <div class="space-y-6">
          <!-- Current Student Info -->
          <div
            v-if="groupStudent?.student"
            class="pb-6 border-b border-gray-200"
          >
            <div class="flex items-center gap-3">
              <UAvatar
                :alt="`${groupStudent.student.first_name} ${groupStudent.student.last_name}`"
                size="md"
              >
                <template #fallback>
                  {{
                    getInitials(
                      groupStudent.student.first_name,
                      groupStudent.student.last_name,
                    )
                  }}
                </template>
              </UAvatar>
              <div>
                <div class="font-medium">
                  {{ groupStudent.student.first_name }}
                  {{ groupStudent.student.last_name }}
                </div>
                <div class="text-sm text-gray-500">
                  {{
                    groupStudent.student.phone || groupStudent.student.username
                  }}
                </div>
              </div>
            </div>
          </div>

          <!-- Status Selection -->
          <div>
            <div class="flex items-start gap-3 mb-4">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50"
              >
                <UIcon
                  name="i-lucide-git-branch"
                  class="h-5 w-5 text-blue-600"
                />
              </div>
              <div class="flex-1 min-w-0">
                <label class="block text-sm font-medium mb-2">
                  Yangi holat <span class="text-red-500">*</span>
                </label>
                <USelectMenu
                  v-model="newStatus"
                  :items="statusOptions"
                  value-key="value"
                  placeholder="Holatni tanlang"
                >
                  <template #label>
                    {{
                      statusOptions.find((s) => s.value === newStatus)?.label ||
                      "Holatni tanlang"
                    }}
                  </template>
                </USelectMenu>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="outline" @click="close">
              Bekor qilish
            </UButton>
            <UButton
              icon="i-lucide-check"
              :loading="isSubmitting"
              :disabled="!newStatus"
              @click="handleSubmit(close)"
            >
              {{ isSubmitting ? "Yangilanmoqda..." : "Yangilash" }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import type { GroupStudent } from "~/types";

const props = defineProps<{
  open: boolean;
  groupStudent: any | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  updated: [];
}>();

const isOpen = defineModel<boolean>("open");

const { apiService } = useAuth();
const toast = useToast();

// Form state
const newStatus = ref("");
const isSubmitting = ref(false);

// Status options
const statusOptions = [
  { value: "active", label: "Faol" },
  { value: "removed", label: "O'chirilgan" },
  { value: "completed", label: "Tugatgan" },
  { value: "frozen", label: "Muzlatilgan" },
];

// Watch for groupStudent changes to set initial status
watch(
  () => props.groupStudent,
  (newVal) => {
    if (newVal) {
      newStatus.value = newVal.status;
    }
  },
  { immediate: true },
);

// Methods
const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const handleSubmit = async (close: () => void) => {
  if (!props.groupStudent || !newStatus.value) {
    toast.add({
      title: "Xatolik",
      description: "Iltimos, holatni tanlang",
      color: "error",
    });
    return;
  }

  isSubmitting.value = true;
  try {
    await api.patch(
      apiService.value,
      `/group-students/${props.groupStudent.id}`,
      { status: newStatus.value },
    );

    toast.add({
      title: "Muvaffaqiyat",
      description: "Talaba holati muvaffaqiyatli yangilandi",
      color: "success",
    });

    emit("updated");
    close();
  } catch (error) {
    console.error("Failed to update student status:", error);
    toast.add({
      title: "Xatolik",
      description: "Talaba holatini yangilashda xatolik",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>
