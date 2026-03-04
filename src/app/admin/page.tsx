'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  X,
  Loader2,
  Calendar,
  MapPin,
  Ticket,
  Trash2,
  BarChart3,
  Users,
  ImageIcon,
  MessageCircle,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import type { PartySubmission } from '@/lib/types';
import type { Party } from '@/lib/types';

type SubmissionWithCreator = PartySubmission & {
  creator: { id: string; name: string; avatar?: string; createdAt: string } | null;
};

type AdminStats = {
  partiesCount: number;
  pendingSubmissionsCount: number;
  totalTicketsSold: number;
  usersCount: number;
};

type SupportMsg = { id: string; userId: string; author: 'user' | 'support'; text: string; createdAt: string };

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithCreator[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [supportConversations, setSupportConversations] = useState<Array<{
    userId: string;
    messages: SupportMsg[];
    unreadCount?: number;
    isClosed?: boolean;
    closedAt?: string;
  }>>([]);
  const [selectedSupportUserId, setSelectedSupportUserId] = useState<string | null>(null);
  const [supportReply, setSupportReply] = useState('');
  const [supportSending, setSupportSending] = useState(false);
  const [supportClosing, setSupportClosing] = useState<string | null>(null);

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
        const [pendingRes, partiesRes, statsRes, supportRes] = await Promise.all([
          fetch('/api/admin/parties/pending'),
          fetch('/api/parties'),
          fetch('/api/admin/stats'),
          fetch('/api/support/messages?conversations=1'),
        ]);
        if (cancelled) return;
        if (pendingRes.status === 403 || statsRes.status === 403) {
          toast.error('Доступ запрещён');
          router.push('/');
          return;
        }
        if (pendingRes.status === 401) {
          router.push('/login');
          return;
        }
        const pendingData = await pendingRes.json();
        const partiesData = await partiesRes.json();
        const statsData = await statsRes.json();
        const supportData = await supportRes.json();
        if (pendingData?.ok && pendingData.submissions) setSubmissions(pendingData.submissions);
        if (partiesData?.ok && partiesData.parties) setParties(partiesData.parties);
        if (statsData?.ok && statsData.stats) setStats(statsData.stats);
        if (supportData?.ok && supportData.conversations) setSupportConversations(supportData.conversations);
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
      if (stats) setStats({ ...stats, partiesCount: stats.partiesCount + 1, pendingSubmissionsCount: stats.pendingSubmissionsCount - 1 });
      const partiesRes = await fetch('/api/parties');
      const partiesData = await partiesRes.json();
      if (partiesData?.ok && partiesData.parties) setParties(partiesData.parties);
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
      if (stats) setStats({ ...stats, pendingSubmissionsCount: stats.pendingSubmissionsCount - 1 });
    } catch {
      toast.error('Ошибка');
    } finally {
      setActing(null);
    }
  }

  async function deleteParty(partyId: string) {
    setDeletingId(partyId);
    try {
      const res = await fetch('/api/admin/parties/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partyId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error === 'not_found' ? 'Мероприятие не найдено' : 'Ошибка');
        return;
      }
      toast.success('Мероприятие удалено');
      setParties((prev) => prev.filter((p) => p.id !== partyId));
      if (stats) setStats({ ...stats, partiesCount: stats.partiesCount - 1 });
    } catch {
      toast.error('Ошибка');
    } finally {
      setDeletingId(null);
    }
  }

  async function sendSupportReply(userId: string) {
    const text = supportReply.trim();
    if (!text || supportSending) return;
    setSupportSending(true);
    try {
      const res = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userId }),
      });
      const data = await res.json();
      if (res.ok && data?.ok && data.message) {
        setSupportConversations((prev) =>
          prev.map((c) =>
            c.userId === userId ? { ...c, messages: [...c.messages, data.message], isClosed: false } : c
          )
        );
        setSupportReply('');
      } else {
        toast.error('Не удалось отправить');
      }
    } catch {
      toast.error('Ошибка');
    } finally {
      setSupportSending(false);
    }
  }

  async function closeOrReopenTicket(userId: string, reopen: boolean) {
    setSupportClosing(userId);
    try {
      const res = await fetch('/api/support/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reopen }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        setSupportConversations((prev) =>
          prev.map((c) =>
            c.userId === userId ? { ...c, isClosed: !reopen, closedAt: reopen ? undefined : new Date().toISOString() } : c
          )
        );
        toast.success(reopen ? 'Тикет открыт' : 'Тикет закрыт');
      } else {
        toast.error('Ошибка');
      }
    } catch {
      toast.error('Ошибка');
    } finally {
      setSupportClosing(null);
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
      <div className="container mx-auto px-4 max-w-4xl">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Статистика */}
            {stats && (
              <section className="mb-10">
                <h2 className="text-xl font-bold tracking-wider mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  СТАТИСТИКА
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="glow-card rounded-xl p-4">
                    <p className="text-2xl font-bold text-primary">{stats.partiesCount}</p>
                    <p className="text-sm text-muted-foreground">Опубликовано мероприятий</p>
                  </div>
                  <div className="glow-card rounded-xl p-4">
                    <p className="text-2xl font-bold">{stats.pendingSubmissionsCount}</p>
                    <p className="text-sm text-muted-foreground">На модерации</p>
                  </div>
                  <div className="glow-card rounded-xl p-4">
                    <p className="text-2xl font-bold">{stats.totalTicketsSold}</p>
                    <p className="text-sm text-muted-foreground">Билетов продано</p>
                  </div>
                  <div className="glow-card rounded-xl p-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-2xl font-bold">{stats.usersCount}</p>
                      <p className="text-sm text-muted-foreground">Пользователей</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Опубликованные мероприятия — удаление */}
            <section className="mb-10">
              <h2 className="text-xl font-bold tracking-wider mb-4">ОПУБЛИКОВАННЫЕ МЕРОПРИЯТИЯ</h2>
              {parties.length === 0 ? (
                <div className="glow-card rounded-2xl p-6 text-center text-muted-foreground">
                  Пока нет опубликованных мероприятий
                </div>
              ) : (
                <ul className="space-y-3">
                  {parties.map((p) => (
                    <li key={p.id} className="glow-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0 flex items-center gap-3">
                        {p.image && (
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
                            <img src={p.image} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{p.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {p.date} · {p.venue.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link href={`/party/${p.slug}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">Открыть</Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteParty(p.id)}
                          disabled={deletingId !== null}
                          className="gap-1"
                        >
                          {deletingId === p.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Удалить
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Заявки на модерации */}
            <section>
              <h2 className="text-xl font-bold tracking-wider mb-4">ЗАЯВКИ НА МОДЕРАЦИЮ</h2>
              {submissions.length === 0 ? (
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
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* Фото и инфо */}
                        <div className="flex flex-col sm:flex-row gap-4 flex-1 min-w-0">
                          {s.image ? (
                            <div className="w-full sm:w-40 h-36 rounded-xl overflow-hidden shrink-0 bg-muted">
                              <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-full sm:w-40 h-36 rounded-xl bg-muted flex items-center justify-center shrink-0">
                              <ImageIcon className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold truncate">{s.name}</h3>
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
                            {/* Кто подал заявку */}
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <p className="text-xs text-muted-foreground mb-1">Подал заявку:</p>
                              {s.creator ? (
                                <div className="flex items-center gap-2">
                                  {s.creator.avatar ? (
                                    <img src={s.creator.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                      <Users className="w-3 h-3 text-primary" />
                                    </div>
                                  )}
                                  <span className="font-medium">{s.creator.name}</span>
                                  <span className="text-xs text-muted-foreground">Telegram ID: {s.creator.id}</span>
                                  <span className="text-xs text-muted-foreground">
                                    в системе с {new Date(s.creator.createdAt).toLocaleDateString('ru-RU')}
                                  </span>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">ID: {s.createdBy} (профиль не найден)</p>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">ID заявки: {s.id}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0 lg:flex-col">
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
            </section>

            {/* Поддержка — чат с пользователями */}
            <section className="mt-14 mb-10">
              <h2 className="text-xl font-bold tracking-wider mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                ПОДДЕРЖКА
              </h2>
              {supportConversations.length === 0 ? (
                <div className="glow-card rounded-2xl p-6 text-center text-muted-foreground">
                  Пока нет обращений в поддержку
                </div>
              ) : (
                <div className="space-y-4">
                  {supportConversations.map(({ userId, messages, unreadCount = 0, isClosed }) => (
                    <div key={userId} className="glow-card rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          setSupportReply('');
                          setSelectedSupportUserId((id) => (id === userId ? null : userId));
                          if (userId) {
                            fetch('/api/support/read', {
                              method: 'POST',
                              credentials: 'include',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId }),
                            }).catch(() => {});
                            setSupportConversations((prev) =>
                              prev.map((c) => (c.userId === userId ? { ...c, unreadCount: 0 } : c))
                            );
                          }
                        }}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                      >
                        <span className="font-medium flex items-center gap-2">
                          Telegram ID: {userId}
                          {unreadCount > 0 && (
                            <span className="min-w-[22px] h-[22px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                          {isClosed && (
                            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Закрыт</span>
                          )}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {messages.length} сообщ.
                        </span>
                      </button>
                      {selectedSupportUserId === userId && (
                        <div className="border-t border-white/10 p-4 space-y-3">
                          {isClosed && (
                            <div className="text-sm text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                              Тикет закрыт. Пользователь увидит это в чате. Можно открыть снова кнопкой ниже.
                            </div>
                          )}
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {messages.map((m) => (
                              <div
                                key={m.id}
                                className={`flex ${m.author === 'support' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                                    m.author === 'support'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted'
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                                  <p className="text-xs opacity-80 mt-1">
                                    {new Date(m.createdAt).toLocaleString('ru-RU')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <input
                              type="text"
                              value={selectedSupportUserId === userId ? supportReply : ''}
                              onChange={(e) => setSupportReply(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === 'Enter' && sendSupportReply(userId)
                              }
                              placeholder="Ответить..."
                              className="flex-1 min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <Button
                              size="sm"
                              onClick={() => sendSupportReply(userId)}
                              disabled={supportSending || !supportReply.trim()}
                              className="gap-1"
                            >
                              <Send className="w-4 h-4" />
                              Отправить
                            </Button>
                            {isClosed ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => closeOrReopenTicket(userId, true)}
                                disabled={supportClosing === userId}
                              >
                                Открыть тикет
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => closeOrReopenTicket(userId, false)}
                                disabled={supportClosing === userId}
                              >
                                Закрыть тикет
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
