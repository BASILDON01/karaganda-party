import Link from "next/link";

import {
  ChevronLeft,
  Check,
  Sparkles,
  Zap,
  Crown,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Старт",
    description: "Для небольших мероприятий",
    price: "0",
    period: "₸",
    features: [
      "До 3 мероприятий в месяц",
      "Базовый QR-билет",
      "Чат поддержки",
      "Статистика продаж",
    ],
    cta: "Начать бесплатно",
    href: "/create-party",
    popular: false,
    icon: Sparkles,
  },
  {
    name: "Про",
    description: "Для активных организаторов",
    price: "15 000",
    period: "₸/мес",
    features: [
      "Безлимит мероприятий",
      "Приоритетная модерация",
      "Продвижение в ленте",
      "Расширенная статистика",
      "API-доступ",
    ],
    cta: "Подключить",
    href: "/create-party",
    popular: true,
    icon: Zap,
  },
  {
    name: "Премиум",
    description: "Для крупных промоутеров",
    price: "45 000",
    period: "₸/мес",
    features: [
      "Всё из тарифа Про",
      "Выделенная поддержка",
      "Интеграция с вашим сайтом",
      "Кастомизация билетов",
      "Рекомендации в рассылках",
    ],
    cta: "Связаться с нами",
    href: "mailto:support@factorkz.kz",
    popular: false,
    icon: Crown,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          На главную
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold tracking-wider mb-4">ТАРИФЫ</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Выберите план для продвижения ваших мероприятий на FactorKZ
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`glow-card rounded-2xl p-6 flex flex-col relative ${
                  plan.popular ? "ring-2 ring-primary shadow-lg shadow-primary/20" : ""
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                    Популярный
                  </span>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href}>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              На главную
            </Button>
          </Link>
          <Link href="/docs">
            <Button variant="ghost">Документация</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
