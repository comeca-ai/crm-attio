import { prisma } from "@/lib/db";
import { err, json, withUser } from "@/lib/api";
import { toAttr } from "@/lib/data";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withUser(async () => {
    const { id } = await params;
    const b = await req.json().catch(() => ({}));
    const data: { name?: string; nameKey?: null; options?: object } = {};
    if (typeof b.name === "string" && b.name.trim()) { data.name = b.name.trim(); data.nameKey = null; }
    if (Array.isArray(b.options)) data.options = b.options;
    const a = await prisma.attribute.update({ where: { id }, data });
    return json(toAttr(a));
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withUser(async () => {
    const { id } = await params;
    const a = await prisma.attribute.findUnique({ where: { id } });
    if (!a) return json({ ok: true });
    if (a.isSystem || a.isPrimary) return err("attr.cantDelete");
    await prisma.attribute.delete({ where: { id } });
    return json({ ok: true });
  });
}
