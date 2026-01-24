<script setup lang="ts">
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  parent_phone_number?: string;
  parent_name?: string;
  additional_number?: string;
  status: string;
  source: string;
  question?: string;
  course_id?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const open = defineModel<boolean>("open");

const props = defineProps<{
  lead: Lead | null;
  statusOptions: Array<{ label: string; value: string }>;
  sourceOptions: Array<{ label: string; value: string }>;
  courses: any[];
}>();

const emit = defineEmits<{
  updated: [];
}>();

const { apiService } = useAuth();
const toast = useToast();

const isSubmitting = ref(false);
const editingLead = ref<Partial<Lead>>({});

// Computed options for select menus
const statusOptionsFiltered = computed(() =>
  props.statusOptions.filter((opt) => opt.value !== ""),
);

const sourceOptionsFiltered = computed(() =>
  props.sourceOptions.filter((opt) => opt.value !== ""),
);

const courseOptions = computed(() =>
  props.courses.map((course) => ({
    value: course.id,
    label: course.title,
  })),
);

// Watch for lead changes to populate form
watch(
  () => props.lead,
  (newLead) => {
    if (newLead) {
      editingLead.value = {
        id: newLead.id,
        first_name: newLead.first_name,
        last_name: newLead.last_name,
        phone: newLead.phone,
        parent_phone_number: newLead.parent_phone_number || "",
        parent_name: newLead.parent_name || "",
        additional_number: newLead.additional_number || "",
        status: newLead.status,
        source: newLead.source,
        question: newLead.question || "",
        course_id: newLead.course_id || "",
        notes: newLead.notes || "",
      };
    }
  },
  { immediate: true },
);

const handleSubmit = async () => {
  if (!editingLead.value.id) return;

  isSubmitting.value = true;
  try {
    await api.patch(apiService.value, `/leads/${editingLead.value.id}`, {
      first_name: editingLead.value.first_name,
      last_name: editingLead.value.last_name,
      phone: editingLead.value.phone,
      parent_phone_number: editingLead.value.parent_phone_number || null,
      parent_name: editingLead.value.parent_name || null,
      additional_number: editingLead.value.additional_number || null,
      status: editingLead.value.status,
      source: editingLead.value.source,
      question: editingLead.value.question || null,
      course_id: editingLead.value.course_id || null,
      notes: editingLead.value.notes || null,
    });

    toast.add({
      title: "Muvaffaqiyatli",
      description: "Lead ma'lumotlari yangilandi",
      color: "success",
    });

    open.value = false;
    emit("updated");
  } catch (error: any) {
    console.error("Failed to update lead:", error);
    toast.add({
      title: "Xatolik",
      description: error.message || "Lead yangilashda xatolik yuz berdi",
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
    title="Lead tahrirlash"
    description="Lead ma'lumotlarini yangilash"
    :ui="{ content: 'w-[calc(100vw-2rem)] max-w-2xl' }"
  >
    <template #body>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Personal Information -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"
          >
            <UIcon name="i-lucide-user" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Shaxsiy ma'lumotlar
            </h3>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Ism" required>
              <UInput
                v-model="editingLead.first_name"
                placeholder="Ismni kiriting"
                required
                class="w-full"
              />
            </UFormField>

            <UFormField label="Familiya" required>
              <UInput
                v-model="editingLead.last_name"
                placeholder="Familiyani kiriting"
                required
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Telefon raqami" required>
            <UInput
              v-model="editingLead.phone"
              placeholder="+998 XX XXX XX XX"
              required
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Parent Information -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"
          >
            <UIcon name="i-lucide-users" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Ota-ona ma'lumotlari
            </h3>
          </div>

          <UFormField label="Ota-ona ismi">
            <UInput
              v-model="editingLead.parent_name"
              placeholder="Ota-ona ismini kiriting"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Ota-ona telefoni">
              <UInput
                v-model="editingLead.parent_phone_number"
                placeholder="+998 XX XXX XX XX"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Qo'shimcha raqam">
              <UInput
                v-model="editingLead.additional_number"
                placeholder="+998 XX XXX XX XX"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <!-- Lead Information -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"
          >
            <UIcon name="i-lucide-info" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Holat va manba
            </h3>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Holat">
              <USelectMenu
                v-model="editingLead.status"
                :items="statusOptionsFiltered"
                value-key="value"
                placeholder="Holatni tanlang"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Manba">
              <USelectMenu
                v-model="editingLead.source"
                :items="sourceOptionsFiltered"
                value-key="value"
                placeholder="Manbani tanlang"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <!-- Course Section -->
        <div class="space-y-4">
          <div
            class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700"
          >
            <UIcon name="i-lucide-book-open" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Kurs ma'lumotlari
            </h3>
          </div>

          <UFormField label="Qiziqayotgan kurs">
            <USelectMenu
              v-model="editingLead.course_id"
              :items="courseOptions"
              value-key="value"
              placeholder="Kursni tanlang"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Savol">
            <UTextarea
              v-model="editingLead.question"
              placeholder="Lead savoli..."
              :rows="3"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Eslatmalar">
            <UTextarea
              v-model="editingLead.notes"
              placeholder="Qo'shimcha eslatmalar..."
              :rows="3"
              class="w-full"
            />
          </UFormField>
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
