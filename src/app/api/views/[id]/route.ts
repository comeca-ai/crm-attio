import { prisma } from "@/lib/db";
import { err, json, withUser } from "@/lib/api";
import { normalizeViewConfig } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  return withUser(async () => {
    const { id } = await params;
    const b = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};
    if (typeof b.name === "string" && b.name.trim()) { data.name = b.name.trim(); data.nameKey = null; }
    if (b.type === "table" || b.type === "kanban") data.type = b.type;
    if (b.config) data.config = normalizeViewConfig(b.config) as object;
    await prisma.view.update({ where: { id }, data });
    return json({ ok: true });
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return withUser(async () => {
    const { id } = await params;
    const v = await prisma.view.findUnique({ where: { id } });
    if (!v) return json({ ok: true });
    const siblings = await prisma.view.count({ where: { objectId: v.objectId, listId: v.listId } });
    if (siblings <= 1) return err("view.cantDeleteLast");
    await prisma.view.delete({ where: { id } });
    return json({ ok: true });
  });
}
