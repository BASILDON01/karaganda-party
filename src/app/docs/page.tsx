import Link from "next/link";

import {
  ChevronLeft,
  FileText,
  Plus,
  Ticket,
  Image as ImageIcon,
  Calendar,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const sections = [
  {
    title: "Создание мероприятия",
    icon: Plus,
    items: [
      {
        h: "Как добавить пати",
        p: "Перейдите в раздел «Создать пати» и заполните форму: название, описание, дату, время, место и типы билетов. Заявка отправляется на модерацию, после одобрения мероприятие появится в ленте.",
      },
      {
        h: "Обязательные поля",
        p: "Название, дата, время начала и место — обязательны. Добавьте хотя бы один тип билета с ценой и количеством. Обложка не обязательна, но повышает интерес к событию.",
      },
    ],
  },
  {
    title: "Типы билетов",
    icon: Ticket,
    items: [
      {
        h: "Настройка билетов",
        p: "Можно создать несколько типов: стандарт, VIP, early bird и т.д. Укажите название, цену (₸), количество мест и при необходимости описание.",
      },
      {
        h: "QR-коды",
        p: "Каждый проданный билет получает уникальный QR-код. Покупатель видит его в разделе «Мои билеты». На входе можно сканировать код через наш бот или приложение.",
      },
    ],
  },
  {
    title: "Обложка и оформление",
    icon: ImageIcon,
    items: [
      {
        h: "Требования к изображению",
        p: "Формат JPG или PNG, размер до 2 МБ. Рекомендуемый размер: 800×600 px и более. Избегайте мелкого текста — обложка отображается в карточках.",
      },
    ],
  },
  {
    title: "Модерация",
    icon: Settings,
    items: [
      {
        h: "Как проходит проверка",
        p: "Заявки проверяются в течение 24 часов (на тарифе Про — быстрее). Если нужны правки, мы свяжемся с вами. После одобрения событие автоматически появляется на сайте.",
      },
    ],
  },
  {
    title: "Дополнительно",
    icon: Calendar,
    items: [
      {
        h: "Отмена и перенос",
        p: "При отмене или переносе события свяжитесь с поддержкой. Покупателям будет предложен возврат согласно правилам платформы.",
      },
      {
        h: "Статистика",
        p: "В личном кабинете организатора отображается количество проданных билетов по каждому типу и выручка.",
      },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          На главную
        </Link>

        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-wider">Документация</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Руководство для организаторов FactorKZ
            </p>
          </div>
        </div>

        <div className="space-y-10">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="glow-card rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-white">{section.title}</h2>
                </div>
                <div className="space-y-6">
                  {section.items.map((item) => (
                    <div key={item.h}>
                      <h3 className="font-semibold text-white mb-2">{item.h}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.p}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex gap-4">
          <Link href="/create-party">
            <Button className="gap-2">Создать пати</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline">Тарифы</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              На главную
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
