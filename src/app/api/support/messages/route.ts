import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { addMessage, getMessagesByUser, getAllUserIdsWithMessages } from "@/lib/support-store";
import {
  getUserLastRead,
  setUserLastRead,
  getAdminLastRead,
  setAdminLastRead,
  getClosedTicket,
  setTicketReopened,
  countUnreadForUser,
  countUnreadForAdmin,
} from "@/lib/support-read-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Pragma": "no-cache",
};

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const forUserId = searchParams.get("userId");
  const conversationsOnly = searchParams.get("conversations") === "1";

  if (isAdmin(user.id) && conversationsOnly) {
    const userIds = getAllUserIdsWithMessages();
    const conversations = userIds.map((uid) => {
      const messages = getMessagesByUser(uid);
      const lastRead = getAdminLastRead(uid);
      const unreadCount = countUnreadForAdmin(messages, lastRead);
      const closed = getClosedTicket(uid);
      return {
        userId: uid,
        messages,
        unreadCount,
        isClosed: !!closed,
        closedAt: closed?.closedAt,
      };
    });
    return NextResponse.json({ ok: true, conversations });
  }

  if (isAdmin(user.id) && forUserId) {
    const messages = getMessagesByUser(forUserId);
    const closed = getClosedTicket(forUserId);
    return NextResponse.json({
      ok: true,
      messages,
      asAdmin: true,
      isClosed: !!closed,
      closedAt: closed?.closedAt,
    });
  }

  const messages = getMessagesByUser(user.id);
  const lastRead = getUserLastRead(user.id);
  const unreadCount = countUnreadForUser(messages, lastRead);
  const closed = getClosedTicket(user.id);
  return NextResponse.json(
    {
      ok: true,
      messages,
      unreadCount,
      isClosed: !!closed,
      closedAt: closed?.closedAt,
    },
    { headers: NO_CACHE_HEADERS }
  );
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

  setTicketReopened(user.id);
  const msg = addMessage(user.id, "user", text);
  return NextResponse.json({ ok: true, message: msg });
}
