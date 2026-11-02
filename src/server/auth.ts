import "server-only";

/**
 * If EDITOR_TOKEN is set, editor-only endpoints (save, upload, export, RSVP list)
 * require the `x-editor-token` header. Without it the app runs open, which is
 * what you want for local development.
 */
export function editorAllowed(req: Request): boolean {
  const token = process.env.EDITOR_TOKEN;
  if (!token) return true;
  return req.headers.get("x-editor-token") === token;
}

export const unauthorized = () => Response.json({ error: "Editor token required" }, { status: 401 });
