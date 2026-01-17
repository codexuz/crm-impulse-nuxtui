<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const { apiService } = useAuth();
const toast = useToast();

interface Props {
  teachers: any[];
  groups: any[];
  groupStudents: Record<string, any[]>;
  statusFormOptions: any[];
}

const props = defineProps<Props>();
const emit = defineEmits(["submit", "loadGroupStudents"]);

const isSubmitting = ref(false);
const loadingStudents = ref(false);

const formData = ref({
  teacher_id: "",
  group_id: "",
  student_id: "",
  status: "present" as "present" | "absent",
  date: new Date().toISOString().split("T")[0],
  note: "",
});

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

watch(
  () => formData.value.teacher_id,
  () => {
    formData.value.group_id = "";
    formData.value.student_id = "";
  },
);

watch(
  () => formData.value.group_id,
  async (newGroupId) => {
    formData.value.student_id = "";
    if (newGroupId) {
      emit("loadGroupStudents", newGroupId);
    }
  },
);

const createAttendance = async (close: () => void) => {
  isSubmitting.value = true;

  try {
    await api.post(apiService.value, "/attendance", formData.value);
    toast.add({
      title: "Muvaffaqiyat",
      description: "Davomat yozuvi yaratildi",
      color: "success",
    });

    emit("submit");
    resetForm();
    close();
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

const resetForm = () => {
  formData.value = {
    teacher_id: "",
    group_id: "",
    student_id: "",
    status: "present",
    date: new Date().toISOString().split("T")[0],
    note: "",
  };
};
</script>

<template>
  <UModal
    :ui="{
      width: 'sm:max-w-3xl',
      rounded: 'rounded-xl',
      padding: 'p-0',
    }"
  >
    <UButton
      icon="i-heroicons-plus"
      label="Davomatni qayd qilish"
      size="lg"
      color="primary"
    />

    <template #body="{ close }">

      <!-- Form Content -->
      <form @submit.prevent="createAttendance(close)" class="px-6 py-6">
        <div class="space-y-6">
          <!-- Section: Ma'lumotlarni tanlash -->
          <div class="space-y-4">
            <div class="flex items-center gap-2 mb-4">
              <UIcon
                name="i-heroicons-users"
                class="w-5 h-5 text-primary-500"
              />
              <h4
                class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide"
              >
                Ma'lumotlarni tanlash
              </h4>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Teacher Select -->
              <UFormGroup
                label="O'qituvchi"
                required
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
                required
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
                  icon="i-heroicons-user-group"
                  size="lg"
                  :disabled="!formData.teacher_id"
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
            </div>

            <!-- Student Select -->
            <UFormGroup
              label="Talaba"
              required
              :ui="{
                label: { base: 'font-medium text-gray-700 dark:text-gray-300' },
              }"
            >
              <USelectMenu
                v-model="formData.student_id"
                :items="studentOptions"
                value-key="value"
                placeholder="Talabani tanlang"
                searchable
                icon="i-heroicons-academic-cap"
                size="lg"
                :disabled="!formData.group_id"
                :loading="loadingStudents"
              >
                <template #label>
                  {{
                    studentOptions.find((s) => s.value === formData.student_id)
                      ?.label || "Talabani tanlang"
                  }}
                </template>
              </USelectMenu>
            </UFormGroup>
          </div>

          <UDivider class="my-6" />

          <!-- Section: Davomat ma'lumotlari -->
          <div class="space-y-4">
            <div class="flex items-center gap-2 mb-4">
              <UIcon
                name="i-heroicons-clipboard-document-check"
                class="w-5 h-5 text-primary-500"
              />
              <h4
                class="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide"
              >
                Davomat ma'lumotlari
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
            <UIcon
              name="i-heroicons-information-circle"
              class="inline w-4 h-4"
            />
            Barcha majburiy maydonlarni to'ldiring
          </p>
          <div class="flex gap-3">
            <UButton
              color="gray"
              variant="ghost"
              label="Bekor qilish"
              size="lg"
              @click="close"
              :disabled="isSubmitting"
            />
            <UButton
              color="primary"
              label="Yaratish"
              icon="i-heroicons-check"
              size="lg"
              :loading="isSubmitting"
              @click="createAttendance(close)"
            />
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
