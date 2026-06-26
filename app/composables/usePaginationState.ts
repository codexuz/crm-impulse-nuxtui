import { useRoute, useState } from "#imports";

/**
 * Persists a piece of list state (page number, page size, search, filters)
 * across the round-trip to a detail page, and ONLY that round-trip.
 *
 * State is keyed by the current route path. It is restored when the user
 * returns directly from a detail page under this list (e.g. /exams ->
 * /exams/123 -> back to /exams). Arriving from anywhere else — the sidebar,
 * another section, or a fresh load — resets the value to its default.
 *
 * Usage:
 *   const page = usePaginationState("page", 1);
 *   const limit = usePaginationState("limit", 10);
 */
export function usePaginationState<T>(key: string, defaultValue: T) {
  const route = useRoute();
  const basePath = route.path;
  const state = useState<T>(
    `pagination:${basePath}:${key}`,
    () => defaultValue,
  );

  // The previous route is recorded by the route-history plugin. If we did not
  // come from a detail page under this list, start fresh. Done synchronously
  // during setup (before watchers are registered) so it triggers no reloads.
  if (import.meta.client) {
    const previousRoutePath = useState<string>("previousRoutePath", () => "");
    if (!previousRoutePath.value.startsWith(`${basePath}/`)) {
      state.value = defaultValue;
    }
  }

  return state;
}
