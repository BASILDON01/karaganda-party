import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Party } from "./types";

export type PendingOrder = {
  id: string;
  userId: string;
  partySlug: string;
  partyId: string;
  selections: Array<{ ticketTypeId: string; quantity: number }>;
  amount: number;
  paymentMethod: "kaspi" | "halyk";
  status: "pending" | "paid" | "failed" | "expired";
  createdAt: string;
  paidAt?: string;
  /** ID счёта/инвойса в системе агрегатора */
  externalInvoiceId?: string;
};

const DATA_FILE = path.join(process.cwd(), "data", "orders.json");

function ensureDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readOrders(): PendingOrder[] {
  ensureDir();
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOrders(orders: PendingOrder[]) {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), "utf8");
}

export function generateOrderId(): string {
  return "ORD-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function createPendingOrder(params: {
  userId: string;
  party: Party;
  selections: Array<{ ticketTypeId: string; quantity: number }>;
  amount: number;
  paymentMethod: "kaspi" | "halyk";
  externalInvoiceId?: string;
  id?: string;
}): PendingOrder {
  const orders = readOrders();
  const order: PendingOrder = {
    id: params.id ?? generateOrderId(),
    userId: params.userId,
    partySlug: params.party.slug,
    partyId: params.party.id,
    selections: params.selections,
    amount: params.amount,
    paymentMethod: params.paymentMethod,
    status: "pending",
    createdAt: new Date().toISOString(),
    externalInvoiceId: params.externalInvoiceId,
  };
  orders.push(order);
  writeOrders(orders);
  return order;
}

export function getOrderById(orderId: string): PendingOrder | null {
  return readOrders().find((o) => o.id === orderId) ?? null;
}

export function getOrderByExternalId(externalInvoiceId: string): PendingOrder | null {
  return readOrders().find((o) => o.externalInvoiceId === externalInvoiceId) ?? null;
}

export function setOrderPaid(orderId: string): PendingOrder | null {
  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;
  if (orders[idx].status === "paid") return orders[idx];
  orders[idx] = {
    ...orders[idx],
    status: "paid",
    paidAt: new Date().toISOString(),
  };
  writeOrders(orders);
  return orders[idx];
}

export function setOrderPaidByExternalId(externalInvoiceId: string): PendingOrder | null {
  const order = getOrderByExternalId(externalInvoiceId);
  return order ? setOrderPaid(order.id) : null;
}

export function setOrderFailed(orderId: string): void {
  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return;
  orders[idx] = { ...orders[idx], status: "failed" };
  writeOrders(orders);
}

export function setOrderExternalInvoiceId(orderId: string, externalInvoiceId: string): void {
  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return;
  orders[idx] = { ...orders[idx], externalInvoiceId };
  writeOrders(orders);
}
