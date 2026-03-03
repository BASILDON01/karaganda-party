import { NextResponse } from "next/server";

import { findTicketByQr, markTicketUsed } from "@/lib/tickets-store";

type Body = {
  qrCode: string;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const qrCode = body.qrCode?.trim();
  if (!qrCode) {
    return NextResponse.json({ ok: false, error: "missing_qr" }, { status: 400 });
  }

  const ticket = findTicketByQr(qrCode);
  if (!ticket) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (ticket.status === "used") {
    return NextResponse.json({ ok: false, error: "already_used", ticket }, { status: 409 });
  }

  const updated = markTicketUsed(qrCode) ?? ticket;

  return NextResponse.json({ ok: true, ticket: updated });
}

