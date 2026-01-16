<template>
  <div class="container mx-auto py-10 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">SMS Shablonlari</h1>
        <p class="text-muted-foreground">
          SMS xabarlar uchun shablonlarni boshqaring
        </p>
      </div>
      <Button @click="openCreateModal">
        <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
        Yangi shablon
      </Button>
    </div>

    <!-- Templates List -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Icon name="lucide:file-text" class="h-5 w-5" />
          Mavjud shablonlar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="isLoading" class="flex items-center justify-center py-8">
          <Icon
            name="lucide:loader-2"
            class="h-8 w-8 animate-spin text-primary"
          />
        </div>
        <div
          v-else-if="templates.length === 0"
          class="text-center py-8 text-muted-foreground"
        >
          Hech qanday shablon topilmadi
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="(template, index) in templates"
            :key="template.id || index"
            class="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <div class="font-medium">Shablon #{{ template.id }}</div>
                  <div
                    class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                  >
                    {{ template.status }}
                  </div>
                </div>
                <div class="space-y-2">
                  <div v-if="template.original_text">
                    <p class="text-xs font-medium text-muted-foreground mb-1">
                      Shablon Matni:
                    </p>
                    <p class="text-sm text-muted-foreground leading-relaxed">
                      {{ template.original_text }}
                    </p>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  @click="copyToClipboard(template.original_text)"
                  title="Misol matnni nusxalash"
                  v-if="template.original_text"
                >
                  <Icon name="lucide:file-text" class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Create/Edit Template Modal -->
    <Dialog v-model:open="isModalOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {{ isEditMode ? "Shablonni tahrirlash" : "Yangi shablon yaratish" }}
          </DialogTitle>
        </DialogHeader>

        <form @submit.prevent="submitTemplate" class="space-y-4">
          <div class="space-y-2">
            <Label for="template">Shablon matni</Label>
            <Textarea
              id="template"
              v-model="templateForm.template"
              placeholder="Shu yerga kiriting...."
              rows="4"
              required
            />
          </div>

          <div class="flex justify-end gap-2">
            <Button type="button" variant="outline" @click="closeModal">
              Bekor qilish
            </Button>
            <Button type="submit" :disabled="isSubmitting">
              <Icon
                v-if="isSubmitting"
                name="lucide:loader-2"
                class="mr-2 h-4 w-4 animate-spin"
              />
              {{
                isSubmitting
                  ? "Saqlanmoqda..."
                  : isEditMode
                  ? "Yangilash"
                  : "Yaratish"
              }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useSMS } from "~/composables/useSMS";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

definePageMeta({
  middleware: ["auth"],
});

const { toast } = useToast();

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

// Functions
const loadTemplates = async () => {
  isLoading.value = true;
  try {
    const { getSMSTemplates } = useSMS();
    const response = await getSMSTemplates();
    templates.value = response.data?.result || [];
    console.log("Templates loaded:", response);
  } catch (error) {
    console.error("Failed to load SMS templates:", error);
    toast({
      title: "Xatolik",
      description: "Shablonlarni yuklashda xatolik yuz berdi",
      variant: "destructive",
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

    toast({
      title: "Muvaffaqiyat",
      description: isEditMode.value
        ? "Shablon muvaffaqiyatli yangilandi"
        : "Yangi shablon muvaffaqiyatli yaratildi",
    });

    closeModal();
    await loadTemplates();
  } catch (error) {
    console.error("Failed to save template:", error);
    toast({
      title: "Xatolik",
      description: "Shablonni saqlashda xatolik yuz berdi",
      variant: "destructive",
    });
  } finally {
    isSubmitting.value = false;
  }
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Muvaffaqiyat",
      description: "Matn nusxalandi",
    });
  } catch (error) {
    console.error("Failed to copy text:", error);
    toast({
      title: "Xatolik",
      description: "Matnni nusxalashda xatolik yuz berdi",
      variant: "destructive",
    });
  }
};

// Initialize
onMounted(() => {
  loadTemplates();
});
</script>
