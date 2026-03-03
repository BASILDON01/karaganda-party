import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { Party, TicketType, PurchasedTicket } from "@/lib/types";

const DATA_FILE = path.join(process.cwd(), "data", "tickets.json");

type StoredTicket = PurchasedTicket;

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
  }
}

function readAllTickets(): StoredTicket[] {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as StoredTicket[];
    return [];
  } catch {
    return [];
  }
}

function writeAllTickets(tickets: StoredTicket[]) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(tickets, null, 2), "utf8");
}

export function generateQRCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "QR-";
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateTicketId(): string {
  return (
    "TKT-" +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
}

export function getTicketsByUser(userId: string): StoredTicket[] {
  const all = readAllTickets();
  return all.filter((t) => t.userId === userId);
}

export function getAllTickets(): StoredTicket[] {
  return readAllTickets();
}

export function findTicketByQr(qrCode: string): StoredTicket | undefined {
  const all = readAllTickets();
  return all.find((t) => t.qrCode === qrCode);
}

export function markTicketUsed(qrCode: string): StoredTicket | undefined {
  const all = readAllTickets();
  const idx = all.findIndex((t) => t.qrCode === qrCode);
  if (idx === -1) return undefined;
  const ticket = all[idx];
  if (ticket.status === "used") return ticket;
  const updated: StoredTicket = {
    ...ticket,
    status: "used",
  };
  all[idx] = updated;
  writeAllTickets(all);
  return updated;
}

export function addPurchasedTickets(params: {
  userId: string;
  party: Party;
  ticketSelections: Array<{
    ticketType: TicketType;
    quantity: number;
  }>;
  paymentMethod: "kaspi" | "halyk";
}): StoredTicket[] {
  const all = readAllTickets();
  const created: StoredTicket[] = [];

  for (const { ticketType, quantity } of params.ticketSelections) {
    if (quantity <= 0) continue;
    const newTicket: StoredTicket = {
      userId: params.userId,
      id: generateTicketId(),
      party: params.party,
      ticketType,
      quantity,
      purchasedAt: new Date().toISOString(),
      status: "active",
      qrCode: generateQRCode(),
      paymentMethod: params.paymentMethod,
    };
    all.push(newTicket);
    created.push(newTicket);
  }

  if (created.length > 0) {
    writeAllTickets(all);
  }

  return created;
}

