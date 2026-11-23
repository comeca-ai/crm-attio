import { prisma } from "@/lib/db";
import { json, withUser } from "@/lib/api";
import { logActivity } from "@/lib/data";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  return withUser(async (user) => {
    const { id } = await params;
    const before = await prisma.task.findUnique({ where: { id } });
    const b = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};
    if (typeof b.content === "string" && b.content.trim()) data.content = b.content.trim();
    if ("dueDate" in b) data.dueDate = b.dueDate ? new Date(b.dueDate) : null;
    if ("assigneeId" in b) data.assigneeId = b.assigneeId || null;
    if ("recordId" in b) data.recordId = b.recordId || null;
    if (typeof b.completed === "boolean") {
      data.completed = b.completed;
      data.completedAt = b.completed ? new Date() : null;
    }
    const t = await prisma.task.update({ where: { id }, data });
    if (typeof b.completed === "boolean" && t.recordId) await logActivity(t.recordId, user.id, b.completed ? "task_completed" : "task_reopened", { content: t.content });
    if (t.assigneeId && t.assigneeId !== before?.assigneeId && t.assigneeId !== user.id) {
      await prisma.notification.create({ data: { userId: t.assigneeId, actorId: user.id, kind: "task_assigned", data: { taskId: t.id, content: t.content, recordId: t.recordId } } });
    }
    return json(t);
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return withUser(async () => {
    const { id } = await params;
    await prisma.task.delete({ where: { id } }).catch(() => null);
    return json({ ok: true });
  });
}
