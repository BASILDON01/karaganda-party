import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { getParties } from "@/lib/parties-store";
import { getPendingSubmissions } from "@/lib/party-submissions-store";
import { getAllTickets } from "@/lib/tickets-store";
import { getUsersCount } from "@/lib/users-store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isAdmin(user.id)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const parties = getParties();
  const pending = getPendingSubmissions();
  const tickets = getAllTickets();
  const usersCount = getUsersCount();

  const activeTickets = tickets.filter((t) => t.status === "active" || t.status === "used");
  const totalTicketsSold = activeTickets.reduce((sum, t) => sum + (t.quantity ?? 1), 0);

  return NextResponse.json({
    ok: true,
    stats: {
      partiesCount: parties.length,
      pendingSubmissionsCount: pending.length,
      totalTicketsSold,
      usersCount,
    },
  });
}
