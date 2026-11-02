import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { editorAllowed, unauthorized } from "@/server/auth";
import { UPLOAD_DIR } from "@/server/store";

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err = (err + d).slice(-2000)));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${err}`))));
  });
}

const clean = (v: unknown) =>
  String(v ?? "")
    .replace(/[^\p{L}\p{M} .'-]/gu, "")
    .trim()
    .slice(0, 40);

/**
 * Generates an original railway-style platform announcement with the couple's
 * names using the macOS Hindi voice (Lekha), then gives it a station PA sound.
 */
export async function POST(req: Request) {
  if (!editorAllowed(req)) return unauthorized();
  if (process.platform !== "darwin") {
    return Response.json({ error: "Announcement generation uses the macOS voice and only works on a Mac. Upload an audio file instead." }, { status: 501 });
  }
  const body = (await req.json().catch(() => ({}))) as { a?: string; b?: string; english?: boolean };
  const a = clean(body.a) || "Bride";
  const b = clean(body.b) || "Groom";
  const hindi = `यात्रीगण कृपया ध्यान दें। गाड़ी संख्या एक चार शून्य दो, ${a} और ${b} वेडिंग एक्सप्रेस, थोड़ी ही देर में प्लेटफ़ॉर्म संख्या एक पर आ रही है।`;
  const english = `May I have your attention please. Train number one four zero two, the ${a} and ${b} Wedding Express, will shortly arrive on platform number one.`;

  const dir = await mkdtemp(path.join(tmpdir(), "announce-"));
  try {
    await run("say", ["-v", "Lekha", "-r", "175", "-o", path.join(dir, "hi.aiff"), hindi]);
    const inputs = ["-i", path.join(dir, "hi.aiff")];
    let chain = "[0:a]aresample=44100[x0]";
    let concat = "[x0]";
    let n = 1;
    if (body.english) {
      await run("say", ["-v", "Lekha", "-r", "175", "-o", path.join(dir, "en.aiff"), english]);
      inputs.push("-f", "lavfi", "-t", "0.5", "-i", "anullsrc=r=44100:cl=mono", "-i", path.join(dir, "en.aiff"));
      chain += ";[1:a]aresample=44100[x1];[2:a]aresample=44100[x2]";
      concat += "[x1][x2]";
      n = 3;
    }
    // station loudspeaker: band-limited, slapback echo off the platform roof
    const filter = `${chain};${concat}concat=n=${n}:v=0:a=1,highpass=f=300,lowpass=f=3400,aecho=0.8:0.55:70|150:0.3|0.15,volume=2,alimiter=limit=0.9[out]`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${randomUUID()}.mp3`;
    await run(process.env.FFMPEG_PATH ?? "ffmpeg", ["-y", ...inputs, "-filter_complex", filter, "-map", "[out]", "-ac", "2", "-b:a", "128k", path.join(UPLOAD_DIR, name)]);
    return Response.json({ src: `/api/media/${name}`, name: `Announcement (${a} & ${b})` });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Could not generate announcement" }, { status: 500 });
  } finally {
    rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
