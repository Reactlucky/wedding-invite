import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { getJob } from "@/server/exporter";

export async function GET(_req: Request, ctx: RouteContext<"/api/export/[id]/file">) {
  const { id } = await ctx.params;
  const job = getJob(id);
  if (!job?.file || job.status !== "done") return new Response("Not ready", { status: 404 });
  const { size } = await stat(job.file);
  return new Response(Readable.toWeb(createReadStream(job.file)) as ReadableStream, {
    headers: {
      "content-type": "video/mp4",
      "content-length": String(size),
      "content-disposition": `attachment; filename="${path.basename(job.file)}"`,
    },
  });
}
