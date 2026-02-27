import { createApiService, api } from "~/lib/api";

export interface AuthState {
  token: string | null;
  user: any | null;
  isAuthenticated: boolean;
}

export interface OtpLoginResponse {
  otpRequired: boolean;
  otpToken: string;
  message: string;
}

export interface LoginSuccessResponse {
  access_token: string;
  refresh_token: string;
  user: any;
  sessionId: string;
  expiresAt: string;
  refreshExpiresAt: string;
}

export const useAuth = () => {
  // Create a cookie to store auth data
  const authCookie = useCookie<{
    token: string | null;
    user: any | null;
  }>("auth-data", {
    // Cookie options
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "strict",
    secure: true, // Always secure in production, can be overridden in development
  });

  // Initialize state from cookie if available
  const state = useState<AuthState>("auth", () => {
    if (!authCookie.value) {
      return {
        token: null,
        user: null,
        isAuthenticated: false,
      };
    }

    return {
      token: authCookie.value.token,
      user: authCookie.value.user,
      isAuthenticated: !!authCookie.value.token,
    };
  });

  const apiService = computed(() =>
    createApiService(
      "https://backend.impulselc.uz/api",
      state.value.token || undefined,
    ),
  );

  const login = async (
    username: string,
    password: string,
  ): Promise<OtpLoginResponse | LoginSuccessResponse> => {
    try {
      console.log("Attempting login with:", { username });

      // Validate input based on API requirements
      if (!username || typeof username !== "string") {
        throw new Error("Username should not be empty and must be a string");
      }

      if (!password || typeof password !== "string" || password.length < 6) {
        throw new Error(
          "Password must be longer than or equal to 6 characters and must be a string",
        );
      }

      // Try login with admin endpoint first
      try {
        const response = await api.post<any>(
          apiService.value,
          "/auth/admin/login",
          { username, password },
        );

        // If OTP is required, return the OTP response without setting auth state
        if (response.otpRequired) {
          return response as OtpLoginResponse;
        }

        // Direct login (no OTP) — set auth state
        setAuthState(response);
        return response;
      } catch (err) {
        console.log("Admin login attempt failed, trying standard endpoint");

        // If admin endpoint fails, try the standard login
        const response = await api.post<any>(
          apiService.value,
          "/auth/teachers/login",
          { username, password },
          {
            headers: {
              "user-agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
          },
        );

        // Set auth state
        setAuthState(response);
        return response;
      }
    } catch (error) {
      console.error("All login attempts failed:", error);

      // Handle the API error format with type-safety
      const apiError = error as any;
      if (
        apiError?.response?.data?.message &&
        Array.isArray(apiError.response.data.message)
      ) {
        const errorMessages = apiError.response.data.message.join(", ");
        throw new Error(errorMessages);
      }

      throw error;
    }
  };

  const verifyOtp = async (
    otpToken: string,
    code: string,
  ): Promise<LoginSuccessResponse> => {
    try {
      const response = await api.post<LoginSuccessResponse>(
        apiService.value,
        "/auth/admin/verify-otp",
        { otpToken, code },
      );

      setAuthState(response);
      return response;
    } catch (error) {
      console.error("OTP verification failed:", error);
      throw error;
    }
  };

  const setAuthState = (response: any) => {
    state.value = {
      token: response.access_token,
      user: response.user,
      isAuthenticated: true,
    };

    authCookie.value = {
      token: response.access_token,
      user: response.user,
    };
  };

  const logout = async () => {
    try {
      if (state.value.isAuthenticated) {
        await api.post<any>(apiService.value, "/auth/logout", {});
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear auth state regardless of API response
      state.value = {
        token: null,
        user: null,
        isAuthenticated: false,
      };

      // Remove auth cookie
      authCookie.value = {
        token: null,
        user: null,
      };
    }
  };

  return {
    auth: readonly(state),
    login,
    verifyOtp,
    logout,
    apiService,
  };
};
