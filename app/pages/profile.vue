<template>
  <UDashboardPanel id="profile">
    <template #header>
      <UDashboardNavbar title="Profil" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #description>
          Profil ma'lumotlarini ko'rish va boshqarish
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4 lg:p-6 space-y-6">
        <!-- Loading State -->
        <div v-if="isLoading" class="flex justify-center items-center py-12">
          <Icon name="lucide:loader-2" class="h-8 w-8 animate-spin" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="rounded-lg border border-red-500 p-4">
          <p class="text-sm text-red-500">{{ error }}</p>
        </div>

        <!-- Profile Content -->
        <div v-else-if="adminProfile" class="max-w-3xl mx-auto space-y-6">
          <!-- Profile Summary Card -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-4">
                <UAvatar
                  :text="
                    getInitials(adminProfile.first_name, adminProfile.last_name)
                  "
                  size="xl"
                  class="text-2xl"
                />
                <div class="flex-1">
                  <h2 class="text-2xl font-bold">
                    {{ adminProfile.first_name }} {{ adminProfile.last_name }}
                  </h2>
                  <p class="text-base text-gray-500 dark:text-gray-400">
                    @{{ adminProfile.username }}
                  </p>
                  <div class="flex gap-2 mt-2">
                    <UBadge
                      v-for="(role, index) in adminProfile.roles"
                      :key="typeof role === 'string' ? index : role.id"
                      color="primary"
                    >
                      {{ typeof role === "string" ? role : role.name }}
                    </UBadge>
                  </div>
                </div>
              </div>
            </template>

            <!-- Profile Details -->
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span
                  class="text-sm font-medium text-gray-500 dark:text-gray-400"
                  >ID</span
                >
                <span class="text-sm">{{ adminProfile.user_id }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span
                  class="text-sm font-medium text-gray-500 dark:text-gray-400"
                  >Telefon</span
                >
                <span class="text-sm">{{ adminProfile.phone }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span
                  class="text-sm font-medium text-gray-500 dark:text-gray-400"
                  >Holat</span
                >
                <UBadge :color="adminProfile.is_active ? 'success' : 'info'">
                  {{ adminProfile.is_active ? "Faol" : "Nofaol" }}
                </UBadge>
              </div>
              <div class="flex justify-between items-center">
                <span
                  class="text-sm font-medium text-gray-500 dark:text-gray-400"
                  >Yaratilgan</span
                >
                <span class="text-sm">{{
                  formatDate(adminProfile.created_at)
                }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span
                  class="text-sm font-medium text-gray-500 dark:text-gray-400"
                  >Oxirgi kirish</span
                >
                <span class="text-sm">{{
                  formatDate(adminProfile.last_login)
                }}</span>
              </div>
            </div>

            <template #footer>
              <div class="flex gap-2">
                <UButton
                  icon="i-lucide-edit"
                  label="Profilni tahrirlash"
                  @click="showEditDialog = true"
                />
                <UButton
                  icon="i-lucide-key"
                  label="Parolni o'zgartirish"
                  variant="outline"
                  @click="showPasswordDialog = true"
                />
              </div>
            </template>
          </UCard>
        </div>
      </div>

        <!-- Edit Profile Modal -->
    <UModal v-model:open="showEditDialog">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Profilni tahrirlash</h3>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Profil ma'lumotlarini yangilash
          </p>
        </template>
        <template #body>
        <form @submit.prevent="updateProfile" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Ism" required>
              <UInput v-model="editForm.first_name" placeholder="Ism" />
            </UFormField>
            <UFormField label="Familiya" required>
              <UInput v-model="editForm.last_name" placeholder="Familiya" />
            </UFormField>
          </div>
          <UFormField label="Foydalanuvchi nomi" required>
            <UInput
              v-model="editForm.username"
              placeholder="Foydalanuvchi nomi"
            />
          </UFormField>
          <UFormField label="Telefon" required>
            <UInput v-model="editForm.phone" placeholder="Telefon" />
          </UFormField>
        </form>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="outline"
              label="Bekor qilish"
              @click="showEditDialog = false"
            />
            <UButton
              :loading="isUpdating"
              :disabled="isUpdating"
              label="Saqlash"
              @click="updateProfile"
            />
          </div>
        </template>
    </UModal>

    <!-- Change Password Modal -->
    <UModal v-model:open="showPasswordDialog">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Parolni o'zgartirish</h3>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Hisobingiz xavfsizligini saqlash uchun parolingizni yangilang
          </p>
        </template>

     <template #body>
         <form @submit.prevent="changePassword" class="space-y-4">
          <UFormField label="Joriy parol" required>
            <UInput
              v-model="passwordForm.currentPassword"
              type="password"
              placeholder="Joriy parol"
            />
          </UFormField>
          <UFormField label="Yangi parol" required>
            <UInput
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="Yangi parol"
            />
          </UFormField>
          <UFormField label="Parolni tasdiqlang" required>
            <UInput
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="Parolni tasdiqlang"
            />
            <p
              v-if="
                passwordForm.newPassword &&
                passwordForm.confirmPassword &&
                passwordForm.newPassword !== passwordForm.confirmPassword
              "
              class="text-xs text-red-500 mt-1"
            >
              Parollar mos kelmaydi
            </p>
          </UFormField>
        </form>
      </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="outline"
              label="Bekor qilish"
              @click="showPasswordDialog = false"
            />
            <UButton
              :loading="isChangingPassword"
              :disabled="
                isChangingPassword ||
                !passwordForm.currentPassword ||
                !passwordForm.newPassword ||
                !passwordForm.confirmPassword ||
                passwordForm.newPassword !== passwordForm.confirmPassword
              "
              label="Parolni o'zgartirish"
              @click="changePassword"
            />
          </div>
        </template>
    </UModal>

    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from "vue";
import type { User } from "~/types";
import { useAuth } from "~/composables/useAuth";
import { api } from "~/lib/api";

// Define interfaces
interface AdminProfile extends User {
  last_login?: string;
}

// Define page meta
definePageMeta({
  middleware: ["auth"],
});

// Composables
const { auth, apiService } = useAuth();
const toast = useToast();

// State
const adminProfile = ref<AdminProfile | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const showEditDialog = ref(false);
const showPasswordDialog = ref(false);
const isUpdating = ref(false);
const isChangingPassword = ref(false);

// Form state
const editForm = reactive({
  first_name: "",
  last_name: "",
  username: "",
  phone: "",
});

const passwordForm = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

// Admin ID from auth cookie
const adminId = computed(() => auth.value.user?.id || "");

// Load admin profile
const loadProfile = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    if (!auth.value.isAuthenticated) {
      error.value = "You must be logged in to view your profile";
      return;
    }

    const userId = auth.value.user?.id;

    if (!userId) {
      error.value = "User ID not found in session";
      return;
    }

    // Fetch admin profile from API
    const response = await api.get<AdminProfile>(
      apiService.value,
      `/users/${userId}`,
    );

    adminProfile.value = response;

    // Populate edit form with current values
    editForm.first_name = response.first_name;
    editForm.last_name = response.last_name;
    editForm.username = response.username;
    editForm.phone = response.phone;
  } catch (err) {
    console.error("Failed to load admin profile:", err);
    error.value =
      err instanceof Error ? err.message : "Failed to load profile information";
  } finally {
    isLoading.value = false;
  }
};

// Update profile
const updateProfile = async () => {
  if (!adminProfile.value) return;

  isUpdating.value = true;
  try {
    const response = await api.patch<AdminProfile>(
      apiService.value,
      `/users/${adminProfile.value.user_id}`,
      editForm,
    );

    // Update profile state
    adminProfile.value = {
      ...adminProfile.value,
      ...response,
    };

    toast.add({
      title: "Profil yangilandi",
      description: "Profil ma'lumotlari muvaffaqiyatli yangilandi",
      color: "success",
    });

    showEditDialog.value = false;
  } catch (err) {
    console.error("Failed to update profile:", err);
    toast.add({
      title: "Yangilanmadi",
      description:
        err instanceof Error
          ? err.message
          : "Profil ma'lumotlarini yangilab bo'lmadi",
      color: "error",
    });
  } finally {
    isUpdating.value = false;
  }
};

// Change password
const changePassword = async () => {
  if (!adminProfile.value) return;

  isChangingPassword.value = true;
  try {
    await api.post(
      apiService.value,
      `/users/${adminProfile.value.user_id}/update-password`,
      {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      },
    );

    toast.add({
      title: "Parol o'zgartirildi",
      description: "Parolingiz muvaffaqiyatli o'zgartirildi",
      color: "success",
    });

    // Reset form
    passwordForm.currentPassword = "";
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";

    showPasswordDialog.value = false;
  } catch (err) {
    console.error("Failed to change password:", err);
    toast.add({
      title: "Parol o'zgarmadi",
      description:
        err instanceof Error
          ? err.message
          : "Parolni o'zgartirib bo'lmadi. Joriy parolni tekshiring va qayta urinib ko'ring.",
      color: "error",
    });
  } finally {
    isChangingPassword.value = false;
  }
};

// Helper function to get initials
const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

// Format date helper
const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("uz-UZ", { timeZone: "UTC" });
};

// Refresh profile
const refreshProfile = () => {
  loadProfile();
};

// On component mount
onMounted(() => {
  loadProfile();
});
</script>
