import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeInvitation } from "@/lib/defaults";
import type { InvitationData, Rsvp } from "@/lib/types";

/**
 * Tiny file-backed store. Fine for a single self-hosted invitation; swap for a
 * database (Postgres / KV) + object storage (S3 / R2) when going multi-tenant.
 */
export const DATA_DIR = process.env.INVITE_DATA_DIR ?? path.join(/* turbopackIgnore: true */ process.cwd(), ".data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
export const EXPORT_DIR = path.join(DATA_DIR, "exports");

const INVITE_FILE = path.join(DATA_DIR, "invitation.json");
const RSVP_FILE = path.join(DATA_DIR, "rsvps.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(value, null, 2));
  await rename(tmp, file);
}

export async function getInvitation(): Promise<InvitationData> {
  return normalizeInvitation(await readJson<Partial<InvitationData> | null>(INVITE_FILE, null));
}

export async function saveInvitation(data: Partial<InvitationData>): Promise<InvitationData> {
  const next = normalizeInvitation({ ...data, updatedAt: Date.now() });
  await writeJson(INVITE_FILE, next);
  return next;
}

export async function listRsvps(): Promise<Rsvp[]> {
  return readJson<Rsvp[]>(RSVP_FILE, []);
}

let rsvpQueue: Promise<unknown> = Promise.resolve();

export function addRsvp(rsvp: Rsvp): Promise<void> {
  // serialise writes so concurrent submissions don't clobber each other
  const job = rsvpQueue.then(async () => {
    const all = await listRsvps();
    all.push(rsvp);
    await writeJson(RSVP_FILE, all);
  });
  rsvpQueue = job.catch(() => {});
  return job;
}
