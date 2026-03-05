'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCities, getDefaultCity } from '@/lib/cities';

export function Hero() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);
  const cityParam = searchParams.get('city')?.trim() || '';
  const cities = getCities();
  const currentCityLabel = cityParam && cities.includes(cityParam) ? cityParam : (cityParam || getDefaultCity());
  const displayCity = cityParam || 'Все города';

  useEffect(() => {
    const q = searchParams.get('q');
    setQuery(q ?? '');
  }, [searchParams]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setCityOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set('q', q);
    else params.delete('q');
    router.push('?' + params.toString());
  };

  const selectCity = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('city', value);
    else params.delete('city');
    router.push('?' + params.toString());
    setCityOpen(false);
  };

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&h=1080&fit=crop')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-purple-900/20" />
      </div>

      {/* Animated elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        {/* Badge + City selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <div ref={cityRef} className="relative inline-flex">
            <button
              type="button"
              onClick={() => setCityOpen((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors text-left"
            >
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm text-white/90 min-w-[6rem]">{displayCity}</span>
              <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${cityOpen ? 'rotate-180' : ''}`} />
            </button>
            <span className="inline-flex items-center pl-2 text-sm text-white/80">Казахстан</span>
            {cityOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 py-2 rounded-xl bg-background/95 border border-white/10 shadow-xl backdrop-blur-xl z-50 max-h-[70vh] overflow-y-auto min-w-[12rem]">
                <button
                  type="button"
                  onClick={() => selectCity('')}
                  className={`block w-full px-4 py-2.5 text-left text-sm transition-colors ${!cityParam ? 'bg-primary/20 text-primary' : 'text-white hover:bg-white/10'}`}
                >
                  Все города
                </button>
                {cities.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => selectCity(c)}
                    className={`block w-full px-4 py-2.5 text-left text-sm transition-colors ${cityParam === c ? 'bg-primary/20 text-primary' : 'text-white hover:bg-white/10'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-wider">
          <span className="block text-white">НАЙДИ СВОЮ</span>
          <span className="block gradient-text">ВЕЧЕРИНКУ</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10">
          Билеты на лучшие вечеринки {cityParam ? `в ${currentCityLabel}` : 'по всему Казахстану'}. Dragon Party, Pizdec Party, Hello Kitty и многое другое.
        </p>

        {/* Search */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Название пати, хештег или организатор..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-12 h-12 bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-white/40"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8">
              Найти
            </Button>
          </form>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-16">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white">50+</div>
            <div className="text-sm text-white/50 mt-1">Вечеринок в месяц</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white">10K+</div>
            <div className="text-sm text-white/50 mt-1">Проданных билетов</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white">15+</div>
            <div className="text-sm text-white/50 mt-1">Организаторов</div>
          </div>
        </div>
      </div>
    </section>
  );
}
