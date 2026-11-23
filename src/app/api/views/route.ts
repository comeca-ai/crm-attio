import { prisma } from "@/lib/db";
import { err, json, withUser } from "@/lib/api";
import { normalizeViewConfig } from "@/lib/types";

export async function POST(req: Request) {
  return withUser(async () => {
    const b = await req.json().catch(() => ({}));
    const name = String(b.name ?? "").trim();
    if (!name || !b.objectId) return err("attr.nameRequired");
    const count = await prisma.view.count({ where: { objectId: b.objectId, listId: b.listId ?? null } });
    const v = await prisma.view.create({
      data: { objectId: String(b.objectId), listId: b.listId ? String(b.listId) : null, name, type: b.type === "kanban" ? "kanban" : "table", config: normalizeViewConfig(b.config) as object, order: count },
    });
    return json({ id: v.id }, 201);
  });
}
