import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getPartiesByOrganizer } from "@/lib/parties-store";
import { getTicketsForParties } from "@/lib/tickets-store";
import { getPendingSubmissions } from "@/lib/party-submissions-store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const parties = getPartiesByOrganizer(user.id);
  const partyIds = parties.map((p) => p.id);
  const tickets = getTicketsForParties(partyIds);

  const myPendingSubmissions = getPendingSubmissions().filter((s) => s.createdBy === user.id);

  const statsByParty = new Map<
    string,
    { sold: number; revenue: number; used: number }
  >();
  for (const p of parties) {
    statsByParty.set(p.id, { sold: 0, revenue: 0, used: 0 });
  }
  for (const t of tickets) {
    if (t.status === "cancelled") continue;
    const cur = statsByParty.get(t.party.id);
    if (!cur) continue;
    cur.sold += t.quantity;
    cur.revenue += (t.ticketType?.price ?? 0) * t.quantity;
    if (t.status === "used") cur.used += t.quantity;
  }

  const partiesWithStats = parties.map((p) => {
    const s = statsByParty.get(p.id) ?? { sold: 0, revenue: 0, used: 0 };
    return {
      ...p,
      actualSold: s.sold,
      revenue: s.revenue,
      usedCount: s.used,
    };
  });

  const totalSold = partiesWithStats.reduce((sum, p) => sum + p.actualSold, 0);
  const totalRevenue = partiesWithStats.reduce((sum, p) => sum + p.revenue, 0);

  return NextResponse.json({
    ok: true,
    parties: partiesWithStats,
    pendingSubmissions: myPendingSubmissions.length,
    stats: {
      partiesCount: parties.length,
      totalSold,
      totalRevenue,
    },
  });
}
