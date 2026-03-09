"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, Shield, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth, type TelegramAuthData } from "@/lib/auth-context";

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthData) => void;
  }
}

function getTelegramDataFromUrl(): TelegramAuthData | null {
  if (typeof window === "undefined") return null;
  const qs = window.location.search || window.location.hash.slice(1);
  const params = new URLSearchParams(qs);
  const hash = params.get("hash");
  const id = params.get("id");
  const auth_date = params.get("auth_date");
  const first_name = params.get("first_name");
  if (!hash || !id || !auth_date || !first_name) return null;
  return {
    id: Number(id),
    first_name,
    last_name: params.get("last_name") ?? undefined,
    username: params.get("username") ?? undefined,
    photo_url: params.get("photo_url") ?? undefined,
    phone_number: params.get("phone_number") ?? undefined,
    auth_date: Number(auth_date),
    hash,
  };
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const handledRedirectRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Обработка возврата из Telegram по редиректу (параметры в URL) — тогда callback не вызывается
  useEffect(() => {
    if (handledRedirectRef.current) return;
    const data = getTelegramDataFromUrl();
    if (!data) return;
    handledRedirectRef.current = true;
    setIsLoading(true);
    login(data)
      .then(() => {
        window.history.replaceState({}, "", window.location.pathname);
        toast.success("Вы успешно вошли!");
        router.push("/");
      })
      .catch((e) => {
        handledRedirectRef.current = false;
        const message = e instanceof Error ? e.message : "Не удалось войти";
        toast.error("Не удалось войти через Telegram", { description: message });
      })
      .finally(() => setIsLoading(false));
  }, [login, router]);

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  useEffect(() => {
    if (!botUsername) return;
    if (!widgetRef.current) return;

    window.onTelegramAuth = async (tgUser: TelegramAuthData) => {
      setIsLoading(true);
      try {
        await login(tgUser);
        toast.success("Вы успешно вошли!");
        router.push("/");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Не удалось войти";
        toast.error("Не удалось войти через Telegram", {
          description: message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Inject Telegram Login Widget script
    widgetRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "true");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-auth-url", `${window.location.origin}/login`);
    widgetRef.current.appendChild(script);

    return () => {
      delete window.onTelegramAuth;
    };
  }, [botUsername, login, router]);

  const openTelegramBot = () => {
    if (!botUsername) {
      toast.error("Не задан username бота", {
        description: "Укажите NEXT_PUBLIC_TELEGRAM_BOT_USERNAME в .env.local",
      });
      return;
    }
    window.open(`https://t.me/${botUsername}?start=login`, "_blank");
    toast.info('Откройте бота в Telegram и нажмите "Start"');
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-20 pb-16 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="glow-card rounded-2xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
            <p className="text-muted-foreground">
              Войдите через Telegram для покупки билетов
            </p>
          </div>

          {/* Telegram Login */}
          <div className="space-y-4">
            {botUsername ? (
              <div className="flex items-center justify-center min-h-14">
                <div ref={widgetRef} />
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                Для входа укажи <span className="font-mono text-white">NEXT_PUBLIC_TELEGRAM_BOT_USERNAME</span> в{" "}
                <span className="font-mono text-white">.env.local</span>.
              </div>
            )}

            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Проверяем авторизацию...
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">или</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={openTelegramBot}
              className="w-full h-12 gap-3"
            >
              <Smartphone className="w-5 h-5" />
              Открыть бота в Telegram
            </Button>
          </div>

          {/* Features */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Быстрая регистрация без пароля</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Билеты приходят прямо в Telegram</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Безопасная авторизация</span>
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-center text-muted-foreground">
            Нажимая кнопку, вы соглашаетесь с{' '}
            <Link href="/terms" className="text-primary hover:underline">
              условиями использования
            </Link>{' '}
            и{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              политикой конфиденциальности
            </Link>
          </p>
        </div>

        {/* Help */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Проблемы со входом?{' '}
          <Link href="/help" className="text-primary hover:underline">
            Написать в поддержку
          </Link>
        </p>
      </div>
    </div>
  );
}
