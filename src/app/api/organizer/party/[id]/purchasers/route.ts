import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getPartyById } from "@/lib/parties-store";
import { getTicketsForParties } from "@/lib/tickets-store";
import { getUserById } from "@/lib/users-store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const party = getPartyById(id);
  if (!party || party.createdBy !== user.id) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const tickets = getTicketsForParties([id]).filter((t) => t.status !== "cancelled");

  const byUser = new Map<string, { name: string; avatar?: string; tickets: typeof tickets; total: number }>();
  for (const t of tickets) {
    const u = getUserById(t.userId);
    const name = u?.name ?? `ID ${t.userId}`;
    if (!byUser.has(t.userId)) {
      byUser.set(t.userId, { name, avatar: u?.avatar, tickets: [], total: 0 });
    }
    const rec = byUser.get(t.userId)!;
    rec.tickets.push(t);
    rec.total += t.quantity * (t.ticketType?.price ?? 0);
  }

  const purchasers = Array.from(byUser.entries()).map(([userId, data]) => ({
    userId,
    name: data.name,
    avatar: data.avatar,
    ticketsCount: data.tickets.reduce((s, t) => s + t.quantity, 0),
    totalPaid: data.total,
    purchasedAt: data.tickets[0]?.purchasedAt,
  }));

  purchasers.sort((a, b) => (b.purchasedAt ?? "").localeCompare(a.purchasedAt ?? ""));

  return NextResponse.json({ ok: true, purchasers });
}
