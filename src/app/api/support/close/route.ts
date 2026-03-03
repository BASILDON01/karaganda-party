import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { setTicketClosed, setTicketReopened } from "@/lib/support-read-store";
import { deleteMessagesByUser } from "@/lib/support-store";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isAdmin(user.id)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let body: { userId?: string; reopen?: boolean } = {};
  try {
    const parsed = await req.json();
    if (parsed && typeof parsed === "object") body = parsed;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "missing_user_id" }, { status: 400 });
  }

  if (body.reopen) {
    setTicketReopened(userId);
    return NextResponse.json({ ok: true, reopened: true });
  }

  setTicketClosed(userId, user.id);
  deleteMessagesByUser(userId);
  return NextResponse.json({ ok: true });
}
