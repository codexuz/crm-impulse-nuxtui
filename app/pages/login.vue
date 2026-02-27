<template>
  <div class="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center mb-6">
        <div class="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
          <UIcon name="i-lucide-graduation-cap" class="text-white text-2xl" />
        </div>
      </div>
      <h2 class="text-center text-3xl font-bold tracking-tight">
        Impulse Study CRM
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        {{ otpStep ? "SMS orqali yuborilgan kodni kiriting" : "Hisobingizga kiring" }}
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <UCard>
        <!-- Step 1: Credentials -->
        <UForm v-if="!otpStep" class="space-y-4" @submit.prevent="handleLogin">
          <UFormField label="Foydalanuvchi nomi" :error="errors.username" required>
            <UInput v-model="username" name="username" type="text" autocomplete="username"
              placeholder="Foydalanuvchi nomini kiriting" icon="i-lucide-user" size="lg" class="w-full" />
          </UFormField>

          <UFormField label="Parol" :error="errors.password" required>
            <UInput v-model="password" name="password" type="password" autocomplete="current-password"
              placeholder="Parolni kiriting" icon="i-lucide-lock" size="lg" class="w-full" />
          </UFormField>

          <div class="flex items-center justify-between">
            <UCheckbox v-model="rememberMe" label="Meni eslab qol" />

            <UButton variant="link" size="sm" class="text-sm" :padded="false" to="#">
              Parolni unutdingizmi?
            </UButton>
          </div>

          <UButton type="submit" block size="lg" :loading="isLoading" :disabled="isLoading">
            {{ isLoading ? "Kirilmoqda..." : "Kirish" }}
          </UButton>
        </UForm>

        <!-- Step 2: OTP Verification -->
        <UForm v-else class="space-y-5" @submit.prevent="handleVerifyOtp">
          <div class="text-center space-y-1">
            <div class="flex justify-center mb-3">
              <div class="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <UIcon name="i-lucide-shield-check" class="text-primary text-2xl" />
              </div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Telefoningizga 6 xonali tasdiqlash kodi yuborildi
            </p>
          </div>

          <UFormField label="Tasdiqlash kodi" :error="errors.otp" required>
            <UInput v-model="otpCode" name="otp" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6"
              placeholder="000000" icon="i-lucide-key-round" size="lg" class="w-full" autocomplete="one-time-code" />
          </UFormField>

          <!-- Countdown Timer -->
          <div class="flex items-center justify-center gap-2 text-sm">
            <UIcon name="i-lucide-timer" :class="otpCountdown > 0 ? 'text-primary' : 'text-red-500'" />
            <span v-if="otpCountdown > 0" class="text-gray-600 dark:text-gray-400">
              Kod amal qilish muddati: <span class="font-mono font-semibold text-primary">{{ formattedCountdown
              }}</span>
            </span>
            <span v-else class="text-red-500 font-medium">
              Kod muddati tugadi
            </span>
          </div>

          <div class="flex gap-3">
            <UButton variant="outline" size="lg" class="flex-1" @click="resetToLogin" :disabled="isLoading">
              Ortga
            </UButton>
            <UButton type="submit" size="lg" class="flex-1" :loading="isLoading"
              :disabled="isLoading || otpCode.length !== 6 || otpCountdown <= 0">
              {{ isLoading ? "Tekshirilmoqda..." : "Tasdiqlash" }}
            </UButton>
          </div>

          <div class="text-center">
            <UButton variant="link" size="sm" :padded="false" :disabled="otpCountdown > 0 || isLoading"
              @click="resendOtp">
              Kodni qayta yuborish
            </UButton>
          </div>
        </UForm>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OtpLoginResponse } from '~/composables/useAuth';

definePageMeta({
  layout: false,
});

const { login, verifyOtp } = useAuth();
const router = useRouter();
const toast = useToast();

