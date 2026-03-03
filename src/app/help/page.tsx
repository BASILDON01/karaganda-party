import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HelpPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-wider mb-6">Помощь</h1>
        <p className="text-muted-foreground mb-4">
          По вопросам работы сайта и билетов пишите в поддержку:
        </p>
        <ul className="text-muted-foreground mb-8 list-disc list-inside space-y-2">
          <li>Telegram: @factorkz_bot</li>
          <li>Email: support@factorkz.kz</li>
        </ul>
        <Link href="/">
          <Button variant="outline">На главную</Button>
        </Link>
      </div>
    </div>
  );
}
