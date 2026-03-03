import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { addSubmission } from "@/lib/party-submissions-store";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: {
    name: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    venue: string;
    address: string;
    dressCode: string;
    ageRestriction: number;
    ticketTypes: Array<{ name: string; price: number; quantity: number; description?: string }>;
    image?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  if (!body.name || !body.date || !body.startTime || !body.venue) {
    return NextResponse.json(
      { ok: false, error: "missing_fields", message: "Заполните название, дату, время и площадку" },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.ticketTypes) || !body.ticketTypes.some((t) => t.name && t.price > 0 && t.quantity > 0)) {
    return NextResponse.json(
      { ok: false, error: "ticket_types", message: "Добавьте хотя бы один тип билета" },
      { status: 400 }
    );
  }

  const submission = addSubmission({
    name: String(body.name).trim(),
    description: String(body.description ?? "").trim(),
    date: String(body.date).trim(),
    startTime: String(body.startTime).trim(),
    endTime: String(body.endTime ?? "").trim(),
    venue: String(body.venue).trim(),
    address: String(body.address ?? "").trim(),
    dressCode: String(body.dressCode ?? "").trim(),
    ageRestriction: Number(body.ageRestriction) || 18,
    ticketTypes: body.ticketTypes.map((t) => ({
      name: String(t.name).trim(),
      price: Number(t.price) || 0,
      quantity: Number(t.quantity) || 0,
      description: t.description ? String(t.description).trim() : undefined,
    })),
    image: body.image ? String(body.image).trim() : undefined,
    createdBy: user.id,
  });

  return NextResponse.json({ ok: true, submission: { id: submission.id, status: submission.status } });
}