const username = ref("");
const password = ref("");
const rememberMe = ref(false);
const errors = ref<Record<string, string>>({});
const isLoading = ref(false);
const loginError = ref("");

// OTP state
const otpStep = ref(false);
const otpToken = ref("");
const otpCode = ref("");
const otpCountdown = ref(0);
let countdownInterval: ReturnType<typeof setInterval> | null = null;

const OTP_DURATION = 180; // 3 minutes in seconds

const formattedCountdown = computed(() => {
  const minutes = Math.floor(otpCountdown.value / 60);
  const seconds = otpCountdown.value % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
});

const startCountdown = () => {
  stopCountdown();
  otpCountdown.value = OTP_DURATION;
  countdownInterval = setInterval(() => {
    if (otpCountdown.value > 0) {
      otpCountdown.value--;
    } else {
      stopCountdown();
    }
  }, 1000);
};

const stopCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
};

const resetToLogin = () => {
  otpStep.value = false;
  otpToken.value = "";
  otpCode.value = "";
  errors.value = {};
  stopCountdown();
};

onUnmounted(() => {
  stopCountdown();
});

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
    const response = await login(username.value, password.value);

    // Check if OTP is required
    if ("otpRequired" in response && response.otpRequired) {
      const otpResponse = response as OtpLoginResponse;
      otpToken.value = otpResponse.otpToken;
      otpStep.value = true;
      startCountdown();
      toast.add({
        title: "Kod yuborildi",
        description: otpResponse.message || "SMS orqali tasdiqlash kodi yuborildi",
        color: "info",
      });
      return;
    }

    // Direct login success (teacher login or admin without OTP)
    toast.add({
      title: "Muvaffaqiyatli",
      description: "Tizimga muvaffaqiyatli kirdingiz",
      color: "success",
    });
    router.push("/");
  } catch (error) {
    console.error("Login error details:", error);

    let errorMessage =
      "Tizimga kirishda xatolik. Iltimos, ma'lumotlaringizni tekshiring va qayta urinib ko'ring.";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error !== null) {
      // @ts-ignore
      errorMessage = error.message || error.error || errorMessage;
    }

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
    toast.add({
      title: "Xatolik",
      description: "Login yoki parol noto'g'ri.",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const handleVerifyOtp = async () => {
  errors.value = {};

  if (!otpCode.value || otpCode.value.length !== 6) {
    errors.value.otp = "6 xonali tasdiqlash kodini kiriting";
    return;
  }

  if (otpCountdown.value <= 0) {
    errors.value.otp = "Kod muddati tugagan. Iltimos, qayta kirish qiling.";
    return;
  }

  isLoading.value = true;

  try {
    await verifyOtp(otpToken.value, otpCode.value);
    stopCountdown();
    toast.add({
      title: "Muvaffaqiyatli",
      description: "Tizimga muvaffaqiyatli kirdingiz",
      color: "success",
    });
    router.push("/");
  } catch (error) {
    console.error("OTP verification error:", error);

    let errorMessage = "Tasdiqlash kodini tekshirishda xatolik yuz berdi.";

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    if (errorMessage.includes("Too many attempts") || errorMessage.includes("too many")) {
      errorMessage = "Urinishlar soni tugadi. Iltimos, qayta kirish qiling.";
      resetToLogin();
    } else if (errorMessage.includes("expired") || errorMessage.includes("Invalid or expired")) {
      errorMessage = "Kod muddati tugagan. Iltimos, qayta kirish qiling.";
      resetToLogin();
    } else if (errorMessage.includes("Invalid OTP")) {
      errorMessage = "Noto'g'ri tasdiqlash kodi. Iltimos, qayta urinib ko'ring.";
    }

    errors.value.otp = errorMessage;
    toast.add({
      title: "Xatolik",
      description: errorMessage,
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const resendOtp = async () => {
  otpCode.value = "";
  errors.value = {};
  otpStep.value = false;

  // Re-submit credentials to get a new OTP
  await handleLogin();
};
</script>
