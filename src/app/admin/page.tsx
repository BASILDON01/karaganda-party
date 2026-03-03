'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Check, X, Loader2, Calendar, MapPin, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import type { PartySubmission } from '@/lib/types';

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [submissions, setSubmissions] = useState<PartySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (isLoading || !isAuthenticated) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/parties/pending');
        const data = await res.json();
        if (cancelled) return;
        if (res.status === 403) {
          toast.error('Доступ запрещён');
          router.push('/');
          return;
        }
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (!data.ok) {
          toast.error('Не удалось загрузить заявки');
          return;
        }
        setSubmissions(data.submissions ?? []);
      } catch {
        if (!cancelled) toast.error('Ошибка загрузки');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [isLoading, isAuthenticated, router]);

  async function approve(id: string) {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/parties/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error === 'already_reviewed' ? 'Заявка уже рассмотрена' : 'Ошибка');
        return;
      }
      toast.success('Мероприятие одобрено и опубликовано');
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error('Ошибка');
    } finally {
      setActing(null);
    }
  }

  async function reject(id: string) {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/parties/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: '' }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error === 'already_reviewed' ? 'Заявка уже рассмотрена' : 'Ошибка');
        return;
      }
      toast.success('Заявка отклонена');
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error('Ошибка');
    } finally {
      setActing(null);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-wider">МОДЕРАЦИЯ</h1>
            <p className="text-muted-foreground mt-1">Заявки на публикацию мероприятий</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="glow-card rounded-2xl p-8 text-center">
            <p className="text-muted-foreground">Нет заявок на модерации</p>
            <Link href="/create-party" className="inline-block mt-4">
              <Button variant="outline">Создать мероприятие</Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {submissions.map((s) => (
              <li key={s.id} className="glow-card rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold truncate">{s.name}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {s.date} {s.startTime}
                        {s.endTime && ` – ${s.endTime}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {s.venue}
                        {s.address && `, ${s.address}`}
                      </span>
                    </div>
                    {s.description && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Ticket className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {s.ticketTypes.length} тип(ов) билетов · {s.ticketTypes.reduce((a, t) => a + t.quantity, 0)} мест
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">ID заявки: {s.id} · от {new Date(s.createdAt).toLocaleString('ru-RU')}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => approve(s.id)}
                      disabled={acting !== null}
                      className="gap-1"
                    >
                      {acting === s.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Одобрить
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => reject(s.id)}
                      disabled={acting !== null}
                      className="gap-1"
                    >
                      {acting === s.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      Отклонить
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
