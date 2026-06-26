/**
 * Records the path of the route we are navigating away from, so pages can tell
 * where the user just came from. Used by `usePaginationState` to decide whether
 * to restore or reset list state (keep it only when returning from a detail
 * page, reset it on any other navigation).
 */
export default defineNuxtPlugin(() => {
  const router = useRouter();
  const previousRoutePath = useState<string>("previousRoutePath", () => "");

  router.beforeEach((to, from) => {
    previousRoutePath.value = from.path;
  });
});
