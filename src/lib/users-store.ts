import "server-only";

import fs from "node:fs";
import path from "node:path";

export type StoredUser = {
  id: string;
  name: string;
  avatar?: string;
  createdAt: string;
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
  data[user.id] = {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
  writeAll(data);
}

export function getUserById(telegramId: string): StoredUser | null {
  const data = readAll();
  return data[telegramId] ?? null;
}
