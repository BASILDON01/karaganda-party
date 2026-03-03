import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { setUserLastRead, setAdminLastRead } from "@/lib/support-read-store";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { userId?: string } = {};
  try {
    body = await req.json();
  } catch {}

  if (isAdmin(user.id) && body.userId) {
    setAdminLastRead(body.userId);
    return NextResponse.json({ ok: true });
  }

  setUserLastRead(user.id);
  return NextResponse.json({ ok: true });
}
