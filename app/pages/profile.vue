<template>
  <div>
    <div class="container py-8">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-3xl font-bold tracking-tight">Admin Profile</h2>
          <p class="text-muted-foreground">
            View and manage your profile information
          </p>
        </div>
        <Button @click="refreshProfile">
          <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <!-- Loading state -->
      <div v-if="isLoading" class="py-12 flex justify-center">
        <div class="text-center space-y-4">
          <Icon
            name="lucide:loader-2"
            class="h-12 w-12 animate-spin text-primary mx-auto"
          />
          <p class="text-xl font-medium">Loading profile information...</p>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="py-12">
        <Card class="border-destructive">
          <CardHeader>
            <CardTitle class="text-destructive flex items-center">
              <Icon name="lucide:alert-circle" class="mr-2 h-5 w-5" />
              Error Loading Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{{ error }}</p>
          </CardContent>
          <CardFooter>
            <Button @click="refreshProfile" variant="outline">Try Again</Button>
          </CardFooter>
        </Card>
      </div>

      <!-- Profile information -->
      <div v-else-if="adminProfile" class="max-w-xl mx-auto gap-6">
        <!-- Profile summary card -->
        <Card class="md:col-span-1">
          <CardHeader class="pb-3">
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex flex-col items-center mb-6">
              <Avatar class="h-24 w-24 mb-4">
                <AvatarFallback class="text-xl">
                  {{
                    getInitials(adminProfile.first_name, adminProfile.last_name)
                  }}
                </AvatarFallback>
              </Avatar>
              <h3 class="text-xl font-bold">
                {{ adminProfile.first_name }} {{ adminProfile.last_name }}
              </h3>
              <p class="text-muted-foreground">{{ adminProfile.username }}</p>
              <div class="mt-2 flex flex-wrap gap-1">
                <Badge
                  v-for="role in adminProfile.roles"
                  :key="role.id"
                  class="mr-1"
                >
                  {{ role.name }}
                </Badge>
              </div>
            </div>
            <Separator class="my-4" />
            <dl class="space-y-3 text-sm">
              <div class="flex">
                <dt class="w-1/3 font-medium text-muted-foreground">ID:</dt>
                <dd class="w-2/3 font-mono text-xs truncate">
                  {{ adminProfile.user_id }}
                </dd>
              </div>
              <div class="flex">
                <dt class="w-1/3 font-medium text-muted-foreground">Phone:</dt>
                <dd class="w-2/3">{{ adminProfile.phone }}</dd>
              </div>
              <div class="flex">
                <dt class="w-1/3 font-medium text-muted-foreground">Status:</dt>
                <dd class="w-2/3">
                  <Badge
                    :variant="
                      adminProfile.is_active ? 'default' : 'destructive'
                    "
                  >
                    {{ adminProfile.is_active ? "Active" : "Inactive" }}
                  </Badge>
                </dd>
              </div>
              <div class="flex">
                <dt class="w-1/3 font-medium text-muted-foreground">
                  Created:
                </dt>
                <dd class="w-2/3">{{ formatDate(adminProfile.created_at) }}</dd>
              </div>
              <div class="flex">
                <dt class="w-1/3 font-medium text-muted-foreground">
                  Last Login:
                </dt>
                <dd class="w-2/3">
                  {{
                    adminProfile.last_login
                      ? formatDate(adminProfile.last_login)
                      : "Unknown"
                  }}
                </dd>
              </div>
            </dl>
          </CardContent>
          <CardFooter class="flex flex-col gap-2">
            <Button
              variant="outline"
              class="w-full"
              @click="showEditDialog = true"
            >
              <Icon name="lucide:pencil" class="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              class="w-full"
              @click="showPasswordDialog = true"
            >
              <Icon name="lucide:lock" class="mr-2 h-4 w-4" />
              Change Password
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>

    <!-- Edit Profile Dialog -->
    <Dialog v-model:open="showEditDialog">
      <DialogContent class="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal information below
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="updateProfile">
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="firstName">First Name</Label>
                <Input
                  id="firstName"
                  v-model="editForm.first_name"
                  placeholder="First Name"
                />
              </div>
              <div class="space-y-2">
                <Label for="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  v-model="editForm.last_name"
                  placeholder="Last Name"
                />
              </div>
            </div>
            <div class="space-y-2">
              <Label for="username">Username</Label>
              <Input
                id="username"
                v-model="editForm.username"
                placeholder="Username"
              />
            </div>
            <div class="space-y-2">
              <Label for="phone">Phone Number</Label>
              <Input id="phone" v-model="editForm.phone" placeholder="Phone" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="showEditDialog = false">
              Cancel
            </Button>
            <Button type="submit" :disabled="isUpdating">
              <Icon
                v-if="isUpdating"
                name="lucide:loader-2"
                class="mr-2 h-4 w-4 animate-spin"
              />
              {{ isUpdating ? "Updating..." : "Save Changes" }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Change Password Dialog -->
    <Dialog v-model:open="showPasswordDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Update your password to maintain account security
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="changePassword">
          <div class="grid gap-4 py-4">
            <div class="space-y-2">
              <Label for="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                v-model="passwordForm.currentPassword"
                type="password"
                placeholder="Current Password"
              />
            </div>
            <div class="space-y-2">
              <Label for="newPassword">New Password</Label>
              <Input
                id="newPassword"
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="New Password"
              />
            </div>
            <div class="space-y-2">
              <Label for="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="Confirm Password"
              />
              <p
                v-if="
                  passwordForm.newPassword &&
                  passwordForm.confirmPassword &&
                  passwordForm.newPassword !== passwordForm.confirmPassword
                "
                class="text-xs text-destructive mt-1"
              >
                Passwords don't match
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              @click="showPasswordDialog = false"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              :disabled="
                isChangingPassword ||
                !passwordForm.currentPassword ||
                !passwordForm.newPassword ||
                !passwordForm.confirmPassword ||
                passwordForm.newPassword !== passwordForm.confirmPassword
              "
            >
              <Icon
                v-if="isChangingPassword"
                name="lucide:loader-2"
                class="mr-2 h-4 w-4 animate-spin"
              />
              {{ isChangingPassword ? "Updating..." : "Change Password" }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from "vue";
import type { User } from "~/types";
import { useAuth } from "~/composables/useAuth";
import { api } from "~/lib/api";

// Define interfaces
interface AdminProfile extends User {
  last_login?: string;
  // Add any admin-specific fields here
}

// Define page meta
definePageMeta({
  middleware: ["auth"],
});

// Composables
const { auth, apiService } = useAuth();
const { toast } = useToast();

// State
const adminProfile = ref<AdminProfile | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const showEditDialog = ref(false);
const showPasswordDialog = ref(false);
const isUpdating = ref(false);
const isChangingPassword = ref(false);
const twoFactorEnabled = ref(false);

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
      `/users/${userId}`
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
      editForm
    );

    // Update profile state
    adminProfile.value = {
      ...adminProfile.value,
      ...response,
    };

    toast({
      title: "Profile Updated",
      description: "Your profile information has been updated successfully",
    });

    showEditDialog.value = false;
  } catch (err) {
    console.error("Failed to update profile:", err);
    toast({
      title: "Update Failed",
      description:
        err instanceof Error
          ? err.message
          : "Failed to update profile information",
      variant: "destructive",
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
      }
    );

    toast({
      title: "Password Changed",
      description: "Your password has been changed successfully",
    });

    // Reset form
    passwordForm.currentPassword = "";
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";

    showPasswordDialog.value = false;
  } catch (err) {
    console.error("Failed to change password:", err);
    toast({
      title: "Password Change Failed",
      description:
        err instanceof Error
          ? err.message
          : "Failed to change password. Please check your current password and try again.",
      variant: "destructive",
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
  return new Date(dateString).toLocaleString();
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
