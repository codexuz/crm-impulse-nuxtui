<template>
  <div class="container py-10 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">SMS Jo'natish</h1>
        <p class="text-muted-foreground">
          Talabalar guruhiga SMS xabarlarni jo'nating
        </p>
      </div>
    </div>

    <!-- Template and Recipients Selection -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Template Selection -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Icon name="lucide:file-text" class="h-5 w-5" />
            Shablon tanlash
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="template">SMS shabloni</Label>
            <Select
              v-model="selectedTemplate"
              @update:modelValue="onTemplateSelect"
            >
              <SelectTrigger>
                <SelectValue placeholder="Shablonni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Shablonsiz</SelectItem>
                <SelectItem
                  v-for="template in templates"
                  :key="template.id"
                  :value="template.id.toString()"
                >
                  Shablon #{{ template.id }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="message">Xabar matni</Label>
            <Textarea
              id="message"
              v-model="messageText"
              placeholder="SMS xabar matnini kiriting..."
              rows="6"
              required
            />
          </div>

          <div
            v-if="selectedTemplate !== 'none' && selectedTemplateData"
            class="p-3 bg-muted rounded-lg"
          >
            <p class="text-sm font-medium mb-2">Shablon namunasi:</p>
            <p class="text-sm text-muted-foreground">
              {{ selectedTemplateData.original_text }}
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Recipients Selection -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Icon name="lucide:users" class="h-5 w-5" />
            Qabul qiluvchilar
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Search Input -->
          <div class="space-y-2">
            <Label for="search">Qidirish</Label>
            <Input
              id="search"
              v-model="searchQuery"
              placeholder="Ism, familiya yoki telefon raqami bo'yicha qidiring..."
            />
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Label for="selectAll" class="font-medium">
                Jami {{ filteredStudents.length }} ta talaba
              </Label>
            </div>
            <div class="text-sm text-muted-foreground">
              {{ selectedStudents.length }} tanlangan
            </div>
          </div>

          <div class="border rounded-lg max-h-80 overflow-y-auto">
            <div
              v-for="student in filteredStudents"
              :key="student.user_id"
              class="flex items-center space-x-3 p-3 border-b last:border-b-0 cursor-pointer transition-colors"
              :class="{
                'bg-primary/10 border-primary/20 hover:bg-primary/15':
                  selectedStudents.includes(student.user_id),
                'hover:bg-muted/50': !selectedStudents.includes(
                  student.user_id
                ),
              }"
              @click="toggleStudentSelection(student.user_id)"
            >
              <div
                class="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
                :class="{
                  'bg-primary border-primary': selectedStudents.includes(
                    student.user_id
                  ),
                  'border-muted-foreground': !selectedStudents.includes(
                    student.user_id
                  ),
                }"
              >
                <Icon
                  v-if="selectedStudents.includes(student.user_id)"
                  name="lucide:check"
                  class="h-3 w-3 text-primary-foreground"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium">
                  {{ `${student.first_name} ${student.last_name}` }}
                </div>
                <div class="text-sm text-muted-foreground">
                  {{ student.phone }}
                </div>
                <div class="text-xs text-muted-foreground">
                  @{{ student.username }}
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="students.length === 0"
            class="text-center py-8 text-muted-foreground"
          >
            Talabalar yuklanmoqda...
          </div>
          <div
            v-else-if="filteredStudents.length === 0"
            class="text-center py-8 text-muted-foreground"
          >
            Qidiruv bo'yicha hech qanday talaba topilmadi
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- SMS Preview and Send -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Icon name="lucide:send" class="h-5 w-5" />
          SMS jo'natish
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <!-- SMS Summary -->
          <div
            class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg"
          >
            <div class="text-center">
              <div class="text-2xl font-bold">
                {{ selectedStudents.length }}
              </div>
              <div class="text-sm text-muted-foreground">Qabul qiluvchilar</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold">{{ estimatedParts }}</div>
              <div class="text-sm text-muted-foreground">Taxminiy qismlar</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold">
                {{ formatCurrency(estimatedCost) }}
              </div>
              <div class="text-sm text-muted-foreground">Taxminiy xarajat</div>
            </div>
          </div>

          <!-- Message Preview -->
          <div v-if="messageText.trim()" class="space-y-2">
            <Label>Xabar ko'rinishi:</Label>
            <div class="p-3 border rounded-lg bg-background">
              <p class="whitespace-pre-wrap">{{ messageText }}</p>
            </div>
          </div>

          <!-- Send Button -->
          <div class="flex justify-end">
            <Button
              @click="sendSMS"
              :disabled="!canSend || isSending"
              size="lg"
            >
              <Icon
                v-if="isSending"
                name="lucide:loader-2"
                class="mr-2 h-4 w-4 animate-spin"
              />
              <Icon v-else name="lucide:send" class="mr-2 h-4 w-4" />
              {{ isSending ? "Jo'natilmoqda..." : "SMS jo'natish" }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useSMS } from "~/composables/useSMS";

import { useAuth } from "~/composables/useAuth";
import { api } from "~/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

definePageMeta({
  middleware: ["auth"],
});

const { toast } = useToast();

// State
const templates = ref<any[]>([]);
const students = ref<any[]>([]);
const selectedTemplate = ref("none");
const messageText = ref("");
const selectedStudents = ref<string[]>([]);
const isSending = ref(false);
const searchQuery = ref("");

// Computed
const selectedTemplateData = computed(() => {
  if (selectedTemplate.value === "none") return null;
  return templates.value.find(
    (t) => t.id.toString() === selectedTemplate.value
  );
});

