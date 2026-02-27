<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { useAuth } from "~/composables/useAuth";

const route = useRoute();
const toast = useToast();
const { logout, auth } = useAuth();

const open = ref(false);

// Check if user has access to financial features
const hasFinancialAccess = computed(() => {
  return (
    auth.value?.user?.id === "d6bd8680-ca59-438c-95ed-ba363a86a065" ||
    auth.value?.user?.phone === "+998900064400"
  );
});

const links = [
  [
    {
      label: "Boshqaruv paneli",
      icon: "i-lucide-layout-dashboard",
      to: "/",
      onSelect: () => {
        open.value = false;
      },
    },
  ],
  [
    {
      type: "label" as const,
      label: "Marketing",
    },
    {
      label: "Leadlar",
      icon: "i-lucide-users-round",
      to: "/leads",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "SMS Xabarnoma",
      icon: "i-lucide-message-square",
      to: "/sms/send-sms",
      onSelect: () => {
        open.value = false;
      },
    },
  ],
  [
    {
      type: "label" as const,
      label: "Talabalar va Guruhlar",
    },
    {
      label: "Talabalar",
      icon: "i-lucide-graduation-cap",
      to: "/students",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "O'qituvchilar",
      icon: "i-lucide-users",
      to: "/teachers",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Guruhlar",
      icon: "i-lucide-users-2",
      to: "/groups",
      onSelect: () => {
        open.value = false;
      },
    },
  ],
  [
    {
      type: "label" as const,
      label: "O'quv Dasturlari",
    },
    {
      label: "Kurslar",
      icon: "i-lucide-book-open",
      to: "/courses",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Davomat",
      icon: "i-lucide-calendar-check",
      to: "/attendance",
      onSelect: () => {
        open.value = false;
      },
    },
  ],
  [
    {
      type: "label" as const,
      label: "Moliya",
    },
    {
      label: "To'lovlar",
      icon: "i-lucide-credit-card",
      to: "/payments",
      onSelect: () => {
        open.value = false;
      },
    },
    ...(hasFinancialAccess.value
      ? [
        {
          label: "Xarajatlar",
          icon: "i-lucide-receipt",
          to: "/expenses",
          onSelect: () => {
            open.value = false;
          },
        },
      ]
      : []),
  ],
  [
    {
      type: "label" as const,
      label: "Sozlamalar",
    },
    {
      label: "Sozlamalar",
      icon: "i-lucide-settings",
      to: "/settings",
      onSelect: () => {
        open.value = false;
      },
    },
  ],
] satisfies NavigationMenuItem[][];

const groups = computed(() => [
  {
    id: "links",
    label: "Go to",
    items: links.flat(),
  },
]);

// Handle logout
const handleLogout = async () => {
  try {
    await logout();
    toast.add({
      title: "Tizimdan chiqildi",
      description: "Siz muvaffaqiyatli tizimdan chiqdingiz",
    });
    navigateTo("/login");
  } catch (error) {
    console.error("Error logging out:", error);
    toast.add({
      title: "Xatolik",
      description:
        "Tizimdan chiqishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
    });
  }
};
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar id="default" v-model:open="open" collapsible resizable class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }">
      <template #header="{ collapsed }">
        <WorkspaceSwitcher :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <div class="space-y-4">
          <UNavigationMenu v-for="(linkGroup, index) in links" :key="index" :collapsed="collapsed" :items="linkGroup"
            orientation="vertical" tooltip popover />
        </div>
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
