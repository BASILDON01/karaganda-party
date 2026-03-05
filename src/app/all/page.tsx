import { Suspense } from 'react';
import { getUpcomingParties } from '@/lib/parties-store';
import { PartyListWithFilters } from '@/components/party-list-with-filters';

export const dynamic = 'force-dynamic';

export default function AllEventsPage() {
  const parties = getUpcomingParties();

  return (
    <div className="min-h-screen pt-24">
      <Suspense
        fallback={
          <section className="py-16 md:py-24 pt-24">
            <div className="container mx-auto px-4">
              <div className="party-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="glow-card rounded-2xl h-80 animate-pulse bg-white/5"
                  />
                ))}
              </div>
            </div>
          </section>
        }
      >
        <PartyListWithFilters parties={parties} />
      </Suspense>
    </div>
  );
}
