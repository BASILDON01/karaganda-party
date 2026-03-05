import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin";
import { getSessionUser } from "@/lib/session";
import {
  getAllOrganizers,
  getFeaturedOrganizerIds,
  setFeaturedOrganizerIds,
} from "@/lib/organizers-store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isAdmin(user.id)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    organizers: getAllOrganizers(),
    featuredIds: getFeaturedOrganizerIds(),
  });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isAdmin(user.id)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let body: { featuredIds?: string[] } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const featuredIds = Array.isArray(body.featuredIds) ? body.featuredIds : [];
  const saved = setFeaturedOrganizerIds(featuredIds);
  return NextResponse.json({ ok: true, featuredIds: saved });
}

