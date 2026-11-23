import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { err, json, withUser } from "@/lib/api";
import { logActivity } from "@/lib/data";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withUser(async (user) => {
    const { id } = await params;
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return err("api.pickRecord");
    if (file.size > 20 * 1024 * 1024) return err("rec.files.tooBig", 413);
    await mkdir(UPLOAD_DIR, { recursive: true });
    const stored = `${randomUUID()}${path.extname(file.name).slice(0, 12)}`;
    await writeFile(path.join(UPLOAD_DIR, stored), Buffer.from(await file.arrayBuffer()));
    const f = await prisma.file.create({ data: { recordId: id, name: file.name, size: file.size, mime: file.type || "application/octet-stream", path: stored, uploaderId: user.id } });
    await logActivity(id, user.id, "file", { name: file.name });
    return json(f, 201);
  });
}
