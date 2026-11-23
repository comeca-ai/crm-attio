import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { err, json, withUser } from "@/lib/api";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withUser(async () => {
    const { id } = await params;
    const f = await prisma.file.findUnique({ where: { id } });
    if (!f) return err("api.notFound", 404, { what: "File" });
    const buf = await readFile(path.join(UPLOAD_DIR, path.basename(f.path))).catch(() => null);
    if (!buf) return err("api.notFound", 404, { what: "File" });
    return new Response(new Uint8Array(buf), { headers: { "Content-Type": f.mime, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(f.name)}` } });
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withUser(async () => {
    const { id } = await params;
    const f = await prisma.file.findUnique({ where: { id } });
    if (f) {
      await unlink(path.join(UPLOAD_DIR, path.basename(f.path))).catch(() => null);
      await prisma.file.delete({ where: { id } });
    }
    return json({ ok: true });
  });
}
