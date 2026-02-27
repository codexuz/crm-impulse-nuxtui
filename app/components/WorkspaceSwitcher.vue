<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import { api } from "~/lib/api";
import { useAuth } from "~/composables/useAuth";
import type { Branch } from "~/types";

defineProps<{
  collapsed?: boolean;
}>();

const { apiService } = useAuth();

const branches = ref<Branch[]>([]);

const workspaces = computed(() =>
  branches.value.length
    ? branches.value.map((b) => ({
      id: b.id,
      label: b.name,
      avatar: {
        src: "/android-chrome-512x512.png",
        alt: `${b.name} logotipi`,
      },
    }))
    : [
      {
        id: "default",
        label: "Impulse Academy",
        avatar: {
          src: "/android-chrome-512x512.png",
          alt: "Impulse Academy logotipi",
        },
      },
    ],
);
const selectedWorkspace = ref<(typeof workspaces.value)[0] | null>(null);

const currentWorkspace = computed(
  () => selectedWorkspace.value || workspaces.value[0],
);

const fetchBranches = async () => {
  try {
    const response = await api.get<any>(apiService.value, "/branches/");
    branches.value = Array.isArray(response) ? response : response?.data || [];
    if (branches.value.length && !selectedWorkspace.value) {
      selectedWorkspace.value = workspaces.value[0] ?? null;
    }
  } catch (error) {
    console.error("Failed to fetch branches:", error);
  }
};

onMounted(() => {
  fetchBranches();
});

const items = computed<DropdownMenuItem[][]>(() => {
  return [
    workspaces.value.map((workspace) => ({
      ...workspace,
      onSelect() {
        selectedWorkspace.value = workspace;
      },
    })),
  ];
});
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'center', collisionPadding: 12 }" :ui="{
    content: collapsed ? 'w-40' : 'w-(--reka-dropdown-menu-trigger-width)',
  }">
    <UButton v-bind="{
      ...currentWorkspace,
      label: collapsed ? undefined : currentWorkspace?.label,
      trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down',
    }" color="neutral" variant="ghost" block :square="collapsed" class="data-[state=open]:bg-elevated"
      :class="[!collapsed && 'py-2']" :ui="{
        trailingIcon: 'text-dimmed',
      }" />
  </UDropdownMenu>
</template>
