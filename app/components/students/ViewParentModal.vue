<script setup lang="ts">
import type { StudentParent } from "~/types";

const open = defineModel<boolean>("open");

const props = defineProps<{
  parent: StudentParent | null;
}>();

const emit = defineEmits<{
  edit: [parent: StudentParent];
}>();

const formatDate = (dateString?: string): string => {
  if (!dateString) return "Mavjud emas";
  return new Date(dateString).toLocaleDateString();
};
</script>

<template>
  <UModal
    v-model:open="open"
    title="Ota-ona ma'lumotlari"
    description="Ota-ona haqida batafsil ma'lumot"
    :ui="{ content: 'w-[calc(100vw-2rem)] max-w-2xl', footer: 'justify-end' }"
  >
    <template #body>
      <div v-if="parent" class="space-y-6">
        <div class="flex items-center gap-4">
          <UAvatar :alt="parent.full_name" size="lg">
            <template #fallback>
              <span class="text-lg">
                {{ parent.full_name.charAt(0).toUpperCase() }}
              </span>
            </template>
          </UAvatar>
          <div class="flex-1">
            <h3 class="text-lg font-semibold">
              {{ parent.full_name }}
            </h3>
            <p class="text-gray-500">{{ parent.phone_number }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium text-sm mb-2">Aloqa ma'lumotlari</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">Telefon:</span>
                <span>{{ parent.phone_number }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Qo'shimcha raqam:</span>
                <span>{{ parent.additional_number || "Yo'q" }}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 class="font-medium text-sm mb-2">Talaba ma'lumotlari</h4>
            <div class="space-y-2 text-sm">
              <div v-if="parent.student" class="flex justify-between">
                <span class="text-gray-500">Talaba:</span>
                <span>
                  {{ parent.student.first_name }}
                  {{ parent.student.last_name }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Yaratilgan:</span>
                <span>{{ formatDate(parent.created_at) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Yangilangan:</span>
                <span>{{ formatDate(parent.updated_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <UButton
        color="neutral"
        variant="outline"
        label="Yopish"
        @click="close"
      />
      <UButton
        v-if="parent"
        label="Tahrirlash"
        icon="i-lucide-pencil"
        @click="
          emit('edit', parent);
          close();
        "
      />
    </template>
  </UModal>
</template>
