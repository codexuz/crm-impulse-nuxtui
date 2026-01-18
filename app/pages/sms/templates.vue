<template>
  <UDashboardPanel id="sms-templates">
    <template #header>
      <UDashboardNavbar title="SMS Shablonlari">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          SMS xabarlar uchun shablonlarni boshqaring
        </template>

        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="Yangi shablon"
            @click="openCreateModal"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold">Mavjud shablonlar</h3>
        </template>

        <UTable
          :loading="isLoading"
          :columns="columns"
          :data="templates"
          :empty="'Hech qanday shablon topilmadi'"
        />
      </UCard>

      <!-- Create/Edit Template Modal -->
      <UModal v-model:open="isModalOpen">
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ isEditMode ? "Shablonni tahrirlash" : "Yangi shablon yaratish" }}
          </h3>
        </template>

        <template #body>
          <form @submit.prevent="submitTemplate" class="space-y-4">
            <div>
              <UFormField  label="Shablon matni" required>
                <UTextarea
                  v-model="templateForm.template"
                  placeholder="Shu yerga kiriting...."
                  :rows="4"
                  required
                  class="w-full"
                />
              </UFormField>
            </div>

            <div class="flex justify-end gap-2">
              <UButton
                type="button"
                variant="outline"
                label="Bekor qilish"
                @click="closeModal"
              />
              <UButton
                type="submit"
                :loading="isSubmitting"
                :label="
                  isSubmitting
                    ? 'Saqlanmoqda...'
                    : isEditMode
                      ? 'Yangilash'
                      : 'Yaratish'
                "
              />
            </div>
          </form>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from "vue";
import type { TableColumn } from "@nuxt/ui";
import { useSMS } from "~/composables/useSMS";

definePageMeta({
  middleware: ["auth"],
});

const toast = useToast();
const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");

// State
const templates = ref<any[]>([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingIndex = ref(-1);

// Form
const templateForm = ref({
  template: "",
});

// Table columns
const columns: TableColumn<any>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) =>
      h("div", { class: "font-medium" }, `#${row.original.id}`),
  },
  {
    accessorKey: "original_text",
    header: "Shablon Matni",
    cell: ({ row }) =>
      h(
        "div",
        {
          class: "max-w-md text-sm break-words whitespace-normal line-clamp-3",
        },
        row.original.original_text,
      ),
  },
  {
    accessorKey: "status",
    header: "Holat",
    cell: ({ row }) =>
      h(UBadge, {
        label: row.original.status,
        color: "blue",
        variant: "subtle",
      }),
  },
  {
    id: "actions",
    header: "Amallar",
    cell: ({ row }) =>
      h("div", { class: "flex items-center gap-2" }, [
        h(UButton, {
          variant: "ghost",
          size: "sm",
          icon: "i-lucide-copy",
          square: true,
          title: "Nusxalash",
          onClick: () => copyToClipboard(row.original.original_text),
        }),
      ]),
  },
];

// Functions
const loadTemplates = async () => {
  isLoading.value = true;
  try {
    const { getSMSTemplates } = useSMS();
    const response = await getSMSTemplates();
    templates.value = response.data?.result || [];
  } catch (error) {
    console.error("Failed to load SMS templates:", error);
    toast.add({
      title: "Xatolik",
      description: "Shablonlarni yuklashda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const openCreateModal = () => {
  isEditMode.value = false;
  templateForm.value.template = "";
  isModalOpen.value = true;
};

const editTemplate = (template: any, index: number) => {
  isEditMode.value = true;
  editingIndex.value = index;
  templateForm.value.template = template.template;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  templateForm.value.template = "";
  isEditMode.value = false;
  editingIndex.value = -1;
};

const submitTemplate = async () => {
  isSubmitting.value = true;
  try {
    const { createSMSTemplate } = useSMS();

    await createSMSTemplate({
      template: templateForm.value.template,
    });

    toast.add({
      title: "Muvaffaqiyat",
      description: isEditMode.value
        ? "Shablon muvaffaqiyatli yangilandi"
        : "Yangi shablon muvaffaqiyatli yaratildi",
      color: "success",
    });

    closeModal();
    await loadTemplates();
  } catch (error) {
    console.error("Failed to save template:", error);
    toast.add({
      title: "Xatolik",
      description: "Shablonni saqlashda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.add({
      title: "Muvaffaqiyat",
      description: "Matn nusxalandi",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to copy text:", error);
    toast.add({
      title: "Xatolik",
      description: "Matnni nusxalashda xatolik yuz berdi",
      color: "error",
    });
  }
};

// Initialize
onMounted(() => {
  loadTemplates();
});
</script>
