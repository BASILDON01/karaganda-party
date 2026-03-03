import "server-only";

export function isAdmin(telegramId: string): boolean {
  const ids = process.env.ADMIN_TELEGRAM_IDS;
  if (!ids || !telegramId) return false;
  const list = ids.split(",").map((s) => s.trim());
  return list.includes(telegramId);
}
