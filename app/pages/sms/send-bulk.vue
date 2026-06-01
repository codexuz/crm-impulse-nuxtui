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
              <h3 class="text-base font-semibold">Talabalarga ommaviy SMS</h3>
            </div>
          </template>

          <div class="space-y-4">
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
                <span class="font-medium">{{ recipientCount }}</span> talaba
                <span v-if="isLoadingStudents" class="ml-2 text-xs">(yuklanmoqda...)</span>
              </p>
              <UButton icon="i-lucide-send" label="Barcha talabalarga yuborish"
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
            <span class="font-medium">{{ recipientCount }}</span> ta talabaga
            quyidagi xabar yuboriladi:
          </p>
          <div class="mt-3 p-3 rounded bg-gray-50 dark:bg-gray-800 text-sm whitespace-pre-wrap break-words">
            {{ bulkMessage }}
          </div>
        </template>

        <template #footer="{ close }">
          <div class="flex justify-end gap-2">
            <UButton label="Bekor qilish" variant="outline" @click="close" />
            <UButton label="Yuborish" icon="i-lucide-send" :loading="isSendingBulk" @click="sendBulkToAllStudents" />
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

interface BulkStudent {
  user_id: string;
  phone: string;
}

// State
const templates = ref<any[]>([]);
const students = ref<BulkStudent[]>([]);
const isLoadingStudents = ref(false);
const isLoadingTemplates = ref(false);
const selectedTemplateId = ref<string | null>(null);
const bulkMessage = ref("");
const isSendingBulk = ref(false);
const confirmBulkOpen = ref(false);

const normalizePhone = (phone: string) => (phone || "").replace(/\D/g, "");

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

const validStudents = computed(() =>
  students.value.filter((s) => normalizePhone(s.phone).length >= 9),
);

const recipientCount = computed(() => validStudents.value.length);

// Fill the message box when a template is chosen
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

// Fetch every student across all pages
const loadAllStudents = async () => {
  isLoadingStudents.value = true;
  try {
    const collected: BulkStudent[] = [];
    let pageNum = 1;
    const lim = 200;
    // Guard against runaway loops
    for (let i = 0; i < 100; i++) {
      const response = await api.get<{
        data: BulkStudent[];
        totalPages: number;
      }>(apiService.value, `/users/students?page=${pageNum}&limit=${lim}`);
      collected.push(...(response.data || []));
      if (pageNum >= (response.totalPages || 1)) break;
      pageNum++;
    }
    students.value = collected;
  } catch (error) {
    console.error("Failed to load students:", error);
    toast.add({
      title: "Xatolik",
      description: "Talabalarni yuklashda xatolik yuz berdi",
      color: "error",
    });
    students.value = [];
  } finally {
    isLoadingStudents.value = false;
  }
};

const sendBulkToAllStudents = async () => {
  if (!bulkMessage.value.trim()) {
    toast.add({ title: "Xatolik", description: "Xabar matni bo'sh.", color: "error" });
    return;
  }
  if (recipientCount.value === 0) {
    toast.add({ title: "Xatolik", description: "Telefon raqami bor talaba topilmadi.", color: "error" });
    return;
  }

  isSendingBulk.value = true;
  try {
    const { sendBulkSMS } = useSMS();
    const messages = validStudents.value.map((s) => ({
      user_sms_id: s.user_id,
      mobile_phone: normalizePhone(s.phone),
      message: bulkMessage.value,
    }));

    await sendBulkSMS({ messages });

    toast.add({
      title: "Muvaffaqiyat",
      description: `${messages.length} ta talabaga SMS yuborildi`,
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
  loadAllStudents();
});
</script>
