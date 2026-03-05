import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { Organizer } from "@/lib/types";
import { organizers as seedOrganizers } from "@/lib/mock-data";

type OrganizersState = {
  organizers: Organizer[];
  featuredIds: string[];
};

const DATA_FILE = path.join(process.cwd(), "data", "organizers.json");

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial: OrganizersState = {
      organizers: seedOrganizers,
      featuredIds: seedOrganizers.slice(0, 3).map((o) => o.id),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

function readState(): OrganizersState {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<OrganizersState>;
    const organizers = Array.isArray(parsed.organizers) ? parsed.organizers : [];
    const featuredIds = Array.isArray(parsed.featuredIds) ? parsed.featuredIds : [];
    return { organizers, featuredIds };
  } catch {
    return { organizers: seedOrganizers, featuredIds: seedOrganizers.slice(0, 3).map((o) => o.id) };
  }
}

function writeState(state: OrganizersState) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf8");
}

export function getAllOrganizers(): Organizer[] {
  return readState().organizers;
}

export function getFeaturedOrganizerIds(): string[] {
  return readState().featuredIds;
}

export function getFeaturedOrganizers(limit = 3): Organizer[] {
  const { organizers, featuredIds } = readState();
  const map = new Map(organizers.map((o) => [o.id, o]));
  const list = featuredIds.map((id) => map.get(id)).filter(Boolean) as Organizer[];
  return list.slice(0, Math.max(0, limit));
}

export function getOrganizerById(id: string): Organizer | null {
  const { organizers } = readState();
  return organizers.find((o) => o.id === id) ?? null;
}

export function setFeaturedOrganizerIds(ids: string[]): string[] {
  const { organizers } = readState();
  const exists = new Set(organizers.map((o) => o.id));
  const normalized = ids
    .map((x) => String(x).trim())
    .filter(Boolean)
    .filter((x, i, a) => a.indexOf(x) === i)
    .filter((x) => exists.has(x));

  const state: OrganizersState = { organizers, featuredIds: normalized };
  writeState(state);
  return normalized;
}

