import { useAuth } from "~/composables/useAuth";

export const useFinancialAccess = () => {
  const { auth } = useAuth();

  const hasFinancialAccess = computed(() => {
    const roles = auth.value?.user?.roles;
    if (!roles || !Array.isArray(roles)) return false;

    return roles.some((role: any) => {
      const roleName = typeof role === "string" ? role : role?.name;
      return roleName === "owner" || roleName === "manager";
    });
  });

  return { hasFinancialAccess };
};
