import "server-only";

import fs from "node:fs";
import path from "node:path";

import type { Organizer } from "@/lib/types";
import { organizers as seedOrganizers } from "@/lib/mock-data";
import { getParties } from "@/lib/parties-store";

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

function normalizeOrganizer(o: Organizer): Organizer {
  return {
    id: String(o.id ?? "").trim(),
    name: String(o.name ?? "").trim(),
    description: o.description ? String(o.description) : undefined,
    logo: o.logo ? String(o.logo) : undefined,
    verified: Boolean(o.verified),
    socialLinks: o.socialLinks
      ? {
          instagram: o.socialLinks.instagram ? String(o.socialLinks.instagram) : undefined,
          telegram: o.socialLinks.telegram ? String(o.socialLinks.telegram) : undefined,
          website: o.socialLinks.website ? String(o.socialLinks.website) : undefined,
        }
      : undefined,
  };
}

function isOrganizerValid(o: Organizer): boolean {
  return Boolean(o?.id && o?.name);
}

function getOrganizersIndex(): Map<string, Organizer> {
  const { organizers } = readState();

  const map = new Map<string, Organizer>();

  for (const o of organizers) {
    const n = normalizeOrganizer(o);
    if (isOrganizerValid(n)) map.set(n.id, n);
  }

  // Include organizers inferred from real parties (so admin can feature real organizers).
  for (const p of getParties()) {
    const org = p.organizer;
    if (!org) continue;
    const n = normalizeOrganizer(org);
    if (!isOrganizerValid(n)) continue;

    // Prefer party-derived organizer when it has more info (logo/links/description).
    const prev = map.get(n.id);
    if (!prev) {
      map.set(n.id, n);
      continue;
    }
    map.set(n.id, {
      ...prev,
      name: prev.name || n.name,
      description: prev.description || n.description,
      logo: prev.logo || n.logo,
      verified: prev.verified || n.verified,
      socialLinks: prev.socialLinks || n.socialLinks,
    });
  }

  // Ensure seed organizers always exist as a fallback.
  for (const o of seedOrganizers) {
    const n = normalizeOrganizer(o);
    if (isOrganizerValid(n) && !map.has(n.id)) map.set(n.id, n);
  }

  return map;
}

export function getAllOrganizers(): Organizer[] {
  return Array.from(getOrganizersIndex().values());
}

export function getFeaturedOrganizerIds(): string[] {
  return readState().featuredIds;
}

export function getFeaturedOrganizers(limit = 3): Organizer[] {
  const { featuredIds } = readState();
  const map = getOrganizersIndex();
  const list = featuredIds.map((id) => map.get(id)).filter(Boolean) as Organizer[];
  return list.slice(0, Math.max(0, limit));
}

export function getOrganizerById(id: string): Organizer | null {
  return getOrganizersIndex().get(id) ?? null;
}

export function setFeaturedOrganizerIds(ids: string[]): string[] {
  const { organizers } = readState();
  const exists = new Set(getOrganizersIndex().keys());
  const normalized = ids
    .map((x) => String(x).trim())
    .filter(Boolean)
    .filter((x, i, a) => a.indexOf(x) === i)
    .filter((x) => exists.has(x));

  const state: OrganizersState = { organizers, featuredIds: normalized };
  writeState(state);
  return normalized;
}

