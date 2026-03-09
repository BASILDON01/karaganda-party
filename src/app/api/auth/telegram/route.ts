import { NextResponse } from "next/server";

import type { User } from "@/lib/types";
import { setSessionCookie } from "@/lib/session";
import { saveUser } from "@/lib/users-store";
import { isAdmin } from "@/lib/admin";
import { verifyTelegramAuth, type TelegramAuthPayload } from "@/lib/telegram-auth";

export async function POST(req: Request) {
  const payload = (await req.json()) as TelegramAuthPayload;
  const verification = verifyTelegramAuth(payload);
  if (!verification.ok) {
    return NextResponse.json(
      { ok: false, error: "telegram_auth_invalid", reason: verification.reason },
      { status: 401 },
    );
  }

  const phone = payload.phone_number ?? "";
  const user: User = {
    id: String(payload.id),
    name: [payload.first_name, payload.last_name].filter(Boolean).join(" "),
    email: "",
    phone,
    role: "user",
    avatar: payload.photo_url,
    createdAt: new Date(payload.auth_date * 1000).toISOString(),
  };

  await setSessionCookie(user);
  saveUser({ id: user.id, name: user.name, avatar: user.avatar, phone: phone || undefined, createdAt: user.createdAt });

  return NextResponse.json({ ok: true, user, isAdmin: isAdmin(user.id) });
}

