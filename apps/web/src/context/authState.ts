import { createContext } from "react";

interface User {
  readonly id: string;
  readonly email: string;
}

export interface AuthState {
  readonly user: User | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly login: (email: string, password: string) => Promise<void>;
  readonly register: (email: string, password: string) => Promise<void>;
  readonly logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);
