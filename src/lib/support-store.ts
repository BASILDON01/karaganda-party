import "server-only";

import fs from "node:fs";
import path from "node:path";
import type { SupportMessage } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "support-messages.json");

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
  }
}

function readAll(): SupportMessage[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(data: SupportMessage[]) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function addMessage(userId: string, author: "user" | "support", text: string): SupportMessage {
  const list = readAll();
  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const msg: SupportMessage = {
    id,
    userId,
    author,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };
  list.push(msg);
  writeAll(list);
  return msg;
}

export function getMessagesByUser(userId: string): SupportMessage[] {
  return readAll()
    .filter((m) => m.userId === userId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getAllUserIdsWithMessages(): string[] {
  const list = readAll();
  const ids = new Set(list.map((m) => m.userId));
  return Array.from(ids);
}

export function getConversationsWithLastMessage(): Array<{
  userId: string;
  lastMessage: SupportMessage;
  unreadFromUser: boolean;
}> {
  const list = readAll();
  const byUser = new Map<string, SupportMessage[]>();
  for (const m of list) {
    if (!byUser.has(m.userId)) byUser.set(m.userId, []);
    byUser.get(m.userId)!.push(m);
  }
  return Array.from(byUser.entries()).map(([userId, messages]) => {
    const sorted = messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const last = sorted[0];
    const unreadFromUser = last.author === "user";
    return { userId, lastMessage: last, unreadFromUser };
  });
}
