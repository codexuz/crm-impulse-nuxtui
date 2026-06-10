<template>
  <UDashboardPanel id="send-bulk">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
          <UNavigationMenu :items="smsNavItems" highlight />
        </template>

        <template #description>
          Barcha talabalarga shablon asosida ommaviy SMS jo'nating
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <Icon name="lucide:users" class="h-5 w-5" />
              <h3 class="text-base font-semibold">Ommaviy SMS</h3>
            </div>
          </template>

          <div class="space-y-4">
            <!-- Recipient type selector -->
            <UFormField label="Qabul qiluvchilar turi">
              <div class="flex flex-wrap gap-2">
                <UButton
                  v-for="type in recipientTypes"
                  :key="type.value"
                  :label="type.label"
                  :icon="type.icon"
                  :variant="recipientType === type.value ? 'solid' : 'outline'"
                  size="sm"
                  @click="selectRecipientType(type.value)"
                />
              </div>
            </UFormField>

            <UFormField label="Shablon tanlang">
              <USelectMenu v-model="selectedTemplateId" :items="templateOptions" value-key="value"
                :loading="isLoadingTemplates" placeholder="Shablonni tanlang" class="w-full">
                <template #label>
                  {{
                    templateOptions.find((t) => t.value === selectedTemplateId)
                      ?.label || "Shablonni tanlang"
                  }}
                </template>
              </USelectMenu>
            </UFormField>

            <UFormField label="Xabar matni">
              <UTextarea v-model="bulkMessage" :rows="5"
                placeholder="Shablon tanlang yoki xabar matnini kiriting..." class="w-full" />
            </UFormField>

            <div class="flex flex-wrap items-center justify-between gap-3">
              <p class="text-sm text-gray-500">
                Qabul qiluvchilar:
                <span class="font-medium">{{ recipientCount }}</span> {{ currentTypeLabel }}
                <span v-if="isLoadingRecipients" class="ml-2 text-xs">(yuklanmoqda...)</span>
              </p>
              <UButton icon="i-lucide-send" :label="`Barcha ${currentTypeLabel}ga yuborish`"
                :disabled="!bulkMessage.trim() || recipientCount === 0 || isSendingBulk" :loading="isSendingBulk"
                @click="confirmBulkOpen = true" />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Bulk send confirmation -->
      <UModal v-model:open="confirmBulkOpen" title="Ommaviy SMS yuborish">
        <template #body>
          <p class="text-sm">
            <span class="font-medium">{{ recipientCount }}</span> ta {{ currentTypeLabel }}ga
            quyidagi xabar yuboriladi:
          </p>
          <div class="mt-3 p-3 rounded bg-gray-50 dark:bg-gray-800 text-sm whitespace-pre-wrap break-words">
            {{ bulkMessage }}
          </div>
        </template>

        <template #footer="{ close }">
          <div class="flex justify-end gap-2">
            <UButton label="Bekor qilish" variant="outline" @click="close" />
            <UButton label="Yuborish" icon="i-lucide-send" :loading="isSendingBulk" @click="sendBulk" />
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import type { NavigationMenuItem } from "@nuxt/ui";
import { useSMS } from "~/composables/useSMS";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";

const { apiService } = useAuth();
const toast = useToast();

const smsNavItems: NavigationMenuItem[] = [
  {
    label: "SMS Jo'natmalar",
    icon: "i-lucide-send",
    to: "/sms/send-sms",
  },
  {
    label: "Ommaviy SMS",
    icon: "i-lucide-users",
    to: "/sms/send-bulk",
  },
  {
    label: "Shablonlar",
    icon: "i-lucide-file-text",
    to: "/sms/templates",
  },
  {
    label: "Hisobot",
    icon: "i-lucide-bar-chart-3",
    to: "/sms/report",
  },
];

definePageMeta({
  middleware: ["auth"],
});

type RecipientType = "students" | "teachers" | "parents";

interface NormalizedRecipient {
  id: string;
  phone: string;
}

const recipientTypes = [
  { value: "students" as RecipientType, label: "Talabalar", icon: "i-lucide-graduation-cap" },
  { value: "teachers" as RecipientType, label: "O'qituvchilar", icon: "i-lucide-chalkboard-teacher" },
  { value: "parents" as RecipientType, label: "Ota-onalar", icon: "i-lucide-users" },
];

// State
const templates = ref<any[]>([]);
const recipients = ref<NormalizedRecipient[]>([]);
const isLoadingRecipients = ref(false);
const isLoadingTemplates = ref(false);
const recipientType = ref<RecipientType>("students");
const selectedTemplateId = ref<string | null>(null);
const bulkMessage = ref("");
const isSendingBulk = ref(false);
const confirmBulkOpen = ref(false);

const normalizePhone = (phone: string) => (phone || "").replace(/\D/g, "");

const currentTypeLabel = computed(
  () => recipientTypes.find((t) => t.value === recipientType.value)?.label ?? "talabalar",
);

