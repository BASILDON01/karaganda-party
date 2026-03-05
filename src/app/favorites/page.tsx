'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

import { PartyCard } from '@/components/party-card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import type { Party } from '@/lib/types';

type FavoritesResponse =
  | { ok: true; parties: Party[]; favoritePartyIds: string[] }
  | { ok: false; error?: string };

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [parties, setParties] = useState<Party[] | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/favorites', { cache: 'no-store' });
        const data = (await res.json()) as FavoritesResponse;
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setParties([]);
          return;
        }
        setParties(Array.isArray(data.parties) ? data.parties : []);
      } catch {
        if (!cancelled) setParties([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const content = useMemo(() => {
    if (parties === null) {
      return (
        <div className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="party-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glow-card rounded-2xl h-80 animate-pulse bg-white/5" />
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (parties.length === 0) {
      return (
        <div className="container mx-auto px-4">
          <div className="glow-card rounded-2xl p-10 border border-white/10 text-center text-muted-foreground">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-7 h-7 text-primary" />
            </div>
            <div className="text-white font-semibold text-lg mb-2">Избранного пока нет</div>
            <div className="text-sm mb-6">Откройте пати и нажмите на сердечко, чтобы добавить его сюда.</div>
            <Button asChild variant="outline">
              <Link href="/all">Все события</Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="party-grid">
            {parties.map((p) => (
              <PartyCard key={p.id} party={p} />
            ))}
          </div>
        </div>
      </section>
    );
  }, [parties]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <div className="min-h-screen pt-24 pb-16">{content}</div>;
}

