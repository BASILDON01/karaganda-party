'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { parties, formatPrice } from '@/lib/mock-data';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDay = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const totalDays = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get parties for each day
  const getPartiesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return parties.filter(p => p.date === dateStr);
  };

  // Generate calendar grid
  const calendarDays = [];
  for (let i = 0; i < startingDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= totalDays; day++) {
    calendarDays.push(day);
  }

  // Get all events this month
  const monthEvents = parties.filter(p => {
    const partyDate = new Date(p.date);
    return partyDate.getMonth() === month && partyDate.getFullYear() === year;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-wider">КАЛЕНДАРЬ</h1>
            <p className="text-muted-foreground mt-2">Все вечеринки по датам</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="glow-card rounded-2xl p-6">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-bold tracking-wider">
                  {MONTHS[month]} {year}
                </h2>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const dayParties = getPartiesForDay(day);
                  const hasParties = dayParties.length > 0;
                  const isToday = new Date().getDate() === day &&
                    new Date().getMonth() === month &&
                    new Date().getFullYear() === year;

                  return (
                    <div
                      key={day}
                      className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-start transition-all ${
                        hasParties
                          ? 'bg-primary/10 border border-primary/30 cursor-pointer hover:bg-primary/20'
                          : 'hover:bg-white/5'
                      } ${isToday ? 'ring-2 ring-primary' : ''}`}
                    >
                      <span className={`text-sm font-medium ${hasParties ? 'text-primary' : ''}`}>
                        {day}
                      </span>
                      {hasParties && (
                        <div className="flex gap-0.5 mt-1">
                          {dayParties.slice(0, 3).map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Events list */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold tracking-wider">
              СОБЫТИЯ В {MONTHS[month].toUpperCase()}
            </h3>

            {monthEvents.length === 0 ? (
              <div className="glow-card rounded-xl p-6 text-center">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Нет событий в этом месяце</p>
              </div>
            ) : (
              <div className="space-y-4">
                {monthEvents.map(party => (
                  <Link key={party.id} href={`/party/${party.slug}`}>
                    <div className="glow-card rounded-xl p-4 flex gap-4 group">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={party.image}
                          alt={party.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                            {new Date(party.date).getDate()} {MONTHS[new Date(party.date).getMonth()].slice(0, 3)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {party.ageRestriction}+
                          </Badge>
                        </div>
                        <h4 className="font-bold text-white group-hover:text-primary transition-colors truncate">
                          {party.name}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {party.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {party.venue.name}
                          </span>
                        </div>
                        <p className="text-sm text-primary font-medium mt-2">
                          от {formatPrice(Math.min(...party.ticketTypes.map(t => t.price)))}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
