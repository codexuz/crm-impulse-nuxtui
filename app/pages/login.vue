<template>
  <div class="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center mb-6">
        <div
          class="h-12 w-12 rounded-lg bg-primary flex items-center justify-center"
        >
          <UIcon name="i-lucide-graduation-cap" class="text-white text-2xl" />
        </div>
      </div>
      <h2 class="text-center text-3xl font-bold tracking-tight">
        Impulse Study CRM
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        Hisobingizga kiring
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <UCard>
        <UForm  class="space-y-4" @submit.prevent="handleLogin">
          <UFormField 
            label="Foydalanuvchi nomi"
            :error="errors.username"
            required
          >
            <UInput
              v-model="username"
              name="username"
              type="text"
              autocomplete="username"
              placeholder="Foydalanuvchi nomini kiriting"
              icon="i-lucide-user"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField  label="Parol" :error="errors.password" required>
            <UInput
              v-model="password"
              name="password"
              type="password"
              autocomplete="current-password"
              placeholder="Parolni kiriting"
              icon="i-lucide-lock"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <div class="flex items-center justify-between">
            <UCheckbox v-model="rememberMe" label="Meni eslab qol" />

            <UButton
              variant="link"
              size="sm"
              class="text-sm"
              :padded="false"
              to="#"
            >
              Parolni unutdingizmi?
            </UButton>
          </div>

          <UButton
            type="submit"
            block
            size="lg"
            :loading="isLoading"
            :disabled="isLoading"
          >
            {{ isLoading ? "Kirilmoqda..." : "Kirish" }}
          </UButton>

          <UAlert
            v-if="loginError"
            color="red"
            variant="soft"
            :title="loginError"
            icon="i-lucide-alert-circle"
          >
            <template #actions>
              <UButton
                v-if="
                  loginError.includes('network') ||
                  loginError.includes('tarmoq')
                "
                variant="soft"
                color="red"
                size="xs"
                @click="handleLogin"
              >
                Qayta urinish
              </UButton>
            </template>
          </UAlert>
        </UForm>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
});

const { login } = useAuth();
const router = useRouter();

const username = ref("");
const password = ref("");
const rememberMe = ref(false);
const errors = ref<Record<string, string>>({});
const isLoading = ref(false);
const loginError = ref("");

const validateForm = (): boolean => {
  errors.value = {};

  // Handle the specific validation for username
  if (!username.value || !username.value.trim()) {
    errors.value.username = "Foydalanuvchi nomi bo'sh bo'lishi mumkin emas";
  }

  // Handle the specific validation for password
  if (!password.value) {
    errors.value.password = "Parol bo'sh bo'lishi mumkin emas";
  } else if (password.value.length < 6) {
    errors.value.password = "Parol kamida 6 ta belgidan iborat bo'lishi kerak";
  }

  return Object.keys(errors.value).length === 0;
};

const handleLogin = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  loginError.value = "";

  try {
    console.log("Attempting login with:", username.value);
    await login(username.value, password.value);
    router.push("/");
  } catch (error) {
    console.error("Login error details:", error);

    // Extract error message from different error formats
    let errorMessage =
      "Tizimga kirishda xatolik. Iltimos, ma'lumotlaringizni tekshiring va qayta urinib ko'ring.";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      // @ts-ignore
      errorMessage = error.message || error.error || errorMessage;
    }

    // Check for common errors and provide helpful messages
    if (errorMessage.includes("401") || errorMessage.includes("unauthorized")) {
      errorMessage =
        "Noto'g'ri foydalanuvchi nomi yoki parol. Iltimos, qayta urinib ko'ring.";
    } else if (errorMessage.includes("400")) {
      errorMessage =
        "Tizimga kirishda xatolik. Iltimos, foydalanuvchi nomi va parolingizni to'g'ri kiritganingizga ishonch hosil qiling.";
    } else if (
      errorMessage.includes("network") ||
      errorMessage.includes("failed to fetch")
    ) {
      errorMessage =
        "Tarmoq xatosi. Iltimos, internet ulanishingizni tekshiring va qayta urinib ko'ring.";
    }

    loginError.value = errorMessage;
  } finally {
    isLoading.value = false;
  }
};
</script>
