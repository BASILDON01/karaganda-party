import { NextResponse } from "next/server";
import { getPartyBySlug } from "@/lib/parties-store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const party = getPartyBySlug(slug);
  if (!party) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, party });
}
