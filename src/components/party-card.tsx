'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Users, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDate, getTicketAvailability } from '@/lib/mock-data';
import type { Party } from '@/lib/types';

interface PartyCardProps {
  party: Party;
}

export function PartyCard({ party }: PartyCardProps) {
  const lowestPrice = Math.min(...party.ticketTypes.map(t => t.price));
  const availability = getTicketAvailability({
    quantity: party.totalTickets,
    sold: party.soldTickets,
  });

  return (
    <Link href={`/party/${party.slug}`} className="block group">
      <article className="glow-card rounded-2xl overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={party.image}
            alt={party.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Status badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {availability.status === 'low' && (
              <Badge className="bg-orange-500/90 text-white border-0 backdrop-blur-sm">
                <Flame className="w-3 h-3 mr-1" />
                Мало билетов
              </Badge>
            )}
            {availability.status === 'soldout' && (
              <Badge className="bg-red-600/90 text-white border-0 backdrop-blur-sm">
                Sold Out
              </Badge>
            )}
            {party.organizer.verified && (
              <Badge className="bg-primary/90 text-white border-0 backdrop-blur-sm">
                Verified
              </Badge>
            )}
          </div>

          {/* Age restriction */}
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm text-white font-bold text-sm border border-white/20">
              {party.ageRestriction}+
            </span>
          </div>

          {/* Date overlay */}
          <div className="absolute bottom-4 left-4">
            <div className="flex items-center gap-3 text-white">
              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-primary/90 backdrop-blur-sm">
                <span className="text-2xl font-bold leading-none">
                  {new Date(party.date).getDate()}
                </span>
                <span className="text-[10px] uppercase tracking-wider opacity-90">
                  {new Date(party.date).toLocaleDateString('ru-RU', { month: 'short' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Title and organizer */}
          <div>
            <h3 className="text-2xl font-bold text-white tracking-wide group-hover:text-primary transition-colors">
              {party.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              by {party.organizer.name}
            </p>
          </div>

          {/* Info */}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              <span>{party.time}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{party.venue.name}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                <Users className="w-3 h-3 inline mr-1" />
                {party.soldTickets} / {party.totalTickets}
              </span>
              <span className="text-primary font-medium">
                {Math.round(availability.percentage)}% продано
              </span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${availability.percentage}%` }}
              />
            </div>
          </div>

          {/* Price and CTA */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs text-muted-foreground">от</span>
              <span className="text-xl font-bold text-white ml-1">
                {formatPrice(lowestPrice)}
              </span>
            </div>
            <span className="text-sm text-primary font-medium group-hover:translate-x-1 transition-transform">
              Подробнее →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
