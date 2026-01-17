<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

interface Attendance {
  id: string;
  group_id: string;
  student_id: string;
  teacher_id: string;
  status: "present" | "absent";
  note?: string;
  date: string;
}

const open = defineModel<boolean>("open");

const props = defineProps<{
  record: Attendance | null;
  teachers: any[];
  groups: any[];
  groupStudents: Record<string, any[]>;
  statusFormOptions: any[];
}>();

const emit = defineEmits(["updated"]);

const { apiService } = useAuth();
const toast = useToast();

const isSubmitting = ref(false);
const formData = ref<Partial<Attendance>>({});

const teacherOptions = computed(() => {
  return props.teachers.map((t) => ({
    value: t.user_id,
    label: `${t.first_name} ${t.last_name}`,
  }));
});

const filteredGroupOptions = computed(() => {
  if (!formData.value.teacher_id) return [];

  const filtered = props.groups.filter(
    (g) => g.teacher_id === formData.value.teacher_id,
  );
  return filtered.map((g) => ({
    value: g.id,
    label: g.name,
  }));
});

const studentOptions = computed(() => {
  if (!formData.value.group_id) return [];

  const groupStudentList = props.groupStudents[formData.value.group_id] || [];
  return groupStudentList.map((s) => ({
    value: s.user_id,
    label: `${s.first_name} ${s.last_name}`,
  }));
});

// Watch for record changes to populate form
watch(
  () => props.record,
  (newRecord) => {
    if (newRecord) {
      formData.value = {
        id: newRecord.id,
        teacher_id: newRecord.teacher_id,
        group_id: newRecord.group_id,
        student_id: newRecord.student_id,
        status: newRecord.status,
        date: newRecord.date,
        note: newRecord.note || "",
      };
    }
  },
  { immediate: true },
);

