import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { editorAllowed, unauthorized } from "@/server/auth";
import { UPLOAD_DIR } from "@/server/store";

const ALLOWED: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/avif": "avif",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "webm",
};

const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(req: Request) {
  if (!editorAllowed(req)) return unauthorized();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  const ext = ALLOWED[file.type];
  if (!ext) return Response.json({ error: `Unsupported type ${file.type || "unknown"}` }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "File too large (20MB max)" }, { status: 413 });
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return Response.json({ src: `/api/media/${name}`, name: file.name });
}
