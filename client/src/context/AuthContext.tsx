import {
  AUTH_TOKEN_KEY,
  type AuthUser,
} from "@team-task-manager/shared";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchMe, login as loginApi, logoutApi, signup as signupApi } from "../api/auth";
import type { LoginPayload, SignupPayload } from "../api/auth";
import { ApiError } from "../api/client";
import { setTokenGetter } from "../api/client";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

type AuthContextValue = AuthState & {
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  fieldErrors: Record<string, string[]> | null;
  sessionError: string | null;
  clearErrors: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function storeToken(token: string | null) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(
    null,
  );
  const [sessionError, setSessionError] = useState<string | null>(null);

  const clearErrors = useCallback(() => {
    setError(null);
    setFieldErrors(null);
  }, []);

  const handleAuthSuccess = useCallback((authUser: AuthUser, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    storeToken(authToken);
    clearErrors();
  }, [clearErrors]);

  const handleAuthError = useCallback((err: unknown) => {
    if (err instanceof ApiError) {
      setError(err.message);
      setFieldErrors(err.details ?? null);
      return;
    }
    setError(err instanceof Error ? err.message : "Something went wrong");
    setFieldErrors(null);
  }, []);

  useEffect(() => {
    setTokenGetter(() => token);
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const stored = readStoredToken();
      if (!stored) {
        setIsLoading(false);
        return;
      }

      try {
        const { user: currentUser } = await fetchMe(stored);
        if (!cancelled) {
          setUser(currentUser);
          setToken(stored);
        }
      } catch {
        if (!cancelled) {
          storeToken(null);
          setUser(null);
          setToken(null);
          setSessionError("Your session expired. Please sign in again.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      clearErrors();
      try {
        const { user: authUser, token: authToken } = await loginApi(payload);
        handleAuthSuccess(authUser, authToken);
        setSessionError(null);
      } catch (err) {
        handleAuthError(err);
        throw err;
      }
    },
    [clearErrors, handleAuthSuccess, handleAuthError],
  );

  const signup = useCallback(
    async (payload: SignupPayload) => {
      clearErrors();
      try {
        const { user: authUser, token: authToken } = await signupApi(payload);
        handleAuthSuccess(authUser, authToken);
        setSessionError(null);
      } catch (err) {
        handleAuthError(err);
        throw err;
      }
    },
    [clearErrors, handleAuthSuccess, handleAuthError],
  );

  const logout = useCallback(async () => {
    try {
      if (token) await logoutApi(token);
    } catch {
      // Clear local session even if API call fails
    } finally {
      storeToken(null);
      setUser(null);
      setToken(null);
      setSessionError(null);
      clearErrors();
    }
  }, [token, clearErrors]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      login,
      signup,
      logout,
      error,
      fieldErrors,
      sessionError,
      clearErrors,
    }),
    [
      user,
      token,
      isLoading,
      login,
      signup,
      logout,
      error,
      fieldErrors,
      sessionError,
      clearErrors,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
