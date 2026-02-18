import { useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import { api, type AuthResponse } from "@/lib/api-client";
import { AuthContext, type AuthState } from "./authState";

interface User {
  readonly id: string;
  readonly email: string;
}

function toUser(data: AuthResponse): User {
  return { id: data.user.id, email: data.user.email };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getMe()
      .then((res) => {
        if (res.user) setUser({ id: res.user.id, email: res.user.email });
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.login(email, password);
    setUser(toUser(data));
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const data = await api.register(email, password);
    setUser(toUser(data));
  }, []);

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
