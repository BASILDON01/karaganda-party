import {
  HelpCircle,
  Mail,
  Ticket,
  CreditCard,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SupportChatTrigger } from "@/components/support-chat-trigger";

const faq = [
  {
    q: "Как купить билет?",
    a: "Выберите мероприятие на главной, нажмите «Подробнее», выберите тип и количество билетов, нажмите «Оплатить». Вход выполняется через Telegram — если вы ещё не вошли, система предложит авторизоваться.",
    icon: Ticket,
  },
  {
    q: "Как войти в аккаунт?",
    a: "Нажмите «Войти через Telegram» на странице входа и подтвердите доступ в Telegram. Домен сайта должен быть разрешён в настройках бота — иначе обратитесь в поддержку.",
    icon: Shield,
  },
  {
    q: "Где мои билеты и QR-код?",
    a: "После покупки перейдите в раздел «Мои билеты» в меню. Там отображаются все купленные билеты. Нажмите «Показать QR-код» — код можно скопировать или показать на входе. Также можно отправить код в нашего Telegram-бота для проверки.",
    icon: Ticket,
  },
  {
    q: "Как вернуть билет?",
    a: "Возврат возможен не позднее чем за 24 часа до мероприятия при отмене или переносе события. Напишите в поддержку (Telegram или email) с указанием номера заказа или кода билета.",
    icon: CreditCard,
  },
  {
    q: "Не приходит подтверждение / не могу войти",
    a: "Проверьте, что на сайте открыт именно тот домен, который указан в BotFather для бота (например factorkz.com). Очистите cookie и попробуйте снова. Если проблема сохраняется — напишите в поддержку с описанием шагов и скриншотом ошибки.",
    icon: HelpCircle,
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="glow-card rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-wider">Помощь</h1>
              <p className="text-muted-foreground text-sm mt-1">Частые вопросы и контакты поддержки</p>
            </div>
          </div>

          <div className="space-y-6 mb-10">
            {faq.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.q}
                  className="border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors"
                >
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-white mb-2">{item.q}</h2>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/10 pt-8">
            <h2 className="text-xl font-bold tracking-wider mb-4">Связаться с поддержкой</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <SupportChatTrigger />
              <a
                href="mailto:support@factorkz.kz"
                className="glow-card rounded-xl p-5 flex items-center gap-4 hover:bg-white/5 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-white">Email</p>
                  <p className="text-sm text-muted-foreground">support@factorkz.kz</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="flex">
          <a href="/login">
            <Button variant="ghost">Войти</Button>
          </a>
        </div>
      </div>
    </div>
  );
}