const templateOptions = computed(() =>
  templates.value.map((t: any) => {
    const text = t.original_text || t.template || t.message || "";
    return {
      label: text.length > 60 ? `${text.slice(0, 60)}...` : text || `#${t.id}`,
      value: String(t.id),
      text,
    };
  }),
);

const validRecipients = computed(() =>
  recipients.value.filter((r) => normalizePhone(r.phone).length >= 9),
);

const recipientCount = computed(() => validRecipients.value.length);

watch(selectedTemplateId, (id) => {
  const opt = templateOptions.value.find((t) => t.value === id);
  if (opt) bulkMessage.value = opt.text;
});

const loadTemplates = async () => {
  isLoadingTemplates.value = true;
  try {
    const { getSMSTemplates } = useSMS();
    const response: any = await getSMSTemplates();
    if (Array.isArray(response)) {
      templates.value = response;
    } else if (response && typeof response === "object") {
      templates.value =
        response.data?.result ||
        response.data ||
        response.result ||
        response.templates ||
        [];
    } else {
      templates.value = [];
    }
  } catch (error) {
    console.error("Failed to load SMS templates:", error);
    templates.value = [];
  } finally {
    isLoadingTemplates.value = false;
  }
};

const loadAllStudents = async (): Promise<NormalizedRecipient[]> => {
  const collected: NormalizedRecipient[] = [];
  let pageNum = 1;
  const lim = 200;
  for (let i = 0; i < 100; i++) {
    const response = await api.get<{ data: any[]; totalPages: number }>(
      apiService.value,
      `/users/students?page=${pageNum}&limit=${lim}`,
    );
    for (const s of response.data || []) {
      collected.push({ id: s.user_id, phone: s.phone });
    }
    if (pageNum >= (response.totalPages || 1)) break;
    pageNum++;
  }
  return collected;
};

const loadAllTeachers = async (): Promise<NormalizedRecipient[]> => {
  const collected: NormalizedRecipient[] = [];
  let pageNum = 1;
  const lim = 200;
  for (let i = 0; i < 100; i++) {
    const response = await api.get<{ data: any[]; totalPages: number }>(
      apiService.value,
      `/users/teachers?page=${pageNum}&limit=${lim}`,
    );
    for (const t of response.data || []) {
      collected.push({ id: t.user_id, phone: t.phone });
    }
    if (pageNum >= (response.totalPages || 1)) break;
    pageNum++;
  }
  return collected;
};

const loadAllParents = async (): Promise<NormalizedRecipient[]> => {
  const collected: NormalizedRecipient[] = [];
  let pageNum = 1;
  const lim = 200;
  for (let i = 0; i < 100; i++) {
    const response = await api.get<{ data: any[]; totalPages: number }>(
      apiService.value,
      `/student-parents?page=${pageNum}&limit=${lim}`,
    );
    for (const p of response.data || []) {
      collected.push({ id: p.id, phone: p.phone_number });
    }
    if (pageNum >= (response.totalPages || 1)) break;
    pageNum++;
  }
  return collected;
};

const loadRecipients = async () => {
  isLoadingRecipients.value = true;
  recipients.value = [];
  try {
    if (recipientType.value === "students") {
      recipients.value = await loadAllStudents();
    } else if (recipientType.value === "teachers") {
      recipients.value = await loadAllTeachers();
    } else {
      recipients.value = await loadAllParents();
    }
  } catch (error) {
    console.error("Failed to load recipients:", error);
    toast.add({
      title: "Xatolik",
      description: `${currentTypeLabel.value}ni yuklashda xatolik yuz berdi`,
      color: "error",
    });
  } finally {
    isLoadingRecipients.value = false;
  }
};

const selectRecipientType = (type: RecipientType) => {
  if (recipientType.value === type) return;
  recipientType.value = type;
  loadRecipients();
};

const sendBulk = async () => {
  if (!bulkMessage.value.trim()) {
    toast.add({ title: "Xatolik", description: "Xabar matni bo'sh.", color: "error" });
    return;
  }
  if (recipientCount.value === 0) {
    toast.add({ title: "Xatolik", description: "Telefon raqami bor qabul qiluvchi topilmadi.", color: "error" });
    return;
  }

  isSendingBulk.value = true;
  try {
    const { sendBulkSMS } = useSMS();
    const messages = validRecipients.value.map((r) => ({
      user_sms_id: r.id,
      mobile_phone: normalizePhone(r.phone),
      message: bulkMessage.value,
    }));

    await sendBulkSMS({ messages });

    toast.add({
      title: "Muvaffaqiyat",
      description: `${messages.length} ta ${currentTypeLabel.value}ga SMS yuborildi`,
      color: "success",
    });

    confirmBulkOpen.value = false;
    bulkMessage.value = "";
    selectedTemplateId.value = null;
  } catch (error) {
    console.error("Failed to send bulk SMS:", error);
    toast.add({
      title: "Xatolik",
      description: "Ommaviy SMS yuborishda xatolik yuz berdi",
      color: "error",
    });
  } finally {
    isSendingBulk.value = false;
  }
};

onMounted(() => {
  loadTemplates();
  loadRecipients();
});
</script>
