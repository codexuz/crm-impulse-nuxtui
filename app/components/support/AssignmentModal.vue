<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import type { SupportAssignment, Group, Teacher } from "~/types";

const { apiService } = useAuth();
const toast = useToast();

interface Props {
  supportTeachers: Teacher[];
  groups: Group[];
  teachers?: Teacher[];
  assignment?: SupportAssignment | null;
}

const props = withDefaults(defineProps<Props>(), {
  assignment: null,
  teachers: () => [],
});
const emit = defineEmits(["submit"]);

const isEdit = computed(() => !!props.assignment);
const isSubmitting = ref(false);

const dayOptions = [
  { value: "odd", label: "Toq kunlar (Dushanba, Chorshanba, Juma)" },
  { value: "even", label: "Juft kunlar (Seshanba, Payshanba, Shanba)" },
  { value: "every_day", label: "Har kuni" },
  { value: "other_day", label: "Boshqa kunlar" },
];

const emptyForm = () => ({
  support_teacher_id: "",
  teacher_id: "",
  group_id: "",
  days: "" as string,
  start_time: "",
  end_time: "",
  start_date: "",
  end_date: "",
  is_active: true,
  notes: "",
});

const formData = ref(emptyForm());

const hydrate = () => {
  if (props.assignment) {
    const a = props.assignment;
    formData.value = {
      support_teacher_id: a.support_teacher_id,
      teacher_id: a.teacher_id || "",
      group_id: a.group_id,
      days: a.days || "",
      start_time: (a.start_time || "").slice(0, 5),
      end_time: (a.end_time || "").slice(0, 5),
      start_date: a.start_date || "",
      end_date: a.end_date || "",
      is_active: a.is_active ?? true,
      notes: a.notes || "",
    };
  } else {
    formData.value = emptyForm();
  }
};

watch(() => props.assignment, hydrate, { immediate: true });

const teacherOptions = computed(() =>
  props.supportTeachers.map((t) => ({
    value: t.user_id,
    label: `${t.first_name} ${t.last_name}`,
  })),
);

// Main teachers that actually have at least one group. Selecting one is saved
// as teacher_id AND narrows the group dropdown to that teacher's groups.
const mainTeacherOptions = computed(() => {
  const teacherIdsWithGroups = new Set(
    props.groups.map((g) => g.teacher_id).filter(Boolean),
  );
  return props.teachers
    .filter((t) => teacherIdsWithGroups.has(t.user_id))
    .map((t) => ({
      value: t.user_id,
      label: `${t.first_name} ${t.last_name}`,
    }));
});

const mainTeacherLabel = computed(
  () =>
    mainTeacherOptions.value.find((t) => t.value === formData.value.teacher_id)
      ?.label || "O'qituvchini tanlang",
);

const groupOptions = computed(() =>
  props.groups
    .filter(
      (g) => !formData.value.teacher_id || g.teacher_id === formData.value.teacher_id,
    )
    .map((g) => ({ value: g.id, label: g.name })),
);

// Changing the main teacher: clear the selected group if it no longer matches
watch(
  () => formData.value.teacher_id,
  () => {
    if (
      formData.value.group_id &&
      !groupOptions.value.some((g) => g.value === formData.value.group_id)
    ) {
      formData.value.group_id = "";
    }
  },
);

// Selecting a group with no main teacher set yet → default teacher_id to the
// group's own teacher so the assignment records who it covers.
watch(
  () => formData.value.group_id,
  (groupId) => {
    if (!groupId || formData.value.teacher_id) return;
    const group = props.groups.find((g) => g.id === groupId);
    if (group?.teacher_id) formData.value.teacher_id = group.teacher_id;
  },
);

const dayLabel = computed(
  () =>
    dayOptions.find((d) => d.value === formData.value.days)?.label ||
    "Dars kunlarini tanlang",
);

