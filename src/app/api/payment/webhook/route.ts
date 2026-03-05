import { NextResponse } from "next/server";

import type { Party } from "@/lib/types";
import { getOrderById, getOrderByExternalId, setOrderPaid } from "@/lib/orders-store";
import { getPartyBySlug, incrementPartySold } from "@/lib/parties-store";
import { addPurchasedTickets } from "@/lib/tickets-store";

/**
 * Вебхук от платёжного агрегатора (ApiPay и т.п.).
 * В теле запроса ожидаем: external_order_id или order_id, status = "paid" | "completed".
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const status = String(body.status ?? body.payment_status ?? "").toLowerCase();
    const orderId = (body.external_order_id ?? body.order_id ?? body.merchant_order_id) as string | undefined;
    const invoiceId = (body.id ?? body.invoice_id) as string | undefined;

    if (!orderId && !invoiceId) {
      return NextResponse.json({ ok: false, error: "missing_order_id" }, { status: 400 });
    }

    const order = orderId ? getOrderById(String(orderId)) : invoiceId ? getOrderByExternalId(String(invoiceId)) : null;
    if (!order) {
      return NextResponse.json({ ok: false, error: "order_not_found" }, { status: 404 });
    }
    if (order.status === "paid") {
      return NextResponse.json({ ok: true, message: "already_paid" });
    }

    if (status !== "paid" && status !== "completed" && status !== "success") {
      return NextResponse.json({ ok: false, error: "unexpected_status" }, { status: 400 });
    }

    const updated = setOrderPaid(order.id);
    if (!updated) return NextResponse.json({ ok: false }, { status: 500 });

    const party = getPartyBySlug(order.partySlug);
    if (!party) {
      return NextResponse.json({ ok: false, error: "party_not_found" }, { status: 500 });
    }

    const ticketSelections = order.selections
      .map(({ ticketTypeId, quantity }) => {
        const ticketType = party.ticketTypes.find((t) => t.id === ticketTypeId);
        if (!ticketType || quantity <= 0) return null;
        return { ticketType, quantity };
      })
      .filter((x) => x !== null) as Array<{ ticketType: Party["ticketTypes"][number]; quantity: number }>;

    addPurchasedTickets({
      userId: order.userId,
      party,
      ticketSelections,
      paymentMethod: order.paymentMethod,
    });

    for (const { ticketType, quantity } of ticketSelections) {
      incrementPartySold(party.id, ticketType.id, quantity);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[payment] webhook error", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
