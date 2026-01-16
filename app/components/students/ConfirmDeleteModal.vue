<script setup lang="ts">
import type { Student } from "~/types";

const props = defineProps<{
  student: Student | null;
  isDeleting?: boolean;
  open?: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
  "update:open": [value: boolean];
}>();
</script>

<template>
  <UModal
    v-if="student"
    :open="open"
    @update:open="emit('update:open', $event)"
    :dismissible="!isDeleting"
    :ui="{ footer: 'justify-end' }"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20"
        >
          <UIcon
            name="i-lucide-alert-triangle"
            class="w-5 h-5 text-red-600 dark:text-red-400"
          />
        </div>
        <div>
          <h3 class="text-lg font-semibold">Ishonchingiz komilmi?</h3>
        </div>
      </div>
    </template>

    <template #body>
      <p class="text-sm text-gray-500">
        Bu amalni bekor qilib bo'lmaydi. Bu talabaning hisobini butunlay
        o'chiradi va barcha bog'langan ma'lumotlarni olib tashlaydi.
      </p>
    </template>

    <template #footer="{ close }">
      <UButton
        color="neutral"
        variant="outline"
        label="Bekor qilish"
        :disabled="isDeleting"
        @click="close"
      />
      <UButton
        color="error"
        label="O'chirish"
        :loading="isDeleting"
        :disabled="isDeleting"
        @click="
          emit('confirm');
          close();
        "
      />
    </template>
  </UModal>
</template>
