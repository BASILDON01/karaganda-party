import "server-only";

import fs from "node:fs";
import path from "node:path";
import type { Party, Venue, Organizer, TicketType } from "./types";
import type { PartySubmission } from "./types";
import { getSeedParties } from "./seed-parties";

const DATA_FILE = path.join(process.cwd(), "data", "parties.json");

const DEFAULT_ORGANIZER: Organizer = {
  id: "factor",
  name: "FactorKZ",
  description: "Организатор мероприятий",
  verified: true,
};

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readAll(): Party[] {
  ensureDataFile();
  if (!fs.existsSync(DATA_FILE)) {
    const list = getSeedParties();
    writeAll(list);
    return list;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(data: Party[]) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
}

function makeUniqueSlug(baseSlug: string, existing: Party[]): string {
  let slug = baseSlug;
  let n = 0;
  while (existing.some((p) => p.slug === slug)) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
  return slug;
}

export function getParties(): Party[] {
  return readAll();
}

export function getUpcomingParties(): Party[] {
  return readAll().filter((p) => p.status === "upcoming");
}

export function getPartyBySlug(slug: string): Party | undefined {
  return readAll().find((p) => p.slug === slug);
}

export function addPartyFromSubmission(sub: PartySubmission): Party {
  const list = readAll();
  const now = new Date().toISOString();
  const baseSlug = slugify(sub.name) || "event";
  const slug = makeUniqueSlug(baseSlug, list);
  const venueId = `venue-${Date.now()}`;
  const venue: Venue = {
    id: venueId,
    name: sub.venue,
    address: sub.address,
    city: "Караганда",
  };
  const ticketTypes: TicketType[] = sub.ticketTypes.map((t, i) => ({
    id: `tt-${Date.now()}-${i}`,
    name: t.name,
    description: t.description,
    price: t.price,
    currency: "KZT",
    quantity: t.quantity,
    sold: 0,
    maxPerOrder: 5,
  }));
  const totalTickets = ticketTypes.reduce((s, t) => s + t.quantity, 0);
  const party: Party = {
    id: `party-${Date.now()}`,
    name: sub.name,
    slug,
    description: sub.description,
    date: sub.date,
    time: sub.startTime,
    endTime: sub.endTime || undefined,
    venue,
    image: sub.image || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=500&fit=crop",
    gallery: [],
    lineup: [],
    ticketTypes,
    dressCode: sub.dressCode || undefined,
    ageRestriction: sub.ageRestriction,
    organizer: DEFAULT_ORGANIZER,
    status: "upcoming",
    totalTickets,
    soldTickets: 0,
    createdAt: now,
    updatedAt: now,
  };
  list.push(party);
  writeAll(list);
  return party;
}

export function deletePartyById(partyId: string): boolean {
  const list = readAll();
  const idx = list.findIndex((p) => p.id === partyId);
  if (idx === -1) return false;
  list.splice(idx, 1);
  writeAll(list);
  return true;
}
