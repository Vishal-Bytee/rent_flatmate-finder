import { createContext, ReactNode, useEffect, useState } from "react";
import { User } from "../types";
import { authApi } from "../api/endpoints";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; role: "TENANT" | "OWNER"; phone?: string }) => Promise<User>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  function persist(user: User, token: string) {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    setUser(user);
    setToken(token);
  }

  async function login(email: string, password: string) {
    const { user, token } = await authApi.login({ email, password });
    persist(user, token);
    return user as User;
  }

  async function register(data: { name: string; email: string; password: string; role: "TENANT" | "OWNER"; phone?: string }) {
    const { user, token } = await authApi.register(data);
    persist(user, token);
    return user as User;
  }

  function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
