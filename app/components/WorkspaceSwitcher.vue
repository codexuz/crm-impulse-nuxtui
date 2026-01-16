<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

defineProps<{
  collapsed?: boolean;
}>();

const workspaces = ref([
  {
    label: "Impulse Study CRM",
    avatar: {
      icon: "i-lucide-graduation-cap",
      alt: "Impulse Study",
    },
  },
]);
const selectedWorkspace = ref(workspaces.value[0]);

const items = computed<DropdownMenuItem[][]>(() => {
  return [
    workspaces.value.map((workspace) => ({
      ...workspace,
      onSelect() {
        selectedWorkspace.value = workspace;
      },
    })),
    [
      {
        label: "Sozlamalar",
        icon: "i-lucide-cog",
      },
    ],
  ];
});
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{
      content: collapsed ? 'w-40' : 'w-(--reka-dropdown-menu-trigger-width)',
    }"
  >
    <UButton
      v-bind="{
        ...selectedWorkspace,
        label: collapsed ? undefined : selectedWorkspace?.label,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down',
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :class="[!collapsed && 'py-2']"
      :ui="{
        trailingIcon: 'text-dimmed',
      }"
    />
  </UDropdownMenu>
</template>
