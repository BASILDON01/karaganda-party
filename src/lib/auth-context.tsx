'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "./types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (telegramData: TelegramAuthData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { ok: boolean; user: User };
        if (!cancelled && data?.ok && data.user) {
          setUser(data.user);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (telegramData: TelegramAuthData) => {
    const res = await fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(telegramData),
    });

    const data = (await res.json()) as {
      ok?: boolean;
      user?: User;
      error?: string;
      reason?: string;
    };

    if (!res.ok) {
      const msg =
        data?.reason === "hash_mismatch"
          ? "Ошибка проверки подписи (проверь TELEGRAM_BOT_TOKEN на сервере)"
          : data?.reason === "auth_date_expired"
            ? "Сессия Telegram истекла, нажмите кнопку входа снова"
            : data?.reason
              ? `Ошибка: ${data.reason}`
              : "Telegram auth failed";
      throw new Error(msg);
    }

    if (data?.ok && data.user) {
      setUser(data.user);
    } else {
      throw new Error("Telegram auth failed");
    }
  };

  const logout = () => {
    void fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
