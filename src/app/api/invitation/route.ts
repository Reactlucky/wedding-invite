import { editorAllowed, unauthorized } from "@/server/auth";
import { getInvitation, saveInvitation } from "@/server/store";
import type { InvitationData } from "@/lib/types";

export async function GET() {
  return Response.json(await getInvitation(), { headers: { "cache-control": "no-store" } });
}

export async function PUT(req: Request) {
  if (!editorAllowed(req)) return unauthorized();
  let body: Partial<InvitationData>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) return Response.json({ error: "Invalid body" }, { status: 400 });
  const raw = JSON.stringify(body);
  if (raw.length > 2_000_000) return Response.json({ error: "Invitation too large" }, { status: 413 });
  return Response.json(await saveInvitation(body));
}
