import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api, setTokens, clearTokens } from "../lib/api";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  photo?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const hasToken = !!localStorage.getItem("accessToken");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasToken);

  useEffect(() => {
    if (hasToken) {
      api<User>("/auth/me")
        .then(setUser)
        .catch(() => clearTokens())
        .finally(() => setLoading(false));
    }
  }, [hasToken]);

  async function login(email: string, password: string) {
    const data = await api<{ user: User; accessToken: string; refreshToken: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }), skipAuth: true },
    );
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  }

  async function register(input: { email: string; password: string; firstName: string; lastName: string }) {
    const data = await api<{ user: User; accessToken: string; refreshToken: string }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(input), skipAuth: true },
    );
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  }

  function logout() {
    clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
