import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getPartyById, updateOrganizerParty } from "@/lib/parties-store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const party = getPartyById(id);
  if (!party || party.createdBy !== user.id) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, party });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: { gallery?: string[]; lineup?: { id?: string; name: string; role: string; image?: string }[]; ticketTypes?: { id: string; quantity: number }[]; hashtags?: string[]; venue?: { name: string; address: string; city: string } } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const lineup =
    body.lineup?.map((a, i) => ({
      id: a.id ?? `artist-${Date.now()}-${i}`,
      name: a.name,
      role: a.role,
      image: a.image,
    }));

  const party = updateOrganizerParty(id, user.id, {
    gallery: body.gallery,
    lineup,
    ticketTypes: body.ticketTypes,
    hashtags: body.hashtags,
    venue: body.venue,
  });

  if (!party) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, party });
}
