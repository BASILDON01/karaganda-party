import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { addPurchasedTickets } from "@/lib/tickets-store";
import { getPartyBySlug, incrementPartySold } from "@/lib/parties-store";

type Body = {
  partySlug: string;
  selections: Array<{
    ticketTypeId: string;
    quantity: number;
  }>;
  paymentMethod: "kaspi" | "halyk";
};

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Body;
  const party = getPartyBySlug(body.partySlug);
  if (!party) {
    return NextResponse.json({ ok: false, error: "party_not_found" }, { status: 404 });
  }

  if (!Array.isArray(body.selections) || body.selections.length === 0) {
    return NextResponse.json({ ok: false, error: "no_tickets_selected" }, { status: 400 });
  }

  const ticketSelections = body.selections
    .map(({ ticketTypeId, quantity }) => {
      const ticketType = party.ticketTypes.find((t) => t.id === ticketTypeId);
      if (!ticketType || quantity <= 0) return null;
      return { ticketType, quantity };
    })
    .filter((x) => x !== null) as Array<{
      ticketType: (typeof party.ticketTypes)[number];
      quantity: number;
    }>;

  if (ticketSelections.length === 0) {
    return NextResponse.json({ ok: false, error: "no_valid_tickets" }, { status: 400 });
  }

  const created = addPurchasedTickets({
    userId: user.id,
    party,
    ticketSelections,
    paymentMethod: body.paymentMethod,
  });

  for (const { ticketType, quantity } of ticketSelections) {
    incrementPartySold(party.id, ticketType.id, quantity);
  }

  return NextResponse.json({ ok: true, tickets: created });
}

