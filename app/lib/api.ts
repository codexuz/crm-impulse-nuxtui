export interface ApiService {
  baseUrl: string;
  headers: HeadersInit;
}

import { useAuth } from "~/composables/useAuth";
import { useNuxtApp, navigateTo } from "#app";

export const createApiService = (
  baseUrl: string,
  token?: string
): ApiService => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return {
    baseUrl,
    headers,
  };
};

export const fetchApi = async <T>(
  apiService: ApiService,
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  try {
    const response = await fetch(`${apiService.baseUrl}${endpoint}`, {
      headers: apiService.headers,
      ...options,
    });

    if (!response.ok) {
      // Handle 401 Unauthorized errors specially
      if (response.status === 401) {
        // Get the Nuxt app instance to use composables
        const nuxtApp = useNuxtApp();

        // Use the logout function from the auth composable
        const { logout } = useAuth();
        logout();

        // Redirect to login page
        navigateTo("/login");

        throw new Error("Your session has expired. Please log in again.");
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `API error: ${response.status} ${response.statusText}`
      );
    }

    // For 204 No Content responses, return null without trying to parse JSON
    if (response.status === 204) {
      return null as T;
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

// Helper methods for common HTTP methods
export const api = {
  get: <T>(
    apiService: ApiService,
    endpoint: string,
    options?: RequestInit
  ): Promise<T> => {
    return fetchApi<T>(apiService, endpoint, { method: "GET", ...options });
  },

  post: <T>(
    apiService: ApiService,
    endpoint: string,
    data: any,
    options?: RequestInit
  ): Promise<T> => {
    return fetchApi<T>(apiService, endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    });
  },

  put: <T>(
    apiService: ApiService,
    endpoint: string,
    data: any,
    options?: RequestInit
  ): Promise<T> => {
    return fetchApi<T>(apiService, endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      ...options,
    });
  },

  patch: <T>(
    apiService: ApiService,
    endpoint: string,
    data: any,
    options?: RequestInit
  ): Promise<T> => {
    return fetchApi<T>(apiService, endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
      ...options,
    });
  },

  delete: <T>(
    apiService: ApiService,
    endpoint: string,
    options?: RequestInit
  ): Promise<T> => {
    return fetch(`${apiService.baseUrl}${endpoint}`, {
      method: "DELETE",
      headers: apiService.headers,
      ...options,
    })
      .then(async (response) => {
        // Check if response is OK
        if (!response.ok) {
          // Handle 401 Unauthorized errors specially
          if (response.status === 401) {
            // Get the Nuxt app instance to use composables
            const nuxtApp = useNuxtApp();

            // Use the logout function from the auth composable
            const { logout } = useAuth();
            logout();

            // Redirect to login page
            navigateTo("/login");

            throw new Error("Your session has expired. Please log in again.");
          }

          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `API error: ${response.status} ${response.statusText}`
          );
        }

        // For 204 No Content responses, return null without trying to parse JSON
        if (response.status === 204) {
          return null as T;
        }

        return response.json() as Promise<T>;
      })
      .catch((error) => {
        console.error("API request failed:", error);
        throw error;
      });
  },
};
