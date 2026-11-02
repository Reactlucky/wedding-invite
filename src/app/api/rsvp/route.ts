import { randomUUID } from "node:crypto";
import { editorAllowed, unauthorized } from "@/server/auth";
import { addRsvp, listRsvps } from "@/server/store";
import type { Rsvp } from "@/lib/types";

export async function GET(req: Request) {
  if (!editorAllowed(req)) return unauthorized();
  const all = await listRsvps();
  return Response.json(all.sort((a, b) => b.createdAt - a.createdAt), { headers: { "cache-control": "no-store" } });
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = str(body.name, 120);
  const attending = body.attending;
  if (!name) return Response.json({ error: "Please enter your name" }, { status: 400 });
  if (attending !== "yes" && attending !== "no" && attending !== "maybe") {
    return Response.json({ error: "Please choose whether you can attend" }, { status: 400 });
  }
  const guests = Math.max(0, Math.min(20, Math.floor(Number(body.guests) || 0)));
  const rsvp: Rsvp = {
    id: randomUUID(),
    name,
    phone: str(body.phone, 40) || undefined,
    attending,
    guests: attending === "no" ? 0 : Math.max(1, guests),
    events: Array.isArray(body.events) ? body.events.map((e) => str(e, 80)).filter(Boolean).slice(0, 12) : [],
    message: str(body.message, 1000) || undefined,
    createdAt: Date.now(),
  };
  await addRsvp(rsvp);
  return Response.json({ ok: true, id: rsvp.id });
}
