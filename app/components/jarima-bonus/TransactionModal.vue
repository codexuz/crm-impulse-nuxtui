<script setup lang="ts">
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import {
  useBonusPenalty,
  type BonusPenaltyType,
  type BonusPenaltyCategory,
  type BonusPenaltyUserRef,
} from "~/composables/useBonusPenalty";

const props = defineProps<{
  open: boolean;
  teachers?: BonusPenaltyUserRef[];
  categories?: BonusPenaltyCategory[];
  defaultTeacherId?: string | null;
  defaultType?: BonusPenaltyType;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  created: [];
}>();

const { apiService } = useAuth();
const { createTransaction, listCategories } = useBonusPenalty();
const toast = useToast();

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit("update:open", v),
});

const typeOptions = [
  { label: "Bonus", value: "bonus" as const },
  { label: "Jarima", value: "jarima" as const },
  { label: "Referal", value: "referal" as const },
];

const form = reactive({
  type: "bonus" as BonusPenaltyType,
  teacher_id: "" as string,
  category_id: null as string | null,
  amount: 0,
  description: "",
  student_id: null as string | null,
});

const isSubmitting = ref(false);

// Categories: use the prop when provided, otherwise self-load.
const localCategories = ref<BonusPenaltyCategory[]>([]);
const categories = computed(() => props.categories ?? localCategories.value);

// Only categories matching the chosen type (or untyped) are selectable.
const categoryOptions = computed(() => [
  { label: "Kategoriyasiz", value: null as string | null },
  ...categories.value
    .filter((c) => !c.type || c.type === form.type)
    .map((c) => ({ label: c.name, value: c.id })),
]);

const teacherOptions = computed(() =>
  (props.teachers ?? []).map((t) => ({
    label: `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() || t.username || t.user_id,
    value: t.user_id,
  })),
);

// Referral student search (only when type === referal)
const students = ref<BonusPenaltyUserRef[]>([]);
const isLoadingStudents = ref(false);
const studentSearch = ref("");

const studentOptions = computed(() =>
  students.value.map((s) => ({
    label: `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.username || s.user_id,
    value: s.user_id,
  })),
);

const searchStudents = async (query: string) => {
  if (!query || query.length < 2) {
    students.value = [];
    return;
  }
  isLoadingStudents.value = true;
  try {
    const response = await api.get<{ data: BonusPenaltyUserRef[] }>(
      apiService.value,
      `/users/students?query=${encodeURIComponent(query)}&limit=20`,
    );
    students.value = response.data || [];
  } catch (error) {
    console.error("Failed to search students:", error);
    students.value = [];
  } finally {
    isLoadingStudents.value = false;
  }
};

watch(studentSearch, (q) => searchStudents(q));

const modalTitle = computed(() =>
  form.type === "bonus"
    ? "O'qituvchiga bonus"
    : form.type === "jarima"
      ? "O'qituvchiga jarima"
      : "Referal to'lovi",
);

const resetForm = () => {
  form.type = props.defaultType ?? "bonus";
  form.teacher_id = props.defaultTeacherId ?? "";
  form.category_id = null;
  form.amount = 0;
  form.description = "";
  form.student_id = null;
  students.value = [];
  studentSearch.value = "";
};

// Reset whenever the modal is opened; lazily load categories if not provided.
watch(
  () => props.open,
  async (open) => {
    if (!open) return;
    resetForm();
    if (!props.categories) {
      try {
        localCategories.value = await listCategories();
      } catch {
        localCategories.value = [];
      }
    }
  },
);

// Clear category if it no longer matches the selected type.
watch(
  () => form.type,
  () => {
    const stillValid = categoryOptions.value.some((o) => o.value === form.category_id);
    if (!stillValid) form.category_id = null;
  },
);

const submit = async () => {
  if (!form.teacher_id) {
    toast.add({ title: "Xatolik", description: "Iltimos, o'qituvchini tanlang.", color: "error" });
    return;
  }
  if (!form.amount || form.amount <= 0) {
    toast.add({ title: "Xatolik", description: "Iltimos, to'g'ri summa kiriting.", color: "error" });
    return;
  }

  isSubmitting.value = true;
  try {
    await createTransaction({
      teacher_id: form.teacher_id,
      amount: Number(form.amount),
      type: form.type,
      category_id: form.category_id,
      student_id: form.type === "referal" ? form.student_id : null,
      description: form.description || null,
    });

    toast.add({
      title: "Muvaffaqiyat",
      description:
        form.type === "bonus"
          ? "Bonus muvaffaqiyatli berildi."
          : form.type === "jarima"
            ? "Jarima muvaffaqiyatli yozildi."
            : "Referal to'lovi qo'shildi.",
      color: "success",
    });

    isOpen.value = false;
    emit("created");
  } catch (error) {
    console.error("Failed to submit transaction:", error);
    toast.add({
      title: "Xatolik",
      description: "Amalni bajarishda xatolik yuz berdi.",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <UModal v-model:open="isOpen" :title="modalTitle">
    <template #body>
      <form @submit.prevent="submit" class="space-y-4">
        <UFormField label="Tur" name="type">
          <USelectMenu v-model="form.type" :items="typeOptions" value-key="value" class="w-full">
            <template #label>
              {{ typeOptions.find((t) => t.value === form.type)?.label }}
            </template>
          </USelectMenu>
        </UFormField>

        <UFormField label="O'qituvchi" name="teacher">
          <USelectMenu v-model="form.teacher_id" :items="teacherOptions" value-key="value"
            placeholder="O'qituvchini tanlang" searchable class="w-full" />
        </UFormField>

        <UFormField v-if="form.type === 'referal'" label="Taklif qilgan o'quvchi (ixtiyoriy)" name="student">
          <USelectMenu v-model="form.student_id" v-model:search-term="studentSearch" :items="studentOptions"
            value-key="value" :loading="isLoadingStudents" placeholder="O'quvchini qidiring..." searchable
            class="w-full" />
        </UFormField>

        <UFormField label="Kategoriya" name="category">
          <USelectMenu v-model="form.category_id" :items="categoryOptions" value-key="value"
            placeholder="Kategoriyani tanlang" class="w-full" />
        </UFormField>

        <UFormField label="Summa" name="amount">
          <UInput v-model.number="form.amount" type="number" placeholder="Summa kiriting" class="w-full" />
        </UFormField>

        <UFormField label="Izoh" name="description">
          <UTextarea v-model="form.description" placeholder="Izoh kiriting..." :rows="3" class="w-full" />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Bekor qilish" color="neutral" variant="outline" @click="isOpen = false" />
        <UButton
          :label="form.type === 'jarima' ? 'Jarima yozish' : form.type === 'bonus' ? 'Bonus berish' : 'Referal qo\'shish'"
          :color="form.type === 'jarima' ? 'error' : 'success'" :loading="isSubmitting" @click="submit" />
      </div>
    </template>
  </UModal>
</template>
