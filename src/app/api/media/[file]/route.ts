import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { UPLOAD_DIR } from "@/server/store";

const TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  wav: "audio/wav",
  webm: "audio/webm",
};

export async function GET(req: Request, ctx: RouteContext<"/api/media/[file]">) {
  const { file } = await ctx.params;
  if (!/^[\w-]+\.[a-z0-9]+$/i.test(file)) return new Response("Not found", { status: 404 });
  const full = path.join(UPLOAD_DIR, file);
  let size: number;
  try {
    size = (await stat(full)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }
  const type = TYPES[file.split(".").pop()!.toLowerCase()] ?? "application/octet-stream";
  const headers: Record<string, string> = {
    "content-type": type,
    "accept-ranges": "bytes",
    // uploads are content-addressed by uuid, so they never change
    "cache-control": "public, max-age=31536000, immutable",
  };

  // Range support so Safari/iOS can stream uploaded music
  const range = req.headers.get("range");
  const m = range?.match(/bytes=(\d*)-(\d*)/);
  if (m) {
    const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    }
    const stream = Readable.toWeb(createReadStream(full, { start, end })) as ReadableStream;
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "content-range": `bytes ${start}-${end}/${size}`, "content-length": String(end - start + 1) },
    });
  }
  const stream = Readable.toWeb(createReadStream(full)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, "content-length": String(size) } });
}
