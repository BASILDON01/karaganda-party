'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PartyCard } from '@/components/party-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Filter } from 'lucide-react';
import type { Party } from '@/lib/types';
import { getDefaultCity } from '@/lib/cities';

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  return day === 0 || day === 6;
}

interface PartyListWithFiltersProps {
  parties: Party[];
}

export function PartyListWithFilters({ parties }: PartyListWithFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const tag = searchParams.get('tag') ?? '';
  const date = searchParams.get('date') ?? '';
  const age = searchParams.get('age') ?? '';
  const city = searchParams.get('city') ?? '';

  const updateParams = useCallback(
    (updates: { q?: string; tag?: string; date?: string; age?: string; city?: string }) => {
      const next = new URLSearchParams(searchParams.toString());
      if (updates.q !== undefined) {
        if (updates.q) next.set('q', updates.q);
        else next.delete('q');
      }
      if (updates.tag !== undefined) {
        if (updates.tag) next.set('tag', updates.tag);
        else next.delete('tag');
      }
      if (updates.date !== undefined) {
        if (updates.date) next.set('date', updates.date);
        else next.delete('date');
      }
      if (updates.age !== undefined) {
        if (updates.age) next.set('age', updates.age);
        else next.delete('age');
      }
      if (updates.city !== undefined) {
        if (updates.city) next.set('city', updates.city);
        else next.delete('city');
      }
      router.replace('?' + next.toString(), { scroll: false });
    },
    [router, searchParams]
  );

  const filteredParties = useMemo(() => {
    let list = parties;

    if (q) {
      const query = q;
      list = list.filter((p) => {
        const name = (p.name ?? '').toLowerCase();
        const desc = (p.description ?? '').toLowerCase();
        const org = (p.organizer?.name ?? '').toLowerCase();
        const tags = (p.hashtags ?? []).join(' ').toLowerCase();
        return name.includes(query) || desc.includes(query) || org.includes(query) || tags.includes(query);
      });
    }

    if (tag) {
      const t = tag.toLowerCase();
      list = list.filter((p) => (p.hashtags ?? []).some((h) => h.toLowerCase() === t));
    }

    if (date === 'today') {
      const today = toDateStr(new Date());
      list = list.filter((p) => p.date === today);
    } else if (date === 'weekend') {
      list = list.filter((p) => isWeekend(p.date));
    }

    if (age === '18' || age === '21') {
      const minAge = parseInt(age, 10);
      list = list.filter((p) => (p.ageRestriction ?? 0) >= minAge);
    }

    if (city) {
      list = list.filter((p) => (p.venue?.city ?? '').trim() === city.trim());
    }

    return list;
  }, [parties, q, tag, date, age, city]);

  const allHashtags = useMemo(() => {
    const set = new Set<string>();
    parties.forEach((p) => (p.hashtags ?? []).forEach((t) => set.add(t.trim().toLowerCase())));
    return Array.from(set).filter(Boolean).sort();
  }, [parties]);

  const allCities = useMemo(() => {
    const set = new Set<string>();
    parties.forEach((p) => {
      const c = (p.venue?.city ?? '').trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [parties]);

  const hasActiveFilters = !!q || !!tag || !!date || !!age || !!city;
  const [filtersVisible, setFiltersVisible] = useState(true);

  return (
    <>
      <section className="sticky top-16 md:top-20 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-start gap-3 overflow-hidden">
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              onClick={() => setFiltersVisible((v) => !v)}
            >
              <Filter className="w-4 h-4" />
              Фильтры
            </Button>
            <div
              className="grid min-w-0 flex-1 transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: filtersVisible ? '1fr' : '0fr' }}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2 pt-0.5">
                  <Badge
                    variant={!hasActiveFilters ? 'secondary' : 'outline'}
                    className={`cursor-pointer transition-colors px-4 py-2 border-white/20 ${!hasActiveFilters ? 'bg-primary/20 text-primary' : 'hover:bg-primary hover:text-white'}`}
                    onClick={() => updateParams({ q: '', tag: '', date: '', age: '', city: '' })}
                  >
                    Все
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`cursor-pointer transition-colors px-4 py-2 border-white/20 ${date === 'today' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-primary hover:text-white'}`}
                    onClick={() => updateParams({ date: date === 'today' ? '' : 'today' })}
                  >
                    Сегодня
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`cursor-pointer transition-colors px-4 py-2 border-white/20 ${date === 'weekend' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-primary hover:text-white'}`}
                    onClick={() => updateParams({ date: date === 'weekend' ? '' : 'weekend' })}
                  >
                    Эти выходные
                  </Badge>
                  {allCities.map((c) => (
                    <Badge
                      key={c}
                      variant="outline"
                      className={`cursor-pointer transition-colors px-4 py-2 border-white/20 ${city === c ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-primary hover:text-white'}`}
                      onClick={() => updateParams({ city: city === c ? '' : c })}
                    >
                      {c}
                    </Badge>
                  ))}
                  {allHashtags.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className={`cursor-pointer transition-colors px-4 py-2 border-white/20 ${tag === t ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-primary hover:text-white'}`}
                      onClick={() => updateParams({ tag: tag === t ? '' : t })}
                    >
                      #{t}
                    </Badge>
                  ))}
                  <Badge
                    variant="outline"
                    className={`cursor-pointer transition-colors px-4 py-2 border-white/20 ${age === '18' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-primary hover:text-white'}`}
                    onClick={() => updateParams({ age: age === '18' ? '' : '18' })}
                  >
                    18+
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`cursor-pointer transition-colors px-4 py-2 border-white/20 ${age === '21' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-primary hover:text-white'}`}
                    onClick={() => updateParams({ age: age === '21' ? '' : '21' })}
                  >
                    21+
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex justify-end mb-6">
            <Button variant="ghost" className="gap-2" asChild>
              <Link href="/all">
                Все события
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
          <div className="party-grid">
            {filteredParties.map((party) => (
              <PartyCard key={party.id} party={party} />
            ))}
          </div>
          {filteredParties.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              По вашему запросу ничего не найдено. Попробуйте другие фильтры или поиск.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
