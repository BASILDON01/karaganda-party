import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { getTicketsByUser } from "@/lib/tickets-store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, tickets: [] }, { status: 401 });
  }
  const tickets = getTicketsByUser(user.id);
  return NextResponse.json({ ok: true, tickets });
}

