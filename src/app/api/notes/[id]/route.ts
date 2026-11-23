import { prisma } from "@/lib/db";
import { json, withUser } from "@/lib/api";
import { notifyMentions } from "../mentions";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  return withUser(async (user) => {
    const { id } = await params;
    const before = await prisma.note.findUnique({ where: { id } });
    const b = await req.json().catch(() => ({}));
    const data: { title?: string; content?: string } = {};
    if (typeof b.title === "string") data.title = b.title.trim() || "Untitled";
    if (typeof b.content === "string") data.content = b.content;
    const n = await prisma.note.update({ where: { id }, data });
    if (data.content && before) {
      // Só notifica menções novas
      const prev = await prisma.notification.findMany({ where: { kind: "mention", data: { path: ["noteId"], equals: id } } });
      await notifyMentions(data.content, user.id, n.id, n.title, n.recordId, new Set(prev.map((p) => p.userId)));
    }
    return json(n);
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return withUser(async () => {
    const { id } = await params;
    await prisma.note.delete({ where: { id } }).catch(() => null);
    return json({ ok: true });
  });
}
