import "server-only";

import crypto from "node:crypto";

export type TelegramAuthPayload = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return token;
}

function getMaxAgeSeconds(): number {
  const raw = process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS;
  const parsed = raw ? Number(raw) : 86400;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 86400;
}

function buildDataCheckString(payload: TelegramAuthPayload): string {
  const entries: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(payload)) {
    if (key === "hash") continue;
    if (value === undefined || value === null) continue;
    entries.push([key, String(value)]);
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([k, v]) => `${k}=${v}`).join("\n");
}

function computeHash(dataCheckString: string, botToken: string): string {
  // Telegram docs:
  // secret_key = SHA256(bot_token)
  // hash = HMAC_SHA256(data_check_string, secret_key)
  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  return crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyTelegramAuth(payload: TelegramAuthPayload): {
  ok: true;
} | {
  ok: false;
  reason: string;
} {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const maxAge = getMaxAgeSeconds();

  if (!payload?.hash) return { ok: false, reason: "missing_hash" };
  if (!payload?.id) return { ok: false, reason: "missing_id" };
  if (!payload?.first_name) return { ok: false, reason: "missing_first_name" };
  if (!payload?.auth_date) return { ok: false, reason: "missing_auth_date" };

  if (payload.auth_date > nowSeconds + 60) {
    return { ok: false, reason: "auth_date_in_future" };
  }
  if (nowSeconds - payload.auth_date > maxAge) {
    return { ok: false, reason: "auth_date_expired" };
  }

  const botToken = getBotToken();
  const dataCheckString = buildDataCheckString(payload);
  const expectedHash = computeHash(dataCheckString, botToken);

  if (!timingSafeEqualHex(payload.hash, expectedHash)) {
    return { ok: false, reason: "hash_mismatch" };
  }

  return { ok: true };
}

