import { NextResponse } from "next/server";

import { getUserById } from "@/lib/users-store";
import { getTicketsByUser } from "@/lib/tickets-store";

function getAuthToken(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export async function GET(req: Request) {
  const token = getAuthToken(req);
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || token !== botToken) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const telegramId = searchParams.get("telegram_id");
  if (!telegramId) {
    return NextResponse.json({ ok: false, error: "missing_telegram_id" }, { status: 400 });
  }

  const user = getUserById(telegramId);
  if (!user) {
    return NextResponse.json({ ok: false, registered: false });
  }

  const tickets = getTicketsByUser(telegramId);
  const activeTicketsCount = tickets.filter((t) => t.status === "active").length;

  return NextResponse.json({
    ok: true,
    registered: true,
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
    activeTicketsCount,
  });
}
