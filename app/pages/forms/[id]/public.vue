<template>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <!-- Loading -->
        <div v-if="isLoading" class="text-center">
            <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p class="mt-3 text-gray-500">Yuklanmoqda…</p>
        </div>

        <!-- Not Found -->
        <div v-else-if="!form" class="text-center">
            <UIcon name="i-lucide-file-x" class="size-12 text-gray-400 mx-auto mb-4" />
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Forma topilmadi</h1>
            <p class="text-gray-500 mt-2">Bu forma o'chirilgan yoki havola noto'g'ri bo'lishi mumkin.</p>
        </div>

        <!-- Success -->
        <div v-else-if="submitted" class="text-center max-w-md">
            <div
                class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <UIcon name="i-lucide-check" class="size-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Rahmat!</h1>
            <p class="text-gray-500 mt-2">Javobingiz muvaffaqiyatli yuborildi.</p>
        </div>

        <!-- Form -->
        <div v-else class="w-full max-w-2xl">
            <UCard>
                <template #header>
                    <h1 class="text-2xl font-bold">{{ form.title }}</h1>
                </template>

                <div>
                    <p v-if="errorMsg" class="text-sm text-red-500 mb-4">{{ errorMsg }}</p>

                    <!-- SMS verification gate -->
                    <div v-if="form.smsVerification && !phoneVerified" class="space-y-4">
                        <p class="text-sm text-gray-500">
                            Formani to'ldirishdan oldin telefon raqamingizni tasdiqlang.
                        </p>

                        <UFormField label="Telefon raqam" required>
                            <UInput v-model="phone" type="tel" placeholder="+998 90 123 45 67" size="lg"
                                class="w-full" :disabled="codeSent" />
                        </UFormField>

                        <UFormField v-if="codeSent" label="SMS kod" required>
                            <UInput v-model="code" inputmode="numeric" placeholder="6 xonali kod" size="lg"
                                class="w-full" />
                        </UFormField>

                        <UButton v-if="!codeSent" block size="lg" :loading="sendingOtp" :disabled="!phone.trim()"
                            label="Kod yuborish" @click="sendOtp" />
                        <template v-else>
                            <UButton block size="lg" :disabled="!code.trim()" label="Tasdiqlash"
                                @click="phoneVerified = true" />
                            <UButton block size="sm" color="neutral" variant="ghost" :loading="sendingOtp"
                                label="Raqamni o'zgartirish" @click="resetOtp" />
                        </template>
                    </div>

                    <FormsFormRenderer
                        v-else-if="form.schema?.fields?.length"
                        :fields="form.schema.fields" :loading="submitting" @submit="onSubmit" />
                    <div v-else class="text-center py-8 text-gray-400">
                        <p>Bu formada maydonlar yo'q</p>
                    </div>
                </div>
            </UCard>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Form } from "~/types";

definePageMeta({
    layout: false,
});

const route = useRoute();
const formId = route.params.id as string;
const { getFormPublic, requestResponseOtp, submitResponse } = useFormsApi();

const form = ref<Form | null>(null);
const isLoading = ref(true);
const submitted = ref(false);
const submitting = ref(false);
const errorMsg = ref("");

// SMS verification state
const phone = ref("");
const code = ref("");
const codeSent = ref(false);
const sendingOtp = ref(false);
const phoneVerified = ref(false);

useHead({
    title: computed(() => form.value?.title ?? "Forma"),
});

async function loadForm() {
    try {
        isLoading.value = true;
        form.value = await getFormPublic(formId);
    } catch {
        form.value = null;
    } finally {
        isLoading.value = false;
    }
}

async function sendOtp() {
    if (!phone.value.trim()) return;
    sendingOtp.value = true;
    errorMsg.value = "";

    try {
        await requestResponseOtp(formId, phone.value.trim());
        codeSent.value = true;
    } catch (e: any) {
        errorMsg.value = e?.message || "Kod yuborishda xatolik yuz berdi. Qayta urinib ko'ring.";
    } finally {
        sendingOtp.value = false;
    }
}

function resetOtp() {
    codeSent.value = false;
    code.value = "";
    errorMsg.value = "";
}

async function onSubmit(answers: Record<string, any>) {
    submitting.value = true;
    errorMsg.value = "";

    try {
        const verification = form.value?.smsVerification
            ? { phone: phone.value.trim(), code: code.value.trim() }
            : undefined;
        await submitResponse(formId, answers, verification);
        submitted.value = true;
    } catch (e: any) {
        errorMsg.value = e?.message || "Yuborishda xatolik yuz berdi. Qayta urinib ko'ring.";
    } finally {
        submitting.value = false;
    }
}

onMounted(() => {
    loadForm();
});
</script>
