<template>
  <UModal v-model:open="isOpen">
    <template #content="{ close }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">Talaba ma'lumotlari</h3>
              <p class="text-sm text-gray-500 mt-1">
                Talaba haqida to'liq ma'lumot
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

        <div v-if="student" class="space-y-6">
          <!-- Student Profile -->
          <div class="flex items-center gap-4 pb-6 border-b border-gray-200">
            <UAvatar
              :alt="`${student.first_name} ${student.last_name}`"
              size="xl"
            >
              <template #fallback>
                {{ getInitials(student.first_name, student.last_name) }}
              </template>
            </UAvatar>
            <div>
              <h3 class="text-lg font-semibold">
                {{ student.first_name }} {{ student.last_name }}
              </h3>
              <p class="text-sm text-gray-500">@{{ student.username }}</p>
            </div>
          </div>

          <!-- Contact Information -->
          <div class="pb-6 border-b border-gray-200">
            <h4 class="text-sm font-medium mb-3 flex items-center gap-2">
              <UIcon name="i-lucide-contact" class="h-4 w-4" />
              Aloqa ma'lumotlari
            </h4>
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-lucide-phone" class="h-4 w-4 text-gray-400" />
                <span class="text-gray-600">Telefon:</span>
                <span class="font-medium">{{ student.phone || "N/A" }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-lucide-user" class="h-4 w-4 text-gray-400" />
                <span class="text-gray-600">Username:</span>
                <span class="font-medium">@{{ student.username }}</span>
              </div>
            </div>
          </div>

          <!-- Group Information -->
          <div v-if="groupStudent">
            <h4 class="text-sm font-medium mb-3 flex items-center gap-2">
              <UIcon name="i-lucide-users" class="h-4 w-4" />
              Guruh ma'lumotlari
            </h4>
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm">
                <UIcon
                  name="i-lucide-check-circle"
                  class="h-4 w-4 text-gray-400"
                />
                <span class="text-gray-600">Holat:</span>
                <UBadge
                  :color="getStatusColor(groupStudent.status)"
                  variant="subtle"
                >
                  {{ getStatusLabel(groupStudent.status) }}
                </UBadge>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-lucide-calendar" class="h-4 w-4 text-gray-400" />
                <span class="text-gray-600">Ro'yxatdan o'tgan:</span>
                <span class="font-medium">{{
                  formatDate(groupStudent.enrolled_at)
                }}</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-lucide-clock" class="h-4 w-4 text-gray-400" />
                <span class="text-gray-600">Yaratilgan:</span>
                <span class="font-medium">{{
                  formatDate(groupStudent.createdAt)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton color="neutral" variant="outline" @click="close">
              Yopish
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Student } from "~/types";

defineProps<{
  open: boolean;
  student: Student | null;
  groupStudent: any | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const isOpen = defineModel<boolean>("open");

// Methods
const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("uz-UZ");
};

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: "Faol",
    removed: "O'chirilgan",
    completed: "Tugatgan",
    frozen: "Muzlatilgan",
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    active: "green",
    removed: "red",
    completed: "blue",
    frozen: "gray",
  };
  return colorMap[status] || "gray";
};
</script>
