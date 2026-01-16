<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

const appConfig = useAppConfig();

// Load saved colors from localStorage on mount
onMounted(() => {
  if (process.client) {
    const savedPrimary = localStorage.getItem("theme-color-primary");
    const savedNeutral = localStorage.getItem("theme-color-neutral");

    if (savedPrimary) {
      appConfig.ui.colors.primary = savedPrimary;
    }
    if (savedNeutral) {
      appConfig.ui.colors.neutral = savedNeutral;
    }
  }
});

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

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: "Primary",
      slot: "chip",
      chip: appConfig.ui.colors.primary,
      icon: "i-lucide-palette",
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
          if (process.client) {
            localStorage.setItem("theme-color-primary", color);
          }
        },
      })),
    },
    {
      label: "Neutral",
      slot: "chip",
      chip:
        appConfig.ui.colors.neutral === "neutral"
          ? "old-neutral"
          : appConfig.ui.colors.neutral,
      icon: "i-lucide-layers",
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
          if (process.client) {
            localStorage.setItem("theme-color-neutral", color);
          }
        },
      })),
    },
  ],
]);
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton
      icon="i-lucide-palette"
      label="Ranglar"
      color="neutral"
      variant="ghost"
      trailing-icon="i-lucide-chevron-down"
    />

    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`,
          }"
        />
      </div>
    </template>
  </UDropdownMenu>
</template>
