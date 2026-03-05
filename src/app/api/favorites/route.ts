import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { getParties } from "@/lib/parties-store";
import {
  addFavoritePartyId,
  getFavoritePartyIds,
  removeFavoritePartyId,
} from "@/lib/users-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const ids = getFavoritePartyIds(user.id);
  const set = new Set(ids);
  const parties = getParties()
    .filter((p) => set.has(p.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return NextResponse.json({ ok: true, favoritePartyIds: ids, parties });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { partyId?: string } | null;
  const partyId = String(body?.partyId ?? "").trim();
  if (!partyId) {
    return NextResponse.json({ ok: false, error: "partyId_required" }, { status: 400 });
  }

  const ids = addFavoritePartyId(user.id, partyId);
  return NextResponse.json({ ok: true, favoritePartyIds: ids });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { partyId?: string } | null;
  const partyId = String(body?.partyId ?? "").trim();
  if (!partyId) {
    return NextResponse.json({ ok: false, error: "partyId_required" }, { status: 400 });
  }

  const ids = removeFavoritePartyId(user.id, partyId);
  return NextResponse.json({ ok: true, favoritePartyIds: ids });
}

