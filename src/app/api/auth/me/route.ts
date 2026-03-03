import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }
  return NextResponse.json({ ok: true, user, isAdmin: isAdmin(user.id) });
}

