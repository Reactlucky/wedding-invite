import { editorAllowed, unauthorized } from "@/server/auth";
import { FORMATS, startExport, type ExportFormat } from "@/server/exporter";
import { TEMPLATES, type TemplateId } from "@/lib/types";

export async function POST(req: Request) {
  if (!editorAllowed(req)) return unauthorized();
  const body = (await req.json().catch(() => ({}))) as { template?: string; format?: string };
  const template = body.template as TemplateId;
  const format = (body.format ?? "portrait") as ExportFormat;
  if (!TEMPLATES.includes(template)) return Response.json({ error: "Unknown template" }, { status: 400 });
  if (!(format in FORMATS)) return Response.json({ error: "Unknown format" }, { status: 400 });
  const job = startExport(new URL(req.url).origin, template, format);
  return Response.json(job, { status: 202 });
}
