"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? searchParams.get("order_id") ?? "";
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "not_found">("loading");

  useEffect(() => {
    if (!orderId) {
      setStatus("not_found");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/payment/order/${orderId}`);
        const data = (await res.json()) as { ok?: boolean; order?: { status: string } };
        if (cancelled) return;
        if (data?.ok && data.order) {
          setStatus(data.order.status === "paid" ? "paid" : "pending");
        } else {
          setStatus("not_found");
        }
      } catch {
        if (!cancelled) setStatus("not_found");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (status === "loading") {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center px-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Проверяем оплату...</p>
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center px-4">
        <p className="text-muted-foreground mb-6">Заказ не найден или ссылка неверная.</p>
        <Button asChild>
          <Link href="/">На главную</Link>
        </Button>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center px-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-lg font-medium mb-2">Ожидаем подтверждение оплаты</p>
        <p className="text-muted-foreground text-sm mb-6">
          Билеты появятся в разделе «Мои билеты» после зачисления платежа. Обычно это 1–2 минуты.
        </p>
        <Button asChild variant="outline">
          <Link href="/my-tickets">Мои билеты</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 flex flex-col items-center justify-center px-4">
      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Оплата прошла успешно</h1>
      <p className="text-muted-foreground mb-8">Билеты уже в разделе «Мои билеты».</p>
      <Button asChild>
        <Link href="/my-tickets">Перейти к билетам</Link>
      </Button>
    </div>
  );
}
