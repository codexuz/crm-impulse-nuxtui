import { computed } from "vue";
import type { NavigationMenuItem } from "@nuxt/ui";
import { useFinancialAccess } from "~/composables/useFinancialAccess";

export const usePaymentNav = () => {
  const { hasFinancialAccess } = useFinancialAccess();

  const paymentNavItems = computed<NavigationMenuItem[]>(() => {
    const items: NavigationMenuItem[] = [
      {
        label: "To'lovlar",
        icon: 'i-lucide-credit-card',
        to: '/payments'
      },
      {
        label: "Kelayotgan to'lovlar",
        icon: 'i-lucide-calendar-clock',
        to: '/payments/upcoming'
      },
      {
        label: 'Qarzdorlar',
        icon: 'i-lucide-alert-triangle',
        to: '/payments/debitor'
      }
    ];

    if (hasFinancialAccess.value) {
      items.push({
        label: 'Hisobot',
        icon: 'i-lucide-bar-chart-2',
        to: '/payments/report'
      });
    }

    return items;
  });

  return {
    paymentNavItems
  };
};
