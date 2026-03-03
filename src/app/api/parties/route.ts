import { NextResponse } from "next/server";
import { getParties } from "@/lib/parties-store";

export async function GET() {
  const parties = getParties();
  return NextResponse.json({ ok: true, parties });
}
