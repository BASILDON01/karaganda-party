import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { getPendingSubmissions } from "@/lib/party-submissions-store";
import { getUserById } from "@/lib/users-store";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isAdmin(user.id)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const list = getPendingSubmissions();
  const submissionsWithCreator = list.map((s) => {
    const creator = getUserById(s.createdBy);
    return {
      ...s,
      creator: creator
        ? { id: creator.id, name: creator.name, avatar: creator.avatar, createdAt: creator.createdAt }
        : null,
    };
  });
  return NextResponse.json({ ok: true, submissions: submissionsWithCreator });
}
