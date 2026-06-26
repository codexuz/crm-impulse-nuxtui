import { useRoute, useState } from "#imports";

/**
 * Persists a piece of pagination state (page number, page size, etc.) across
 * route navigation. State is keyed by the current route path, so leaving a
 * list page and returning to it (via sidebar, back button, or detail page)
 * restores the value the user left it on instead of resetting to the default.
 *
 * Usage:
 *   const page = usePaginationState("page", 1);
 *   const limit = usePaginationState("limit", 10);
 */
export function usePaginationState<T>(key: string, defaultValue: T) {
  const route = useRoute();
  return useState<T>(`pagination:${route.path}:${key}`, () => defaultValue);
}
