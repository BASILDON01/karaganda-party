import "server-only";

import fs from "node:fs";
import path from "node:path";

export type StoredUser = {
  id: string;
  name: string;
  avatar?: string;
  createdAt: string;
  favoritePartyIds?: string[];
};

const DATA_FILE = path.join(process.cwd(), "data", "users.json");

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "{}", "utf8");
  }
}

function readAll(): Record<string, StoredUser> {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, StoredUser>) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function saveUser(user: StoredUser) {
  const data = readAll();
  const prev = data[user.id];
  data[user.id] = {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    createdAt: user.createdAt,
    // Do not lose previously saved data (e.g. favorites).
    favoritePartyIds: user.favoritePartyIds ?? prev?.favoritePartyIds ?? [],
  };
  writeAll(data);
}

export function getUserById(telegramId: string): StoredUser | null {
  const data = readAll();
  return data[telegramId] ?? null;
}

export function getUsersCount(): number {
  return Object.keys(readAll()).length;
}

export function getFavoritePartyIds(userId: string): string[] {
  const u = getUserById(userId);
  return Array.isArray(u?.favoritePartyIds) ? u!.favoritePartyIds : [];
}

export function addFavoritePartyId(userId: string, partyId: string): string[] {
  const data = readAll();
  const prev = data[userId];
  if (!prev) return [];
  const set = new Set<string>(Array.isArray(prev.favoritePartyIds) ? prev.favoritePartyIds : []);
  set.add(String(partyId));
  prev.favoritePartyIds = Array.from(set);
  data[userId] = prev;
  writeAll(data);
  return prev.favoritePartyIds;
}

export function removeFavoritePartyId(userId: string, partyId: string): string[] {
  const data = readAll();
  const prev = data[userId];
  if (!prev) return [];
  const next = (Array.isArray(prev.favoritePartyIds) ? prev.favoritePartyIds : []).filter(
    (id) => id !== String(partyId),
  );
  prev.favoritePartyIds = next;
  data[userId] = prev;
  writeAll(data);
  return next;
}
