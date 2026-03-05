import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PartyCard } from "@/components/party-card";
import { getAllOrganizers, getOrganizerById } from "@/lib/organizers-store";
import { getParties } from "@/lib/parties-store";

export const dynamic = "force-dynamic";

export default async function OrganizerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const parties = getParties().filter(
    (p) => p.organizer?.id === id || p.createdBy === id,
  );

  const fromStore = getOrganizerById(id);
  const inferred =
    parties[0]?.organizer?.id === id ? parties[0].organizer : null;
  const organizer = fromStore ?? inferred;

  if (!organizer) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-3">Организатор не найден</h1>
          <p className="text-muted-foreground mb-6">
            Возможно, он был удалён или ещё не добавлен в список.
          </p>
          <Link href="/">
            <Button>На главную</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="glow-card rounded-2xl p-6 md:p-8 border border-white/10 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white/5 shrink-0">
              {organizer.logo ? (
                <Image
                  src={organizer.logo}
                  alt={organizer.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50">
                  {organizer.name.slice(0, 1)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold tracking-wider truncate">
                  {organizer.name}
                </h1>
                {organizer.verified && (
                  <Badge className="bg-primary/20 text-primary border-0">
                    Verified
                  </Badge>
                )}
              </div>
              {organizer.description && (
                <p className="text-muted-foreground mt-2">
                  {organizer.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-4">
                {organizer.socialLinks?.instagram && (
                  <a
                    href={organizer.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-2">
                      Instagram <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
                {organizer.socialLinks?.telegram && (
                  <a
                    href={organizer.socialLinks.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-2">
                      Telegram <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
                {organizer.socialLinks?.website && (
                  <a
                    href={organizer.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-2">
                      Сайт <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-wider">МЕРОПРИЯТИЯ</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {parties.length > 0
                ? `${parties.length} событие(й)`
                : "Пока нет опубликованных мероприятий"}
            </p>
          </div>
          <Link href="/">
            <Button variant="ghost">На главную</Button>
          </Link>
        </div>

        {parties.length > 0 ? (
          <div className="party-grid">
            {parties.map((p) => (
              <PartyCard key={p.id} party={p} />
            ))}
          </div>
        ) : (
          <div className="glow-card rounded-2xl p-10 border border-white/10 text-center text-muted-foreground">
            У этого организатора пока нет мероприятий.
          </div>
        )}
      </div>
    </div>
  );
}

