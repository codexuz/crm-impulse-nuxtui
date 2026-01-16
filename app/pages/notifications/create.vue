<template>
  <div class="container py-10 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="goBack">
          <Icon name="lucide:arrow-left" class="h-5 w-5" />
        </Button>
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Yangi bildirishnoma</h1>
          <p class="text-muted-foreground">
            Foydalanuvchilarga bildirishnoma yuborish
          </p>
        </div>
      </div>
    </div>

    <!-- Notification Type Selection -->
    <Card>
      <CardHeader>
        <CardTitle>Bildirishnoma turini tanlang</CardTitle>
        <CardDescription>
          Yubormoqchi bo'lgan bildirishnoma turini tanlang
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="max-w-md">
          <Select v-model="notificationType">
            <SelectTrigger>
              <SelectValue placeholder="Bildirishnoma turini tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">Umumiy</SelectItem>
              <SelectItem value="app-update">Ilova yangilanishi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

    <!-- General Notification Form -->
    <Card v-if="notificationType === 'general'">
      <CardHeader>
        <CardTitle>Umumiy bildirishnoma</CardTitle>
        <CardDescription>
          Barcha foydalanuvchilarga umumiy bildirishnoma yuborish
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-6">
          <div class="space-y-2">
            <Label for="general-title">Sarlavha *</Label>
            <Input
              id="general-title"
              v-model="generalForm.title"
              placeholder="Bildirishnoma sarlavhasi"
            />
          </div>

          <div class="space-y-2">
            <Label for="general-message">Xabar *</Label>
            <Textarea
              id="general-message"
              v-model="generalForm.message"
              placeholder="Bildirishnoma matni"
              rows="4"
            />
          </div>

          <div class="space-y-2">
            <Label for="general-image">Rasm</Label>
            <div class="flex items-center gap-4">
              <Input
                id="general-image"
                type="file"
                accept="image/*"
                @change="handleGeneralImageUpload"
                ref="generalImageInput"
              />
              <Button
                v-if="generalForm.img_url"
                variant="outline"
                size="sm"
                @click="clearGeneralImage"
              >
                <Icon name="lucide:x" class="mr-2 h-4 w-4" />
                O'chirish
              </Button>
            </div>
            <p class="text-sm text-muted-foreground">
              PNG, JPG yoki WEBP (maksimal 5MB)
            </p>
          </div>

          <!-- Image Preview -->
          <div v-if="generalImagePreview" class="space-y-2">
            <Label>Rasm ko'rinishi</Label>
            <div class="relative w-full max-w-md">
              <img
                :src="generalImagePreview"
                alt="Preview"
                class="rounded-lg border w-full h-auto"
              />
            </div>
          </div>

          <div
            v-if="generalForm.img_url && !generalImagePreview"
            class="space-y-2"
          >
            <Label>Yuklangan rasm URL</Label>
            <div class="flex items-center gap-2">
              <Input :value="generalForm.img_url" readonly class="flex-1" />
              <Button
                variant="outline"
                size="sm"
                @click="openImageInNewTab(generalForm.img_url)"
              >
                <Icon name="lucide:external-link" class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter class="flex justify-end gap-2">
        <Button variant="outline" @click="resetGeneralForm"> Tozalash </Button>
        <Button @click="sendGeneralNotification" :disabled="sendingGeneral">
          <Icon
            v-if="sendingGeneral"
            name="lucide:loader-2"
            class="mr-2 h-4 w-4 animate-spin"
          />
          <Icon v-else name="lucide:send" class="mr-2 h-4 w-4" />
          Yuborish
        </Button>
      </CardFooter>
    </Card>

    <!-- App Update Notification Form -->
    <Card v-if="notificationType === 'app-update'">
      <CardHeader>
        <CardTitle>Ilova yangilanishi</CardTitle>
        <CardDescription>
          Foydalanuvchilarga ilova yangilanishi haqida xabar yuborish
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-6">
          <div class="space-y-2">
            <Label for="update-message">Xabar *</Label>
            <Textarea
              id="update-message"
              v-model="appUpdateForm.customMessage"
              placeholder="Yangilanish haqida ma'lumot"
              rows="4"
            />
            <p class="text-sm text-muted-foreground">
              Masalan: "Yangi 2.0 versiyasi qiziqarli funksiyalar bilan mavjud!"
            </p>
          </div>

          <div class="space-y-2">
            <Label for="playstore-url">Play Store URL *</Label>
            <Input
              id="playstore-url"
              v-model="appUpdateForm.playStoreUrl"
              placeholder="https://play.google.com/store/apps/details?id=..."
              type="url"
            />
            <p class="text-sm text-muted-foreground">
              Ilovaning Play Store sahifasiga havola
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter class="flex justify-end gap-2">
        <Button variant="outline" @click="resetAppUpdateForm">
          Tozalash
        </Button>
        <Button @click="sendAppUpdateNotification" :disabled="sendingAppUpdate">
          <Icon
            v-if="sendingAppUpdate"
            name="lucide:loader-2"
            class="mr-2 h-4 w-4 animate-spin"
          />
          <Icon v-else name="lucide:send" class="mr-2 h-4 w-4" />
          Yuborish
        </Button>
      </CardFooter>
    </Card>

    <!-- Empty State -->
    <Card v-if="!notificationType">
      <CardContent class="flex flex-col items-center justify-center py-16">
        <Icon name="lucide:bell" class="h-16 w-16 text-muted-foreground mb-4" />
        <h3 class="text-lg font-semibold mb-2">Bildirishnoma turini tanlang</h3>
        <p class="text-sm text-muted-foreground text-center max-w-md">
          Yuqoridagi menyudan bildirishnoma turini tanlang va foydalanuvchilarga
          xabar yuboring
        </p>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";
