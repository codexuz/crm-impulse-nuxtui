<script setup lang="ts">
import type { Student } from "~/types";

const open = defineModel<boolean>("open");

const props = defineProps<{
  student: Student | null;
  studentGroups: any[];
}>();

const emit = defineEmits<{
  edit: [student: Student];
}>();

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return "Mavjud emas";
  return new Date(dateString).toLocaleDateString();
};

const getStudentCourse = (student: Student | null) => {
  if (!student) return null;
  return (student as any).level || null;
};
</script>

<template>
  <UModal
    v-model:open="open"
    title="Talaba ma'lumotlari"
    description="Talaba haqida batafsil ma'lumot"
    :ui="{ content: 'w-[calc(100vw-2rem)] max-w-2xl', footer: 'justify-end' }"
  >
    <template #body>
      <div v-if="student" class="space-y-6">
        <div class="flex items-center gap-4">
          <UAvatar
            :alt="`${student.first_name} ${student.last_name}`"
            size="lg"
          >
            <template #fallback>
              <span class="text-lg">
                {{ getInitials(student.first_name, student.last_name) }}
              </span>
            </template>
          </UAvatar>
          <div class="flex-1">
            <h3 class="text-lg font-semibold">
              {{ student.first_name }} {{ student.last_name }}
            </h3>
            <p class="text-gray-500">{{ student.username }}</p>
          </div>
          <UBadge :color="student.is_active ? 'success' : 'neutral'">
            {{ student.is_active ? "Faol" : "Nofaol" }}
          </UBadge>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium text-sm mb-2">Aloqa ma'lumotlari</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">Telefon:</span>
                <span>{{ student.phone }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Kurs:</span>
                <span>
                  <UBadge v-if="getStudentCourse(student)" variant="subtle">
                    {{ getStudentCourse(student)?.title }}
                  </UBadge>
                  <span v-else class="text-gray-400">Yo'q</span>
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 class="font-medium text-sm mb-2">Tizim ma'lumotlari</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">ID:</span>
                <span class="text-xs font-mono">{{ student.user_id }}</span>
              </div>
              <div class="flex justify-between items-start">
                <span class="text-gray-500">Rollar:</span>
                <div class="flex gap-1 flex-wrap">
                  <UBadge
                    v-for="(role, idx) in student.roles"
                    :key="idx"
                    variant="subtle"
                    size="xs"
                  >
                    {{ typeof role === "string" ? role : role.name }}
                  </UBadge>
                </div>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Yaratilgan:</span>
                <span>{{ formatDate(student.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 class="font-medium text-sm mb-3">Profil statistikasi</h4>
          <div class="grid grid-cols-3 gap-4">
            <UCard>
              <div class="text-sm text-gray-500">Ballar</div>
              <div class="text-2xl font-semibold mt-1">
                {{ student.student_profile?.points || 0 }}
              </div>
            </UCard>
            <UCard>
              <div class="text-sm text-gray-500">Tangalar</div>
              <div class="text-2xl font-semibold mt-1">
                {{ student.student_profile?.coins || 0 }}
              </div>
            </UCard>
            <UCard>
              <div class="text-sm text-gray-500">Izchillik</div>
              <div class="text-2xl font-semibold mt-1">
                {{ student.student_profile?.streaks || 0 }} kun
              </div>
            </UCard>
          </div>
        </div>

        <div>
          <h4 class="font-medium text-sm mb-3">Yozilgan guruhlar</h4>
          <div
            v-if="studentGroups.length === 0"
            class="text-sm text-gray-500 text-center py-4"
          >
            Hech qanday guruhga yozilmagan
          </div>
          <div v-else class="space-y-2">
            <UCard v-for="groupItem in studentGroups" :key="groupItem.id">
              <div class="space-y-2">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="font-medium">
                      {{ groupItem.group?.name || "Noma'lum guruh" }}
                    </div>
                    <div class="text-xs text-gray-500 mt-1 space-y-1">
                      <div v-if="groupItem.group?.days">
                        <span class="font-medium">Kunlar:</span>
                        {{ groupItem.group.days }}
                      </div>
                      <div
                        v-if="
                          groupItem.group?.lesson_start &&
                          groupItem.group?.lesson_end
                        "
                      >
                        <span class="font-medium">Vaqt:</span>
                        {{ groupItem.group.lesson_start }} -
                        {{ groupItem.group.lesson_end }}
                      </div>
                      <div v-if="groupItem.group?.teacher">
                        <span class="font-medium">O'qituvchi:</span>
                        {{ groupItem.group.teacher.first_name }}
                        {{ groupItem.group.teacher.last_name }}
                      </div>
                      <div>
                        <span class="font-medium">Yozilgan:</span>
                        {{ formatDate(groupItem.enrolled_at) }}
                      </div>
                    </div>
                  </div>
                  <UBadge
                    :color="
                      groupItem.status === 'active' ? 'success' : 'neutral'
                    "
                  >
                    {{
                      groupItem.status === "active" ? "Faol" : groupItem.status
                    }}
                  </UBadge>
                </div>
              </div>
            </UCard>
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
        v-if="student"
        label="Tahrirlash"
        @click="
          emit('edit', student);
          close();
        "
      />
    </template>
  </UModal>
</template>
