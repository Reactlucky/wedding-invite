import { getJob } from "@/server/exporter";

export async function GET(_req: Request, ctx: RouteContext<"/api/export/[id]">) {
  const { id } = await ctx.params;
  const job = getJob(id);
  if (!job) return Response.json({ error: "Export not found" }, { status: 404 });
  const { file: _file, ...publicJob } = job;
  void _file;
  return Response.json(publicJob, { headers: { "cache-control": "no-store" } });
}
