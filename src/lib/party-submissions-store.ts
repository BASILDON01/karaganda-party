import "server-only";

import fs from "node:fs";
import path from "node:path";
import type { PartySubmission } from "./types";

const DATA_FILE = path.join(process.cwd(), "data", "party-submissions.json");

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
  }
}

function readAll(): PartySubmission[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(data: PartySubmission[]) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function addSubmission(submission: Omit<PartySubmission, "id" | "createdAt" | "status">): PartySubmission {
  const list = readAll();
  const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  const newOne: PartySubmission = {
    ...submission,
    id,
    createdAt: now,
    status: "pending",
  };
  list.push(newOne);
  writeAll(list);
  return newOne;
}

export function getSubmissionById(id: string): PartySubmission | null {
  const list = readAll();
  return list.find((s) => s.id === id) ?? null;
}

export function getPendingSubmissions(): PartySubmission[] {
  return readAll().filter((s) => s.status === "pending");
}

export function setSubmissionStatus(
  id: string,
  status: "approved" | "rejected",
  reviewedBy: string,
  rejectionReason?: string
): PartySubmission | null {
  const list = readAll();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  list[idx] = {
    ...list[idx],
    status,
    reviewedAt: now,
    reviewedBy,
    ...(rejectionReason && { rejectionReason }),
  };
  writeAll(list);
  return list[idx];
}