const submit = async (close: () => void) => {
  if (!formData.value.support_teacher_id || !formData.value.group_id) {
    toast.add({
      title: "Xatolik",
      description: "Support o'qituvchi va guruhni tanlang",
      color: "error",
    });
    return;
  }

  isSubmitting.value = true;
  try {
    // Drop empty optional fields so the API gets clean payloads
    const payload: Record<string, any> = {
      support_teacher_id: formData.value.support_teacher_id,
      group_id: formData.value.group_id,
      is_active: formData.value.is_active,
    };
    if (formData.value.teacher_id) payload.teacher_id = formData.value.teacher_id;
    if (formData.value.days) payload.days = formData.value.days;
    if (formData.value.start_time)
      payload.start_time = formData.value.start_time.slice(0, 5);
    if (formData.value.end_time)
      payload.end_time = formData.value.end_time.slice(0, 5);
    if (formData.value.start_date) payload.start_date = formData.value.start_date;
    if (formData.value.end_date) payload.end_date = formData.value.end_date;
    if (formData.value.notes) payload.notes = formData.value.notes;

    if (isEdit.value) {
      await api.patch(
        apiService.value,
        `/support-assignments/${props.assignment!.id}`,
        payload,
      );
    } else {
      await api.post(apiService.value, "/support-assignments", payload);
    }

    toast.add({
      title: "Muvaffaqiyat",
      description: isEdit.value
        ? "Biriktirish yangilandi"
        : "Support o'qituvchi guruhga biriktirildi",
      color: "success",
    });
    emit("submit");
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
</script>

<template>
  <UModal
    :title="isEdit ? 'Biriktirishni tahrirlash' : 'Support o\'qituvchi biriktirish'"
    description="Support o'qituvchini guruhga kunlar va vaqt bilan biriktiring"
    :close="{
      color: 'neutral',
      variant: 'ghost',
      class: 'rounded-full',
    }"
    :ui="{ width: 'sm:max-w-2xl', footer: 'justify-end' }"
  >
    <slot>
      <UButton icon="i-lucide-plus" label="Biriktirish" color="primary" />
    </slot>

    <template #body="{ close }">
      <form @submit.prevent="submit(close)" class="space-y-6">
        <!-- Assignment Section -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
            <UIcon name="i-lucide-life-buoy" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Biriktirish ma'lumotlari
            </h3>
          </div>

          <UFormField label="Support o'qituvchi" required>
            <USelectMenu
              v-model="formData.support_teacher_id"
              :items="teacherOptions"
              value-key="value"
              placeholder="Support o'qituvchini tanlang"
              searchable
              icon="i-lucide-user"
              class="w-full"
            >
              <template #label>
                {{
                  teacherOptions.find((t) => t.value === formData.support_teacher_id)
                    ?.label || "Support o'qituvchini tanlang"
                }}
              </template>
            </USelectMenu>
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField
              label="O'qituvchi"
              help="Guruhning asosiy o'qituvchisi (guruhlarni ham filtrlaydi)"
            >
              <USelectMenu
                v-model="formData.teacher_id"
                :items="mainTeacherOptions"
                value-key="value"
                placeholder="O'qituvchini tanlang"
                searchable
                icon="i-lucide-user-check"
                class="w-full"
              >
                <template #label>{{ mainTeacherLabel }}</template>
              </USelectMenu>
            </UFormField>

            <UFormField label="Guruh" required>
              <USelectMenu
                v-model="formData.group_id"
                :items="groupOptions"
                value-key="value"
                placeholder="Guruhni tanlang"
                searchable
                icon="i-lucide-users-2"
                class="w-full"
              >
                <template #label>
                  {{
                    groupOptions.find((g) => g.value === formData.group_id)
                      ?.label || "Guruhni tanlang"
                  }}
                </template>
              </USelectMenu>
            </UFormField>
          </div>
        </div>

        <!-- Schedule Section -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
            <UIcon name="i-lucide-calendar-clock" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Dars jadvali
            </h3>
          </div>

          <UFormField label="Kunlar">
            <USelectMenu
              v-model="formData.days"
              :items="dayOptions"
              value-key="value"
              placeholder="Dars kunlarini tanlang"
              icon="i-lucide-calendar"
              class="w-full"
            >
              <template #label>{{ dayLabel }}</template>
            </USelectMenu>
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Boshlanish vaqti">
              <UInput
                v-model="formData.start_time"
                type="time"
                icon="i-lucide-clock"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Tugash vaqti">
              <UInput
                v-model="formData.end_time"
                type="time"
                icon="i-lucide-clock"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Boshlanish sanasi">
              <UInput v-model="formData.start_date" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Tugash sanasi">
              <UInput v-model="formData.end_date" type="date" class="w-full" />
            </UFormField>
          </div>
        </div>

        <!-- Additional Section -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
            <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Qo'shimcha ma'lumotlar
            </h3>
          </div>

          <UFormField label="Izoh">
            <UTextarea
              v-model="formData.notes"
              placeholder="Ixtiyoriy izoh..."
              :rows="3"
              class="w-full"
            />
          </UFormField>

          <UCheckbox v-model="formData.is_active" label="Faol" />
        </div>

        <!-- Footer Buttons -->
        <div class="flex justify-end gap-2 pt-4">
          <UButton
            type="button"
            color="neutral"
            variant="subtle"
            label="Bekor qilish"
            @click="close"
          />
          <UButton
            type="submit"
            color="primary"
            :label="
              isSubmitting
                ? 'Saqlanmoqda...'
                : isEdit
                  ? 'Saqlash'
                  : 'Biriktirish'
            "
            :loading="isSubmitting"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
