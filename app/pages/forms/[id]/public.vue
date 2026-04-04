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

                    <ClientOnly>
                        <Vueform :schema="form.schema" :endpoint="false" :loading="submitting" @submit="onSubmit" />
                    </ClientOnly>
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
const { getFormPublic, submitResponse } = useFormsApi();

const form = ref<Form | null>(null);
const isLoading = ref(true);
const submitted = ref(false);
const submitting = ref(false);
const errorMsg = ref("");

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

async function onSubmit(form$: any) {
    submitting.value = true;
    errorMsg.value = "";

    try {
        await submitResponse(formId, form$.requestData);
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
