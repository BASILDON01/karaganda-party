import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/orders-store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const order = getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    order: {
      id: order.id,
      status: order.status,
      amount: order.amount,
    },
  });
}
