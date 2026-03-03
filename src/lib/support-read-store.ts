import "server-only";

import fs from "node:fs";
import path from "node:path";
import type { SupportMessage } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "support-read-state.json");

type State = {
  userLastRead: Record<string, string>;
  adminLastReadByUser: Record<string, string>;
  closedTickets: Record<string, { closedAt: string; closedBy: string }>;
};

function ensureDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readState(): State {
  ensureDir();
  if (!fs.existsSync(DATA_FILE)) {
    return { userLastRead: {}, adminLastReadByUser: {}, closedTickets: {} };
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      userLastRead: parsed.userLastRead ?? {},
      adminLastReadByUser: parsed.adminLastReadByUser ?? {},
      closedTickets: parsed.closedTickets ?? {},
    };
  } catch {
    return { userLastRead: {}, adminLastReadByUser: {}, closedTickets: {} };
  }
}

function writeState(state: State) {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf8");
}

export function getUserLastRead(userId: string): string | null {
  return readState().userLastRead[userId] ?? null;
}

export function setUserLastRead(userId: string) {
  const state = readState();
  state.userLastRead[userId] = new Date().toISOString();
  writeState(state);
}

export function getAdminLastRead(userId: string): string | null {
  return readState().adminLastReadByUser[userId] ?? null;
}

export function setAdminLastRead(userId: string) {
  const state = readState();
  state.adminLastReadByUser[userId] = new Date().toISOString();
  writeState(state);
}

export function getClosedTicket(userId: string): { closedAt: string; closedBy: string } | null {
  return readState().closedTickets[userId] ?? null;
}

export function setTicketClosed(userId: string, closedBy: string) {
  const state = readState();
  state.closedTickets[userId] = { closedAt: new Date().toISOString(), closedBy };
  writeState(state);
}

export function setTicketReopened(userId: string) {
  const state = readState();
  delete state.closedTickets[userId];
  writeState(state);
}

export function countUnreadForUser(messages: SupportMessage[], lastRead: string | null): number {
  if (!lastRead) return messages.filter((m) => m.author === "support").length;
  const t = new Date(lastRead).getTime();
  return messages.filter((m) => m.author === "support" && new Date(m.createdAt).getTime() > t).length;
}

export function countUnreadForAdmin(messages: SupportMessage[], lastRead: string | null): number {
  if (!lastRead) return messages.filter((m) => m.author === "user").length;
  const t = new Date(lastRead).getTime();
  return messages.filter((m) => m.author === "user" && new Date(m.createdAt).getTime() > t).length;
}