const handleSubmit = async () => {
  if (!formData.value.id) return;

  isSubmitting.value = true;

  try {
    await api.patch(apiService.value, `/attendance/${formData.value.id}`, {
      status: formData.value.status,
      date: formData.value.date,
      note: formData.value.note,
    });

    toast.add({
      title: "Muvaffaqiyat",
      description: "Davomat yozuvi yangilandi",
      color: "success",
    });

    open.value = false;
    emit("updated");
  } catch (err: any) {
    toast.add({
      title: "Xatolik",
      description: err.message || "Amal bajarilmadi",
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
    :ui="{
      width: 'sm:max-w-3xl',
      rounded: 'rounded-xl',
      padding: 'p-0',
    }"
  >
    <template #body>

      <!-- Form Content -->
      <form @submit.prevent="handleSubmit" class="px-6 py-6">
        <div class="space-y-6">
          <!-- Info Section -->
          <div
            class="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 mb-6 border border-blue-100 dark:border-blue-900"
          >
            <div class="flex items-start gap-3">
              <UIcon
                name="i-heroicons-information-circle"
                class="w-5 h-5 text-blue-500 shrink-0 mt-0.5"
              />
              <div>
                <p class="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Ma'lumot
                </p>
                <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  O'qituvchi, guruh va talaba ma'lumotlarini o'zgartirib
                  bo'lmaydi. Faqat davomat holati, sana va izohni
                  tahrirlashingiz mumkin.
                </p>
              </div>
            </div>
          </div>

          <!-- Section: Asosiy ma'lumotlar (disabled) -->
          <div class="space-y-4">
            <div class="flex items-center gap-2 mb-4">
              <UIcon
                name="i-heroicons-lock-closed"
                class="w-5 h-5 text-gray-400"
              />
              <h4
                class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
              >
                Asosiy ma'lumotlar (o'zgartirilmaydi)
              </h4>
            </div>

            <div class="grid grid-cols-1 gap-4">
              <!-- Teacher Select -->
              <UFormGroup
                label="O'qituvchi"
                :ui="{
                  label: {
                    base: 'font-medium text-gray-700 dark:text-gray-300',
                  },
                }"
              >
                <USelectMenu
                  v-model="formData.teacher_id"
                  :items="teacherOptions"
                  value-key="value"
                  placeholder="O'qituvchini tanlang"
                  searchable
                  disabled
                  icon="i-heroicons-user-circle"
                  size="lg"
                >
                  <template #label>
                    {{
                      teacherOptions.find(
                        (t) => t.value === formData.teacher_id,
                      )?.label || "O'qituvchini tanlang"
                    }}
                  </template>
                </USelectMenu>
              </UFormGroup>

              <!-- Group Select -->
              <UFormGroup
                label="Guruh"
                :ui="{
                  label: {
                    base: 'font-medium text-gray-700 dark:text-gray-300',
                  },
                }"
              >
                <USelectMenu
                  v-model="formData.group_id"
                  :items="filteredGroupOptions"
                  value-key="value"
                  placeholder="Guruhni tanlang"
                  searchable
                  disabled
                  icon="i-heroicons-user-group"
                  size="lg"
                >
                  <template #label>
                    {{
                      filteredGroupOptions.find(
                        (g) => g.value === formData.group_id,
                      )?.label || "Guruhni tanlang"
                    }}
                  </template>
                </USelectMenu>
              </UFormGroup>

              <!-- Student Select -->
              <UFormGroup
                label="Talaba"
                :ui="{
                  label: {
                    base: 'font-medium text-gray-700 dark:text-gray-300',
                  },
                }"
              >
                <USelectMenu
                  v-model="formData.student_id"
                  :items="studentOptions"
                  value-key="value"
                  placeholder="Talabani tanlang"
                  searchable
                  disabled
                  icon="i-heroicons-academic-cap"
                  size="lg"
                >
                  <template #label>
                    {{
                      studentOptions.find(
                        (s) => s.value === formData.student_id,
                      )?.label || "Talabani tanlang"
                    }}
                  </template>
                </USelectMenu>
              </UFormGroup>
            </div>
          </div>

          <UDivider class="my-6" />

          <!-- Section: Tahrirlash mumkin bo'lgan maydonlar -->
          <div class="space-y-4">
            <div class="flex items-center gap-2 mb-4">
              <UIcon
                name="i-heroicons-pencil-square"
                class="w-5 h-5 text-primary-500"
              />
              <h4
                class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide"
              >
                Tahrirlash mumkin bo'lgan maydonlar
              </h4>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Status Select -->
              <UFormGroup
                label="Holat"
                required
                :ui="{
                  label: {
                    base: 'font-medium text-gray-700 dark:text-gray-300',
                  },
                }"
              >
                <USelectMenu
                  v-model="formData.status"
                  :items="statusFormOptions"
                  value-key="value"
                  placeholder="Davomat holatini tanlang"
                  icon="i-heroicons-check-badge"
                  size="lg"
                >
                  <template #label>
                    {{
                      statusFormOptions.find((s) => s.value === formData.status)
                        ?.label || "Davomat holatini tanlang"
                    }}
                  </template>
                </USelectMenu>
              </UFormGroup>

              <!-- Date Input -->
              <UFormGroup
                label="Sana"
                required
                :ui="{
                  label: {
                    base: 'font-medium text-gray-700 dark:text-gray-300',
                  },
                }"
              >
                <UInput
                  v-model="formData.date"
                  type="date"
                  icon="i-heroicons-calendar"
                  size="lg"
                />
              </UFormGroup>
            </div>

            <!-- Note Textarea -->
            <UFormGroup
              label="Izoh (Ixtiyoriy)"
              :ui="{
                label: { base: 'font-medium text-gray-700 dark:text-gray-300' },
              }"
              help="Qo'shimcha ma'lumot yoki sabab kiriting"
            >
              <UTextarea
                v-model="formData.note"
                placeholder="Masalan: Kasallik sabab, ruxsat olgan, kech qolgan..."
                :rows="4"
                size="lg"
                class="w-full"
                :ui="{ rounded: 'rounded-lg' }"
              />
            </UFormGroup>
          </div>
        </div>
      </form>

      <!-- Footer -->
      <div
        class="sticky bottom-0 z-10 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4"
      >
        <div class="flex items-center justify-between">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            <UIcon name="i-heroicons-clock" class="inline w-4 h-4" />
            O'zgarishlar darhol saqlanadi
          </p>
          <div class="flex gap-3">
            <UButton
              color="gray"
              variant="ghost"
              label="Bekor qilish"
              size="lg"
              @click="open = false"
              :disabled="isSubmitting"
            />
            <UButton
              color="primary"
              label="Yangilash"
              icon="i-heroicons-check"
              size="lg"
              :loading="isSubmitting"
              @click="handleSubmit"
            />
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