import { api } from "~/lib/api";
import { toast } from "vue-sonner";

const { apiService } = useAuth();
const router = useRouter();

// Notification type
const notificationType = ref<"general" | "app-update" | "">("");

// General notification form
const generalForm = ref({
  title: "",
  message: "",
  img_url: "",
});

const generalImageInput = ref<HTMLInputElement | null>(null);
const generalImagePreview = ref<string | null>(null);
const generalImageFile = ref<File | null>(null);
const sendingGeneral = ref(false);

// App update notification form
const appUpdateForm = ref({
  customMessage: "",
  playStoreUrl: "https://play.google.com/store/apps/details?id=edu.impulse.uz",
});

const sendingAppUpdate = ref(false);

// Image upload handlers
const handleGeneralImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    toast.error("Rasm hajmi 5MB dan oshmasligi kerak");
    return;
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    toast.error("Faqat rasm fayllari qabul qilinadi");
    return;
  }

  generalImageFile.value = file;

  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    generalImagePreview.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const clearGeneralImage = () => {
  generalForm.value.img_url = "";
  generalImagePreview.value = null;
  generalImageFile.value = null;
  if (generalImageInput.value) {
    generalImageInput.value.value = "";
  }
};

const openImageInNewTab = (url: string) => {
  window.open(url, "_blank");
};

// Upload image to server
const uploadImage = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    // Adjust this endpoint based on your backend API
    const response = await api.post<{ url: string }>(
      apiService.value,
      "/uploads",
      formData
    );

    return response.url;
  } catch (error) {
    console.error("Failed to upload image:", error);
    toast.error("Rasmni yuklashda xatolik yuz berdi");
    return null;
  }
};

// Send general notification
const sendGeneralNotification = async () => {
  // Validation
  if (!generalForm.value.title.trim()) {
    toast.error("Sarlavhani kiriting");
    return;
  }

  if (!generalForm.value.message.trim()) {
    toast.error("Xabarni kiriting");
    return;
  }

  sendingGeneral.value = true;

  try {
    let imageUrl = generalForm.value.img_url;

    // Upload image if a new file is selected
    if (generalImageFile.value) {
      const uploadedUrl = await uploadImage(generalImageFile.value);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        sendingGeneral.value = false;
        return;
      }
    }

    const payload = {
      title: generalForm.value.title,
      message: generalForm.value.message,
      img_url: imageUrl || undefined,
    };

    await api.post(apiService.value, "/notifications", payload);

    toast.success("Bildirishnoma muvaffaqiyatli yuborildi");
    resetGeneralForm();
    router.push("/notifications");
  } catch (error: any) {
    console.error("Failed to send notification:", error);
    toast.error(
      error?.response?.data?.message ||
        "Bildirishnomani yuborishda xatolik yuz berdi"
    );
  } finally {
    sendingGeneral.value = false;
  }
};

// Send app update notification
const sendAppUpdateNotification = async () => {
  // Validation
  if (!appUpdateForm.value.customMessage.trim()) {
    toast.error("Xabarni kiriting");
    return;
  }

  if (!appUpdateForm.value.playStoreUrl.trim()) {
    toast.error("Play Store URL ni kiriting");
    return;
  }

  // Basic URL validation
  try {
    new URL(appUpdateForm.value.playStoreUrl);
  } catch {
    toast.error("Noto'g'ri URL formati");
    return;
  }

  sendingAppUpdate.value = true;

  try {
    const payload = {
      customMessage: appUpdateForm.value.customMessage,
      playStoreUrl: appUpdateForm.value.playStoreUrl,
    };

    await api.post(apiService.value, "/notifications/app-update", payload);

    toast.success("Ilova yangilanishi haqida bildirishnoma yuborildi");
    resetAppUpdateForm();
    router.push("/notifications");
  } catch (error: any) {
    console.error("Failed to send app update notification:", error);
    toast.error(
      error?.response?.data?.message ||
        "Bildirishnomani yuborishda xatolik yuz berdi"
    );
  } finally {
    sendingAppUpdate.value = false;
  }
};

// Reset forms
const resetGeneralForm = () => {
  generalForm.value = {
    title: "",
    message: "",
    img_url: "",
  };
  clearGeneralImage();
};

const resetAppUpdateForm = () => {
  appUpdateForm.value = {
    customMessage: "",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=edu.impulse.uz",
  };
};

const goBack = () => {
  router.push("/notifications");
};
</script>
