'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Ticket, QrCode, Download, ChevronRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDate } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { useTickets } from '@/lib/tickets-context';
import type { PurchasedTicket } from '@/lib/types';
import { toast } from 'sonner';

export default function MyTicketsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { tickets, getActiveTickets, getUsedTickets } = useTickets();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "factorkz_bot";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const activeTickets = getActiveTickets();
  const usedTickets = getUsedTickets();

  const groupTickets = (list: PurchasedTicket[]) => {
    const groups: PurchasedTicket[][] = [];
    const seen = new Set<string>();
    for (const t of list) {
      const key = `${t.party.id}-${t.ticketType.id}-${t.purchasedAt}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const group = list.filter(
        (x) => x.party.id === t.party.id && x.ticketType.id === t.ticketType.id && x.purchasedAt === t.purchasedAt
      );
      groups.push(group);
    }
    return groups;
  };

  const activeGroups = groupTickets(activeTickets);
  const usedGroups = groupTickets(usedTickets);

  const copyQRCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('QR-код скопирован!');
  };

  const openTelegramBot = (qrCode: string) => {
    window.open(`https://t.me/${botUsername}?start=verify_${qrCode}`, "_blank");
  };

  const downloadPDF = (ticket: PurchasedTicket) => {
    // In real app, this would generate/download a PDF
    toast.success('PDF билет скачан!', {
      description: 'Файл сохранён в папку загрузок',
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        {tickets.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Ticket className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Билетов пока нет</h2>
            <p className="text-muted-foreground mb-8">
              Купите билеты на интересующее вас мероприятие
            </p>
            <Link href="/">
              <Button size="lg">Найти события</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active tickets */}
            {activeGroups.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Активные билеты ({activeTickets.length})
                </h2>

                <div className="grid gap-6">
                  {activeGroups.map((group) => {
                    const ticket = group[0];
                    const count = group.length;
                    const totalSum = group.reduce((s, t) => s + t.ticketType.price * t.quantity, 0);
                    const groupKey = `${ticket.party.id}-${ticket.ticketType.id}-${ticket.purchasedAt}`;
                    const isExpanded = selectedTicket === groupKey;
                    return (
                      <div key={groupKey} className="glow-card rounded-2xl overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="relative w-full md:w-64 h-48 md:h-auto shrink-0">
                            <Image
                              src={ticket.party.image}
                              alt={ticket.party.name}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/50 md:bg-gradient-to-b md:from-transparent md:to-black/50" />
                          </div>
                          <div className="flex-1 p-6 space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <Badge className="bg-green-500/20 text-green-500 border-0 mb-2">Активен</Badge>
                                <h3 className="text-2xl font-bold tracking-wide">{ticket.party.name}</h3>
                                <p className="text-muted-foreground">
                                  {ticket.ticketType.name} x {count}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-sm text-muted-foreground">Сумма</span>
                                <p className="text-xl font-bold">{formatPrice(totalSum)}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span>{formatDate(ticket.party.date)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4 text-primary" />
                                <span>{ticket.party.time}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span>{ticket.party.venue.name}</span>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                              <Button
                                onClick={() => setSelectedTicket(isExpanded ? null : groupKey)}
                                className="gap-2"
                              >
                                <QrCode className="w-4 h-4" />
                                {isExpanded ? 'Скрыть QR-коды' : `Показать QR-коды (${count})`}
                              </Button>
                              <Button variant="outline" className="gap-2" onClick={() => downloadPDF(ticket)}>
                                <Download className="w-4 h-4" />
                                Скачать PDF
                              </Button>
                              <Link href={`/party/${ticket.party.slug}`}>
                                <Button variant="ghost" className="gap-2 w-full sm:w-auto">
                                  Подробнее
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="border-t border-white/10 p-6 bg-black/30 space-y-6">
                            {group.map((t, i) => (
                              <div key={t.id} className="flex flex-col md:flex-row items-center gap-6">
                                <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center p-4 shrink-0">
                                  <QrCode className="w-32 h-32 text-black" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                  <h4 className="text-lg font-bold mb-2">
                                    Билет {count > 1 ? `${i + 1} из ${count}` : ''}
                                  </h4>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 justify-center md:justify-start">
                                    <button
                                      onClick={() => copyQRCode(t.qrCode)}
                                      className="font-mono text-sm text-muted-foreground bg-white/5 rounded-lg px-4 py-2 inline-flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer w-full sm:w-auto"
                                    >
                                      <span className="truncate">{t.qrCode}</span>
                                      <span className="ml-2 text-primary shrink-0">Копировать</span>
                                    </button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-2 w-full sm:w-auto"
                                      onClick={() => openTelegramBot(t.qrCode)}
                                    >
                                      <Send className="w-4 h-4" />
                                      Открыть в Telegram
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <p className="text-sm text-muted-foreground">
                              Покажите QR-код на входе или отправьте его в наш Telegram-бот для проверки
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Used tickets */}
            {usedGroups.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  Использованные билеты ({usedTickets.length})
                </h2>

                <div className="grid gap-4 opacity-60">
                  {usedGroups.map((group) => {
                    const ticket = group[0];
                    const count = group.length;
                    const groupKey = `${ticket.party.id}-${ticket.ticketType.id}-${ticket.purchasedAt}`;
                    return (
                    <div key={groupKey} className="glow-card rounded-xl p-4 flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={ticket.party.image}
                          alt={ticket.party.name}
                          fill
                          className="object-cover grayscale"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{ticket.party.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {ticket.ticketType.name} x {count}
                        </p>
                      </div>
                      <Badge variant="secondary">Использован</Badge>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="glow-card rounded-xl p-6 mt-8">
              <h3 className="font-bold text-lg mb-4">Как использовать билет?</h3>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Покажите QR-код</h4>
                    <p className="text-sm text-muted-foreground">На входе покажите QR-код охраннику или волонтёру</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Telegram-бот</h4>
                    <p className="text-sm text-muted-foreground">Или отправьте код в нашего бота @factorkz_bot</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Получите браслет</h4>
                    <p className="text-sm text-muted-foreground">После проверки вам выдадут браслет соответствующего цвета</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
