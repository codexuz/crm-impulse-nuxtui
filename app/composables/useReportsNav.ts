import { computed } from "vue";
import type { NavigationMenuItem } from "@nuxt/ui";

export const useReportsNav = () => {
  const reportsNavItems = computed<NavigationMenuItem[]>(() => [
    {
      label: "Arxivlangan o'quvchilar",
      icon: "i-lucide-archive",
      to: "/reports/archived-students",
    },
    {
      label: "Lidlar (o'qituvchi bo'yicha)",
      icon: "i-lucide-user-check",
      to: "/reports/leads-by-teacher",
    },
    {
      label: "Retention (o'qituvchi bo'yicha)",
      icon: "i-lucide-line-chart",
      to: "/reports/teacher-retention",
    },
  ]);

  return { reportsNavItems };
};
