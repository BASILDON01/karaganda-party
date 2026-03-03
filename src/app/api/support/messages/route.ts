import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { addMessage, getMessagesByUser, getAllUserIdsWithMessages } from "@/lib/support-store";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const forUserId = searchParams.get("userId");

  if (isAdmin(user.id)) {
    if (forUserId) {
      const messages = getMessagesByUser(forUserId);
      return NextResponse.json({ ok: true, messages, asAdmin: true });
    }
    const userIds = getAllUserIdsWithMessages();
    const conversations = userIds.map((uid) => ({
      userId: uid,
      messages: getMessagesByUser(uid),
    }));
    return NextResponse.json({ ok: true, conversations });
  }

  const messages = getMessagesByUser(user.id);
  return NextResponse.json({ ok: true, messages }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
    },
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { text: string; userId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ ok: false, error: "empty_message" }, { status: 400 });
  }

  if (isAdmin(user.id) && body.userId) {
    const msg = addMessage(body.userId, "support", text);
    return NextResponse.json({ ok: true, message: msg });
  }

  const msg = addMessage(user.id, "user", text);
  return NextResponse.json({ ok: true, message: msg });
}
