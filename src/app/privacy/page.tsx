import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-wider mb-6">Политика конфиденциальности</h1>
        <p className="text-muted-foreground mb-8">
          Текст политики конфиденциальности будет добавлен. Мы храним только необходимые данные для работы сервиса и билетов.
        </p>
        <Link href="/">
          <Button variant="outline">На главную</Button>
        </Link>
      </div>
    </div>
  );
}