const filteredStudents = computed(() => {
  if (!searchQuery.value.trim()) {
    return students.value;
  }

  const query = searchQuery.value.toLowerCase().trim();
  return students.value.filter((student) => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const username = student.username?.toLowerCase() || "";
    const phone = student.phone?.toLowerCase() || "";

    return (
      fullName.includes(query) ||
      username.includes(query) ||
      phone.includes(query)
    );
  });
});

const allSelected = computed(() => {
  return (
    filteredStudents.value.length > 0 &&
    filteredStudents.value.every((student) =>
      selectedStudents.value.includes(student.user_id)
    )
  );
});

const canSend = computed(() => {
  return messageText.value.trim() && selectedStudents.value.length > 0;
});

const estimatedParts = computed(() => {
  if (!messageText.value.trim()) return 0;
  const messageLength = messageText.value.length;
  const partsPerMessage = Math.ceil(messageLength / 160);
  return partsPerMessage * selectedStudents.value.length;
});

const estimatedCost = computed(() => {
  // Assuming 110 UZS per part based on the previous example
  return estimatedParts.value * 110;
});

// Functions
const loadTemplates = async () => {
  try {
    const { getSMSTemplates } = useSMS();
    const response = await getSMSTemplates();
    templates.value = response.data?.result || [];
  } catch (error) {
    console.error("Failed to load templates:", error);
    toast({
      title: "Xatolik",
      description: "Shablonlarni yuklashda xatolik yuz berdi",
      variant: "destructive",
    });
  }
};

const loadStudents = async () => {
  try {
    const { apiService } = useAuth();
    const response = await api.get<any>(apiService.value, "/users/students");
    students.value = response.data || response || [];
  } catch (error) {
    console.error("Failed to load students:", error);
    toast({
      title: "Xatolik",
      description: "Talabalarni yuklashda xatolik yuz berdi",
      variant: "destructive",
    });
  }
};

const onTemplateSelect = (templateId: string) => {
  if (templateId && templateId !== "none") {
    const template = templates.value.find(
      (t) => t.id.toString() === templateId
    );
    if (template) {
      messageText.value = template.template;
    }
  } else if (templateId === "none") {
    messageText.value = "";
  }
};

const toggleSelectAll = (checked: boolean) => {
  if (checked) {
    // Add all filtered students to selection
    const filteredIds = filteredStudents.value.map((s) => s.user_id);
    selectedStudents.value = [
      ...new Set([...selectedStudents.value, ...filteredIds]),
    ];
  } else {
    // Remove all filtered students from selection
    const filteredIds = filteredStudents.value.map((s) => s.user_id);
    selectedStudents.value = selectedStudents.value.filter(
      (id) => !filteredIds.includes(id)
    );
  }
};

const toggleStudentSelection = (studentId: string) => {
  const isSelected = selectedStudents.value.includes(studentId);

  if (isSelected) {
    const index = selectedStudents.value.indexOf(studentId);
    selectedStudents.value.splice(index, 1);
  } else {
    selectedStudents.value.push(studentId);
  }
};

const toggleStudent = (studentId: string, checked?: boolean) => {
  const index = selectedStudents.value.indexOf(studentId);

  if (checked !== undefined) {
    // Use the explicit checked value
    if (checked && index === -1) {
      selectedStudents.value.push(studentId);
    } else if (!checked && index > -1) {
      selectedStudents.value.splice(index, 1);
    }
  } else {
    // Toggle based on current state (backward compatibility)
    if (index > -1) {
      selectedStudents.value.splice(index, 1);
    } else {
      selectedStudents.value.push(studentId);
    }
  }
};

const sendSMS = async () => {
  if (!canSend.value) return;

  isSending.value = true;
  let successCount = 0;
  let failedCount = 0;

  try {
    const { sendSMS: sendSMSMessage } = useSMS();

    // Prepare individual SMS promises
    const smsPromises = selectedStudents.value.map(async (studentId) => {
      const student = students.value.find((s) => s.user_id === studentId);
      const smsData = {
        mobile_phone: (student?.phone || "").replace("+", ""),
        message: messageText.value,
      };

      try {
        await sendSMSMessage(smsData);
        successCount++;
        return { success: true, student: student };
      } catch (error) {
        failedCount++;
        console.error(
          `Failed to send SMS to ${student?.first_name} ${student?.last_name}:`,
          error
        );
        return { success: false, student: student, error };
      }
    });

    // Send all SMS messages concurrently
    await Promise.all(smsPromises);

    if (successCount > 0) {
      toast({
        title: "Muvaffaqiyat",
        description: `${successCount} ta talabaga SMS muvaffaqiyatli jo'natildi${
          failedCount > 0 ? `, ${failedCount} ta xatolik` : ""
        }`,
      });
    }

    if (failedCount > 0 && successCount === 0) {
      toast({
        title: "Xatolik",
        description: "Hech qanday SMS jo'natilmadi",
        variant: "destructive",
      });
    }

    // Reset form only if at least one SMS was sent successfully
    if (successCount > 0) {
      messageText.value = "";
      selectedTemplate.value = "none";
      selectedStudents.value = [];
    }
  } catch (error) {
    console.error("Failed to send SMS:", error);
    toast({
      title: "Xatolik",
      description: "SMS jo'natishda xatolik yuz berdi",
      variant: "destructive",
    });
  } finally {
    isSending.value = false;
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("uz-UZ").format(amount);
};

// Initialize
onMounted(() => {
  loadTemplates();
  loadStudents();
});
</script>
