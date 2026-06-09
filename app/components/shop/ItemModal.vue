<script setup lang="ts">
import {
  useShop,
  type ShopItem,
  type CreateShopItemPayload,
} from "~/composables/useShop";

const props = defineProps<{
  open: boolean;
  // When provided the modal edits this item; otherwise it creates a new one.
  item?: ShopItem | null;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  saved: [];
}>();

const { createItem, updateItem } = useShop();
const toast = useToast();

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emit("update:open", v),
});

const isEdit = computed(() => !!props.item);

const form = reactive({
  name: "",
  description: "",
  image_url: "",
  price: 0,
  // Empty string means unlimited stock.
  stock: "" as number | "",
  is_active: true,
});

const isSubmitting = ref(false);

const resetForm = () => {
  const it = props.item;
  form.name = it?.name ?? "";
  form.description = it?.description ?? "";
  form.image_url = it?.image_url ?? "";
  form.price = it?.price ?? 0;
  form.stock = it?.stock ?? "";
  form.is_active = it?.is_active ?? true;
};

watch(
  () => props.open,
  (open) => {
    if (open) resetForm();
  },
);

const submit = async () => {
  if (!form.name.trim()) {
    toast.add({ title: "Xatolik", description: "Mahsulot nomini kiriting.", color: "error" });
    return;
  }
  if (!form.price || form.price <= 0) {
    toast.add({ title: "Xatolik", description: "Narxni to'g'ri kiriting (coin).", color: "error" });
    return;
  }

  const payload: CreateShopItemPayload = {
    name: form.name.trim(),
    description: form.description.trim() || null,
    image_url: form.image_url.trim() || null,
    price: Number(form.price),
    stock: form.stock === "" ? null : Number(form.stock),
    is_active: form.is_active,
  };

  isSubmitting.value = true;
  try {
    if (isEdit.value && props.item) {
      await updateItem(props.item.id, payload);
    } else {
      await createItem(payload);
    }
    toast.add({
      title: "Muvaffaqiyat",
      description: isEdit.value ? "Mahsulot yangilandi." : "Mahsulot qo'shildi.",
      color: "success",
    });
    isOpen.value = false;
    emit("saved");
  } catch (error) {
    console.error("Failed to save shop item:", error);
    toast.add({
      title: "Xatolik",
      description: "Mahsulotni saqlashda xatolik yuz berdi.",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <UModal v-model:open="isOpen" :title="isEdit ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'">
    <template #body>
      <form @submit.prevent="submit" class="space-y-4">
        <UFormField label="Nomi" name="name">
          <UInput v-model="form.name" placeholder="Mahsulot nomi" class="w-full" />
        </UFormField>

        <UFormField label="Tavsifi" name="description">
          <UTextarea v-model="form.description" placeholder="Tavsif (ixtiyoriy)" :rows="3" class="w-full" />
        </UFormField>

        <UFormField label="Rasm URL" name="image_url">
          <UInput v-model="form.image_url" placeholder="https://..." class="w-full" />
        </UFormField>

        <UFormField label="Narxi (coin)" name="price">
          <UInput v-model.number="form.price" type="number" min="1" placeholder="Narx coinda" class="w-full" />
        </UFormField>

        <UFormField label="Zaxira (bo'sh = cheksiz)" name="stock">
          <UInput v-model.number="form.stock" type="number" min="0" placeholder="Cheksiz" class="w-full" />
        </UFormField>

        <UFormField label="Faol" name="is_active">
          <USwitch v-model="form.is_active" />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton label="Bekor qilish" color="neutral" variant="outline" @click="isOpen = false" />
        <UButton :label="isEdit ? 'Saqlash' : 'Qo\'shish'" color="primary" :loading="isSubmitting" @click="submit" />
      </div>
    </template>
  </UModal>
</template>
