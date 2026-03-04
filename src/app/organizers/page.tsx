'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  Calendar,
  Ticket,
  TrendingUp,
  Loader2,
  ExternalLink,
  Clock,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import type { Party } from '@/lib/types';

type PartyWithStats = Party & { actualSold: number; revenue: number; usedCount: number };

type DashboardData = {
  parties: PartyWithStats[];
  pendingSubmissions: number;
  stats: { partiesCount: number; totalSold: number; totalRevenue: number };
};

export default function OrganizersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAuthenticated) return;

    let cancelled = false;
    fetch('/api/organizer/dashboard', { cache: 'no-store' })
      .then((res) => res.json())
      .then((d) => {
        if (!cancelled && d?.ok) setData(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasParties = (data?.parties?.length ?? 0) > 0;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {!hasParties ? (
          <div className="glow-card rounded-3xl p-16 text-center border border-white/10">
            <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">У вас нет мероприятий</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Создайте своё первое пати, заполните информацию о событии и начните продавать билеты
            </p>
            <Link href="/create-party">
              <Button size="lg" className="gap-2 text-base px-8 py-6">
                <Plus className="w-5 h-5" />
                Создайте своё первое пати
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              <div className="glow-card rounded-2xl p-6 border border-white/5 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{data?.stats.partiesCount ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Мероприятий</p>
                  </div>
                </div>
              </div>
              <div className="glow-card rounded-2xl p-6 border border-white/5 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Ticket className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{data?.stats.totalSold ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Продано билетов</p>
                  </div>
                </div>
              </div>
              <div className="glow-card rounded-2xl p-6 border border-white/5 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">
                      {(data?.stats.totalRevenue ?? 0).toLocaleString('ru-KZ')} ₸
                    </p>
                    <p className="text-sm text-muted-foreground">Выручка</p>
                  </div>
                </div>
              </div>
            </div>

            {data && data.pendingSubmissions > 0 && (
              <div className="glow-card rounded-2xl p-4 mb-8 flex items-center justify-between border border-amber-500/30 bg-amber-500/5">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span className="text-amber-200">
                    {data.pendingSubmissions} {data.pendingSubmissions === 1 ? 'заявка' : 'заявки'} на модерации
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4 mb-10">
              <Link href="/create-party">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Создать пати
                </Button>
              </Link>
            </div>

            <h2 className="text-xl font-bold tracking-wider mb-4">Мои мероприятия</h2>
            <div className="space-y-4">
              {data?.parties.map((party) => (
                <div
                  key={party.id}
                  className="glow-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="relative w-full sm:w-28 h-36 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-muted">
                    <Image
                      src={party.image || ''}
                      alt={party.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-white truncate">{party.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="w-4 h-4 shrink-0" />
                      {new Date(party.date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}{' '}
                      · {party.venue?.name || party.venue?.address}
                    </p>
                    <div className="flex flex-wrap gap-5 mt-3 text-sm">
                      <span className="text-muted-foreground">
                        Билетов: <span className="text-white font-medium">{party.actualSold}</span> / {party.totalTickets}
                      </span>
                      <span className="text-primary font-medium">
                        Выручка: {party.revenue.toLocaleString('ru-KZ')} ₸
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/organizers/party/${party.id}`}>
                      <Button variant="default" size="sm" className="gap-1">
                        <Settings className="w-4 h-4" />
                        Управление
                      </Button>
                    </Link>
                    <Link href={`/party/${party.slug}`} target="_blank">
                      <Button variant="outline" size="sm" className="gap-1">
                        <ExternalLink className="w-4 h-4" />
                        Страница
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
