import { Hero } from '@/components/hero';
import { PartyCard } from '@/components/party-card';
import { parties, organizers } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Filter, Sparkles, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const upcomingParties = parties.filter(p => p.status === 'upcoming');
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "factorkz_bot";

  return (
    <div className="min-h-screen">
      <Hero />

      {/* Filters */}
      <section className="sticky top-16 md:top-20 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
            <Button variant="outline" size="sm" className="shrink-0 gap-2">
              <Filter className="w-4 h-4" />
              Фильтры
            </Button>
            <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-white transition-colors px-4 py-2">
              Все
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors px-4 py-2 border-white/20">
              Сегодня
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors px-4 py-2 border-white/20">
              Эти выходные
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors px-4 py-2 border-white/20">
              Techno
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors px-4 py-2 border-white/20">
              House
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors px-4 py-2 border-white/20">
              Hip-Hop
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors px-4 py-2 border-white/20">
              18+
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors px-4 py-2 border-white/20">
              21+
            </Badge>
          </div>
        </div>
      </section>

      {/* Hot parties */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-wider">ГОРЯЧИЕ ПАТИ</h2>
                <p className="text-muted-foreground text-sm mt-1">Самые популярные события</p>
              </div>
            </div>
            <Link href="/all" className="hidden md:flex">
              <Button variant="ghost" className="gap-2">
                Все события
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="party-grid">
            {upcomingParties.map((party) => (
              <PartyCard key={party.id} party={party} />
            ))}
          </div>

          <div className="md:hidden mt-8 text-center">
            <Link href="/all">
              <Button variant="outline" className="gap-2">
                Все события
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Organizers */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-wider">ОРГАНИЗАТОРЫ</h2>
                <p className="text-muted-foreground text-sm mt-1">Проверенные команды</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {organizers.map((org) => (
              <Link
                key={org.id}
                href={`/organizer/${org.id}`}
                className="group glow-card rounded-2xl p-6 flex items-center gap-4"
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={org.logo || ''}
                    alt={org.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-white truncate group-hover:text-primary transition-colors">
                      {org.name}
                    </h3>
                    {org.verified && (
                      <Badge className="bg-primary/20 text-primary border-0 text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {org.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=600&fit=crop')`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-purple-900/80" />

            <div className="relative z-10 px-8 py-16 md:px-16 md:py-24 text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-wider mb-4">
                ОРГАНИЗУЕШЬ ПАТИ?
              </h2>
              <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
                Размести своё событие на нашей платформе и продавай билеты тысячам гостей Караганды
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="xl" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  Стать организатором
                </Button>
                <Button size="xl" variant="outline" className="border-white text-white hover:bg-white/10">
                  Узнать больше
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <span className="text-xl font-bold">FactorKZ</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Лучшие вечеринки Караганды в одном месте
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Покупателям</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/my-tickets" className="hover:text-white transition-colors">Мои билеты</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Помощь</Link></li>
                <li><Link href="/refund" className="hover:text-white transition-colors">Возврат</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Организаторам</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/create-party" className="hover:text-white transition-colors">Создать пати</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Тарифы</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Документация</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Контакты</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Telegram: @{botUsername}</li>
                <li>Instagram: @factorkz</li>
                <li>support@factorkz.kz</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              2026 FactorKZ. Все права защищены.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-white transition-colors">Политика конфиденциальности</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Условия использования</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
