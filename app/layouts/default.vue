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
      label: "Talabalar va Guruhlar",
    },
    {
      label: "Talabalar",
      icon: "i-lucide-graduation-cap",
      to: "/students",
      defaultOpen: true,
      type: "trigger" as const,
      children: [
        {
          label: "Faol talabalar",
          to: "/students",
          exact: true,
          onSelect: () => {
            open.value = false;
          },
        },
        {
          label: "Arxiv talabalar",
          to: "/students/archive",
          onSelect: () => {
            open.value = false;
          },
        },
      ],
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "O'qituvchilar",
      icon: "i-lucide-users",
      to: "/teachers",
      defaultOpen: true,
      type: "trigger" as const,
      children: [
        {
          label: "O'qituvchilar",
          to: "/teachers",
          exact: true,
          onSelect: () => {
            open.value = false;
          },
        },
        ...(hasFinancialAccess.value
          ? [
              {
                label: "O'qituvchi profili",
                to: "/teachers/profile",
                onSelect: () => {
                  open.value = false;
                },
              },
            ]
          : []),
      ],
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
    {
      label: "Jadvallar",
      icon: "i-lucide-calendar",
      to: "/schedules",
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
      defaultOpen: true,
      type: "trigger" as const,
      children: [
        {
          label: "Leadlar",
          to: "/leads",
          exact: true,
          onSelect: () => {
            open.value = false;
          },
        },
        {
          label: "Sinov darslari",
          to: "/leads/lead-trials",
          onSelect: () => {
            open.value = false;
          },
        },
      ],
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "SMS Xabarnoma",
      icon: "i-lucide-message-square",
      to: "/sms/sms-posting",
      defaultOpen: true,
      type: "trigger" as const,
      children: [
        {
          label: "SMS yuborish",
          to: "/sms/sms-posting",
          exact: true,
          onSelect: () => {
            open.value = false;
          },
        },
        {
          label: "Hisobot",
          to: "/sms/report",
          onSelect: () => {
            open.value = false;
          },
        },
        {
          label: "Jo'natmalar",
          to: "/sms/send-sms",
          onSelect: () => {
            open.value = false;
          },
        },
        {
          label: "Shablonlar",
          to: "/sms/templates",
          onSelect: () => {
            open.value = false;
          },
        },
      ],
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Bildirishnomalar",
      icon: "i-lucide-bell",
      to: "/notifications",
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
      defaultOpen: true,
      type: "trigger" as const,
      children: [
        {
          label: "Qilingan to'lovlar",
          to: "/payments",
          exact: true,
          onSelect: () => {
            open.value = false;
          },
        },
        {
          label: "Kelayotgan to'lovlar",
          to: "/payments/upcoming",
          onSelect: () => {
            open.value = false;
          },
        },
        {
          label: "Qarzdorlar",
          to: "/payments/debitor",
          onSelect: () => {
            open.value = false;
          },
        },
      ],
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
            defaultOpen: true,
            type: "trigger" as const,
            children: [
              {
                label: "Barcha xarajatlar",
                to: "/expenses",
                exact: true,
                onSelect: () => {
                  open.value = false;
                },
              },
              {
                label: "Xarajatlar kategoriyasi",
                to: "/expenses/categories",
                onSelect: () => {
                  open.value = false;
                },
              },
            ],
            onSelect: () => {
              open.value = false;
            },
          },
        ]
      : []),
    ...(hasFinancialAccess.value
      ? [
          {
            label: "Oylik maoshlar",
            icon: "i-lucide-banknote",
            to: "/salaries",
            defaultOpen: true,
            type: "trigger" as const,
            children: [
              {
                label: "Maosh hisoblash",
                to: "/salaries",
                exact: true,
                onSelect: () => {
                  open.value = false;
                },
              },
              {
                label: "To'lov tarixi",
                to: "/salaries/history",
                onSelect: () => {
                  open.value = false;
                },
              },
            ],
            onSelect: () => {
              open.value = false;
            },
          },
        ]
      : []),
    {
      label: "CD IELTS",
      icon: "i-lucide-file-text",
      to: "/cd-ielts",
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

onMounted(async () => {
  const cookie = useCookie("cookie-consent");
  if (cookie.value === "accepted") {
    return;
  }

  toast.add({
    title:
      "We use first-party cookies to enhance your experience on our website.",
    description: "Please accept or opt out.",
    actions: [
      {
        label: "Accept",
        color: "neutral",
        variant: "outline",
        onClick: () => {
          cookie.value = "accepted";
        },
      },
      {
        label: "Opt out",
        color: "neutral",
        variant: "ghost",
      },
    ],
  });
});
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <WorkspaceSwitcher :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default"
        />

        <div class="space-y-4">
          <UNavigationMenu
            v-for="(linkGroup, index) in links"
            :key="index"
            :collapsed="collapsed"
            :items="linkGroup"
            orientation="vertical"
            tooltip
            popover
          />
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
