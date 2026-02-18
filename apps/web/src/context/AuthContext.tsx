import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { api, setToken, type AuthResponse } from "@/lib/api-client";

interface User {
  readonly id: string;
  readonly email: string;
}

interface AuthState {
  readonly user: User | null;
  readonly isAuthenticated: boolean;
  readonly login: (email: string, password: string) => Promise<void>;
  readonly register: (email: string, password: string) => Promise<void>;
  readonly logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function handleAuthResponse(
  data: AuthResponse,
  setUser: (u: User) => void,
) {
  setToken(data.token);
  setUser({ id: data.user.id, email: data.user.email });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login(email, password);
    handleAuthResponse(data, setUser);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const data = await api.register(email, password);
    handleAuthResponse(data, setUser);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
