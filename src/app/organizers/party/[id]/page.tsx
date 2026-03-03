'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronLeft,
  ImagePlus,
  Music,
  Ticket,
  Users,
  Loader2,
  Plus,
  Trash2,
  Save,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import type { Party, Artist, TicketType } from '@/lib/types';

type Purchaser = {
  userId: string;
  name: string;
  avatar?: string;
  ticketsCount: number;
  totalPaid: number;
  purchasedAt?: string;
};

export default function OrganizerPartyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { isAuthenticated, isLoading } = useAuth();
  const [party, setParty] = useState<Party | null>(null);
  const [purchasers, setPurchasers] = useState<Purchaser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'gallery' | 'lineup' | 'tickets' | 'purchasers'>('gallery');
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!isAuthenticated || !id) return;

    let cancelled = false;
    Promise.all([
      fetch(`/api/organizer/party/${id}`, { cache: 'no-store' }).then((r) => r.json()),
      fetch(`/api/organizer/party/${id}/purchasers`, { cache: 'no-store' }).then((r) => r.json()),
    ])
      .then(([partyRes, purchRes]) => {
        if (!cancelled && partyRes?.ok && partyRes.party) setParty(partyRes.party);
        if (!cancelled && purchRes?.ok && purchRes.purchasers) setPurchasers(purchRes.purchasers);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, isLoading, id, router]);

  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Размер файла не более 2 МБ');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const gallery = [...(party?.gallery ?? []), url];
      setParty((p) => (p ? { ...p, gallery } : null));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGalleryRemove = (idx: number) => {
    const gallery = [...(party?.gallery ?? [])];
    gallery.splice(idx, 1);
    setParty((p) => (p ? { ...p, gallery } : null));
  };

  const handleLineupAdd = () => {
    const lineup = [...(party?.lineup ?? []), { id: `artist-${Date.now()}`, name: '', role: 'DJ' }];
    setParty((p) => (p ? { ...p, lineup } : null));
  };

  const handleLineupUpdate = (idx: number, field: keyof Artist, value: string) => {
    const lineup = [...(party?.lineup ?? [])];
    if (!lineup[idx]) return;
    lineup[idx] = { ...lineup[idx], [field]: value };
    setParty((p) => (p ? { ...p, lineup } : null));
  };

  const handleLineupRemove = (idx: number) => {
    const lineup = party?.lineup?.filter((_, i) => i !== idx) ?? [];
    setParty((p) => (p ? { ...p, lineup } : null));
  };

  const handleTicketQuantityChange = (ttId: string, val: number) => {
    const q = Math.max(0, val);
    const ticketTypes = party?.ticketTypes?.map((tt) =>
      tt.id === ttId ? { ...tt, quantity: Math.max(tt.sold ?? 0, q) } : tt
    ) ?? [];
    setParty((p) => (p ? { ...p, ticketTypes } : null));
  };

  const handleSave = async () => {
    if (!party || !id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/organizer/party/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gallery: party.gallery ?? [],
          lineup: party.lineup ?? [],
          ticketTypes: party.ticketTypes?.map((tt) => ({ id: tt.id, quantity: tt.quantity })) ?? [],
        }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        toast.success('Изменения сохранены');
        setParty(data.party);
      } else {
        toast.error('Не удалось сохранить');
      }
    } catch {
      toast.error('Ошибка');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (loading || !party) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const tabs = [
    { id: 'gallery' as const, label: 'Фото', icon: ImagePlus },
    { id: 'lineup' as const, label: 'Лайнап', icon: Music },
    { id: 'tickets' as const, label: 'Билеты', icon: Ticket },
    { id: 'purchasers' as const, label: 'Покупатели', icon: Users },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/organizers">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-wider truncate">{party.name}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Управление мероприятием</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2 shrink-0">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Сохранить
          </Button>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors shrink-0 ${
                  activeTab === t.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="glow-card rounded-2xl p-6 border border-white/10">
          {activeTab === 'gallery' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Галерея</h2>
                <div className="flex gap-2">
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleGalleryAdd}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => galleryInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Добавить фото
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {(party.gallery ?? []).map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-muted">
                    <Image src={url} alt="" fill className="object-cover" />
                    <button
                      onClick={() => handleGalleryRemove(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                >
                  <Plus className="w-8 h-8" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'lineup' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Лайнап</h2>
                <Button variant="outline" size="sm" onClick={handleLineupAdd} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Добавить
                </Button>
              </div>
              <div className="space-y-4">
                {(party.lineup ?? []).map((artist, idx) => (
                  <div key={artist.id} className="flex gap-3 items-center p-4 rounded-xl bg-white/5">
                    <Input
                      placeholder="Имя"
                      value={artist.name}
                      onChange={(e) => handleLineupUpdate(idx, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Роль (DJ, MC...)"
                      value={artist.role}
                      onChange={(e) => handleLineupUpdate(idx, 'role', e.target.value)}
                      className="w-32"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleLineupRemove(idx)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                {(!party.lineup || party.lineup.length === 0) && (
                  <p className="text-muted-foreground text-sm">Добавьте артистов</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Количество билетов</h2>
              <div className="space-y-4">
                {(party.ticketTypes ?? []).map((tt) => (
                  <div key={tt.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div>
                      <p className="font-medium">{tt.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Продано: {tt.sold ?? 0} · Цена: {tt.price} ₸
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={tt.sold ?? 0}
                        value={tt.quantity}
                        onChange={(e) => handleTicketQuantityChange(tt.id, parseInt(e.target.value, 10) || (tt.sold ?? 0))}
                        className="w-24"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'purchasers' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Покупатели билетов</h2>
              {purchasers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Пока нет покупателей</p>
              ) : (
                <div className="space-y-3">
                  {purchasers.map((p) => (
                    <div
                      key={p.userId}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                        {p.avatar ? (
                          <Image src={p.avatar} alt="" width={40} height={40} className="object-cover" />
                        ) : (
                          <Users className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {p.ticketsCount} билет(ов) · {p.totalPaid.toLocaleString('ru-KZ')} ₸
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">
                        {p.purchasedAt
                          ? new Date(p.purchasedAt).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
