<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import { useAuth } from "~/composables/useAuth";

defineProps<{
  collapsed?: boolean;
}>();

const colorMode = useColorMode();
const appConfig = useAppConfig();
const { auth, logout } = useAuth();
const toast = useToast();
const router = useRouter();

const colors = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];
const neutrals = ["slate", "gray", "zinc", "neutral", "stone"];

const user = computed(() => ({
  name: auth.value?.user?.name || auth.value?.user?.username || "User",
  avatar: auth.value?.user?.avatar_url
    ? {
        src: auth.value.user.avatar_url,
        alt: auth.value?.user?.name || "User",
      }
    : undefined,
}));

const handleLogout = async () => {
  try {
    await logout();
    toast.add({
      title: "Tizimdan chiqildi",
      description: "Siz muvaffaqiyatli tizimdan chiqdingiz",
    });
    router.push("/login");
  } catch (error) {
    console.error("Error logging out:", error);
    toast.add({
      title: "Xatolik",
      description: "Tizimdan chiqishda xatolik yuz berdi.",
      color: "error",
    });
  }
};

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: "label",
      label: user.value.name,
      avatar: user.value.avatar,
    },
  ],
  [
    {
      label: "Profil",
      icon: "i-lucide-user",
      to: "/profile",
    },
  ],
  [
    {
      label: "Ranglar",
      icon: "i-lucide-palette",
      children: [
        {
          label: "Asosiy rang",
          slot: "chip",
          chip: appConfig.ui.colors.primary,
          content: {
            align: "center",
            collisionPadding: 16,
          },
          children: colors.map((color) => ({
            label: color.charAt(0).toUpperCase() + color.slice(1),
            chip: color,
            slot: "chip",
            checked: appConfig.ui.colors.primary === color,
            type: "checkbox",
            onSelect: (e) => {
              e.preventDefault();
              appConfig.ui.colors.primary = color;
            },
          })),
        },
        {
          label: "Neytral rang",
          slot: "chip",
          chip:
            appConfig.ui.colors.neutral === "neutral"
              ? "old-neutral"
              : appConfig.ui.colors.neutral,
          content: {
            align: "end",
            collisionPadding: 16,
          },
          children: neutrals.map((color) => ({
            label: color.charAt(0).toUpperCase() + color.slice(1),
            chip: color === "neutral" ? "old-neutral" : color,
            slot: "chip",
            type: "checkbox",
            checked: appConfig.ui.colors.neutral === color,
            onSelect: (e) => {
              e.preventDefault();
              appConfig.ui.colors.neutral = color;
            },
          })),
        },
      ],
    },
    {
      label: "Ko'rinish",
      icon: "i-lucide-sun-moon",
      children: [
        {
          label: "Yorug'",
          icon: "i-lucide-sun",
          type: "checkbox",
          checked: colorMode.value === "light",
          onSelect(e: Event) {
            e.preventDefault();
            colorMode.preference = "light";
          },
        },
        {
          label: "Qorong'i",
          icon: "i-lucide-moon",
          type: "checkbox",
          checked: colorMode.value === "dark",
          onSelect(e: Event) {
            e.preventDefault();
            colorMode.preference = "dark";
          },
        },
      ],
    },
  ],
  [
    {
      label: "Chiqish",
      icon: "i-lucide-log-out",
      onSelect: handleLogout,
    },
  ],
]);
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{
      content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)',
    }"
  >
    <UButton
      v-bind="{
        ...user,
        label: collapsed ? undefined : user?.name,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down',
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed',
      }"
    />

    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`
          }"
        />
      </div>
    </template>
  </UDropdownMenu>
</template>
