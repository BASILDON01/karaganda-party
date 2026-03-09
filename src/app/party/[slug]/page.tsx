'use client';

import { useState, use, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Minus,
  Plus,
  Shield,
  Share2,
  Heart,
  AlertCircle,
  CheckCircle,
  Shirt,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDate, getTicketAvailability } from '@/lib/mock-data';
import type { Party } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { GalleryLightbox } from '@/components/gallery-lightbox';
import { useTickets } from '@/lib/tickets-context';
import { toast } from 'sonner';
import { getPartyHeroImageUrl } from '@/lib/image-utils';

interface TicketSelection {
  [ticketTypeId: string]: number;
}

export default function PartyPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [party, setParty] = useState<Party | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/parties/${encodeURIComponent(resolvedParams.slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.ok && data.party ? setParty(data.party) : setParty(null))
      .catch(() => setParty(null));
  }, [resolvedParams.slug]);

  const { isAuthenticated } = useAuth();
  const { addTickets } = useTickets();

  const [selectedTickets, setSelectedTickets] = useState<TicketSelection>({});
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'kaspi' | 'halyk'>('kaspi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const syncFavoriteFromServer = useCallback(async (partyId: string) => {
    try {
      const res = await fetch('/api/favorites', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as { ok?: boolean; favoritePartyIds?: string[] };
      if (data?.ok && Array.isArray(data.favoritePartyIds)) {
        setIsFavorite(data.favoritePartyIds.includes(partyId));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (party && isAuthenticated) {
      void syncFavoriteFromServer(party.id);
    }
  }, [party, isAuthenticated, syncFavoriteFromServer]);

  if (party === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (!party) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Пати не найдено</h1>
          <p className="text-muted-foreground mb-8">Возможно, оно было удалено или ещё не опубликовано</p>
          <Link href="/">
            <Button>Вернуться на главную</Button>
          </Link>
        </div>
      </div>
    );
  }

  const updateTicketCount = (ticketTypeId: string, delta: number, maxPerOrder: number, available: number) => {
    setSelectedTickets(prev => {
      const current = prev[ticketTypeId] || 0;
      const newCount = Math.max(0, Math.min(current + delta, maxPerOrder, available));
      if (newCount === 0) {
        const { [ticketTypeId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [ticketTypeId]: newCount };
    });
  };

  const totalAmount = party.ticketTypes.reduce((sum, ticket) => {
    const count = selectedTickets[ticket.id] || 0;
    return sum + (ticket.price * count);
  }, 0);

  const totalTickets = Object.values(selectedTickets).reduce((a, b) => a + b, 0);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: party.name,
          text: `Приходи на ${party.name}!`,
          url,
        });
      } catch (e) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Ссылка скопирована!');
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Войдите через Telegram, чтобы добавить в избранное');
      router.push('/login');
      return;
    }

    if (!party) return;
    if (isFavoriteLoading) return;

    setIsFavoriteLoading(true);
    try {
      const method = isFavorite ? 'DELETE' : 'POST';
      const res = await fetch('/api/favorites', {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ partyId: party.id }),
      });
      if (!res.ok) {
        toast.error('Не удалось обновить избранное');
        return;
      }
      setIsFavorite(!isFavorite);
      toast.success(!isFavorite ? 'Добавлено в избранное' : 'Удалено из избранного');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error('Войдите для покупки билетов');
      router.push('/login');
      return;
    }

    if (totalTickets === 0) {
      toast.error('Выберите билеты');
      return;
    }

    setIsProcessing(true);

    try {
      const selections = Object.entries(selectedTickets).map(([ticketTypeId, quantity]) => ({
        ticketTypeId,
        quantity,
      }));

      const res = await fetch('/api/tickets/purchase', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          partySlug: party.slug,
          selections,
          paymentMethod,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message =
          data?.error === 'unauthorized'
            ? 'Сначала войдите через Telegram'
            : 'Не удалось оформить покупку';
        toast.error(message);
        if (data?.error === 'unauthorized') {
          router.push('/login');
        }
        return;
      }

      const data = await res.json();

      if (data?.ok && data.redirectToPayment && data.paymentUrl) {
        toast.success('Переход на страницу оплаты...');
        window.location.href = data.paymentUrl;
        return;
      }

      if (data?.ok && Array.isArray(data.tickets)) {
        addTickets(data.tickets);
      }

      toast.success('Билеты успешно куплены!', {
        description: 'Перейдите в "Мои билеты" чтобы увидеть QR-код',
        action: {
          label: 'Мои билеты',
          onClick: () => router.push('/my-tickets'),
        },
      });

      setSelectedTickets({});
      router.push('/my-tickets');
    } catch {
      toast.error('Произошла ошибка при покупке билетов');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <Image
          src={getPartyHeroImageUrl(party.image)}
          alt={party.name}
          fill
          className="object-cover"
          priority
          quality={95}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />

        {/* Actions */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-10 flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="bg-black/50 backdrop-blur-sm border-white/20"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={`bg-black/50 backdrop-blur-sm border-white/20 ${isFavorite ? 'text-red-500' : ''}`}
            onClick={handleFavorite}
            disabled={isFavoriteLoading}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title section */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {party.organizer.verified && (
                  <Badge className="bg-primary/20 text-primary border-0">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                <Badge variant="outline" className="border-white/20">
                  {party.ageRestriction}+
                </Badge>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-wider">
                {party.name}
              </h1>

              <div className="flex items-center gap-4 text-muted-foreground">
                <Link href={`/organizer/${party.organizer.id}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  {party.organizer.logo && (
                    <Image
                      src={party.organizer.logo}
                      alt={party.organizer.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  )}
                  <span>{party.organizer.name}</span>
                </Link>
              </div>
            </div>

            {/* Info cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="glow-card rounded-xl p-5">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm font-medium">Дата</span>
                </div>
                <p className="text-lg font-semibold text-white">{formatDate(party.date)}</p>
              </div>
              <div className="glow-card rounded-xl p-5">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">Время</span>
                </div>
                <p className="text-lg font-semibold text-white">{party.time} - {party.endTime}</p>
              </div>
              <div className="glow-card rounded-xl p-5">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm font-medium">Место</span>
                </div>
                <p className="text-lg font-semibold text-white">{party.venue.name}</p>
                <p className="text-sm text-muted-foreground">{party.venue.address}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-wider">О МЕРОПРИЯТИИ</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {party.description}
              </p>
            </div>

            {/* Dress code */}
            {party.dressCode && (
              <div className="glow-card rounded-xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Shirt className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Дресс-код</span>
                  <p className="text-lg font-semibold text-white">{party.dressCode}</p>
                </div>
              </div>
            )}

            {/* Lineup */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-wider">ЛАЙНАП</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {party.lineup.map((artist) => (
                  <div
                    key={artist.id}
                    className="glow-card rounded-xl p-4 flex items-center gap-4"
                  >
                    {artist.image && (
                      <Image
                        src={artist.image}
                        alt={artist.name}
                        width={60}
                        height={60}
                        className="rounded-xl object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-white">{artist.name}</h3>
                      <p className="text-sm text-primary">{artist.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gallery */}
            {party.gallery && party.gallery.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold tracking-wider">ГАЛЕРЕЯ</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {party.gallery.map((item, index) => {
                    const url = typeof item === 'string' ? item : '';
                    const isVideo = url.startsWith('data:video') || url.includes('/video') || /\.(mp4|webm|ogg)(\?|$)/i.test(url);
                    const ytId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)?.[1] || url.match(/youtube\.com\/watch\?.+&v=([a-zA-Z0-9_-]{11})/)?.[1];
                    const isYouTube = Boolean(ytId);
                    const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';
                    const isExternal = url.startsWith('http');
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setGalleryIndex(index)}
                        className="relative aspect-video rounded-xl overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {isYouTube ? (
                          <div className="relative w-full h-full">
                            <img
                              src={ytThumb}
                              alt={`${party.name} gallery ${index + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                              <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : isVideo ? (
                          <div className="relative w-full h-full">
                            <video
                              src={item}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                                <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : isExternal ? (
                          <img
                            src={item}
                            alt={`${party.name} gallery ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Image
                            src={item}
                            alt={`${party.name} gallery ${index + 1}`}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                {galleryIndex !== null && (
                  <GalleryLightbox
                    items={party.gallery}
                    currentIndex={galleryIndex}
                    onClose={() => setGalleryIndex(null)}
                    onPrev={() => setGalleryIndex((galleryIndex - 1 + party.gallery!.length) % party.gallery!.length)}
                    onNext={() => setGalleryIndex((galleryIndex + 1) % party.gallery!.length)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Tickets */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="glow-card rounded-2xl p-6 space-y-6">
                <h2 className="text-2xl font-bold tracking-wider">БИЛЕТЫ</h2>

                {/* Ticket types */}
                <div className="space-y-4">
                  {party.ticketTypes.map((ticket) => {
                    const availability = getTicketAvailability(ticket);
                    const count = selectedTickets[ticket.id] || 0;

                    return (
                      <div
                        key={ticket.id}
                        className={`rounded-xl border p-4 transition-all ${
                          count > 0
                            ? 'border-primary bg-primary/5'
                            : 'border-white/10 hover:border-white/20'
                        } ${availability.status === 'soldout' ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-white">{ticket.name}</h3>
                            {ticket.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {ticket.description}
                              </p>
                            )}
                          </div>
                          <span className="text-lg font-bold text-white">
                            {formatPrice(ticket.price)}
                          </span>
                        </div>

                        {ticket.features && ticket.features.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {ticket.features.map((feature, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            {availability.status === 'soldout' ? (
                              <span className="text-red-500">Распродано</span>
                            ) : availability.status === 'low' ? (
                              <span className="text-orange-500">
                                <AlertCircle className="w-3 h-3 inline mr-1" />
                                Осталось {availability.available}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Осталось {availability.available}
                              </span>
                            )}
                          </div>

                          {availability.status !== 'soldout' && (
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateTicketCount(ticket.id, -1, ticket.maxPerOrder, availability.available)}
                                disabled={count === 0}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-8 text-center font-semibold">{count}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateTicketCount(ticket.id, 1, ticket.maxPerOrder, availability.available)}
                                disabled={count >= ticket.maxPerOrder || count >= availability.available}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Payment method */}
                {totalTickets > 0 && (
                  <div className="space-y-3">
                    <span className="text-sm font-medium">Способ оплаты</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentMethod('kaspi')}
                        className={`p-4 rounded-xl border transition-all ${
                          paymentMethod === 'kaspi'
                            ? 'border-[#F14635] bg-[#F14635]/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="text-center">
                          <span className="text-lg font-bold text-[#F14635]">Kaspi</span>
                          <p className="text-xs text-muted-foreground mt-1">Kaspi Pay</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('halyk')}
                        className={`p-4 rounded-xl border transition-all ${
                          paymentMethod === 'halyk'
                            ? 'border-[#00A651] bg-[#00A651]/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="text-center">
                          <span className="text-lg font-bold text-[#00A651]">Halyk</span>
                          <p className="text-xs text-muted-foreground mt-1">Halyk Bank</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="border-t border-white/10 pt-4 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Билетов</span>
                    <span className="font-medium">{totalTickets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Итого</span>
                    <span className="text-2xl font-bold text-white">{formatPrice(totalAmount)}</span>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={totalTickets === 0 || isProcessing}
                    variant={totalTickets > 0 ? 'default' : 'secondary'}
                    onClick={handlePurchase}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Обработка...
                      </div>
                    ) : totalTickets > 0 ? (
                      <>
                        Оплатить через {paymentMethod === 'kaspi' ? 'Kaspi' : 'Halyk'}
                      </>
                    ) : (
                      'Выберите билеты'
                    )}
                  </Button>

                  {!isAuthenticated && totalTickets > 0 && (
                    <p className="text-xs text-center text-orange-500">
                      Войдите через Telegram для покупки
                    </p>
                  )}

                  <p className="text-xs text-center text-muted-foreground">
                    Нажимая кнопку, вы соглашаетесь с{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      условиями использования
                    </Link>
                    ,{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      политикой конфиденциальности
                    </Link>
                    {' '}и{' '}
                    <Link href="/cookie" className="text-primary hover:underline">
                      политикой cookie
                    </Link>
                  </p>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 text-muted-foreground text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Безопасная оплата</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Мгновенный QR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-24" />
    </div>
  );
}
