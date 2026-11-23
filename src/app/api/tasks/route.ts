import { prisma } from "@/lib/db";
import { err, json, withUser } from "@/lib/api";
import { logActivity } from "@/lib/data";

export async function GET() {
  return withUser(async () => json(await prisma.task.findMany({ orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] })));
}

export async function POST(req: Request) {
  return withUser(async (user) => {
    const b = await req.json().catch(() => ({}));
    const content = String(b.content ?? "").trim();
    if (!content) return err("tasks.required");
    const t = await prisma.task.create({
      data: { content, dueDate: b.dueDate ? new Date(b.dueDate) : null, assigneeId: b.assigneeId || null, recordId: b.recordId || null, creatorId: user.id },
    });
    if (t.recordId) await logActivity(t.recordId, user.id, "task_created", { content });
    if (t.assigneeId && t.assigneeId !== user.id) {
      await prisma.notification.create({ data: { userId: t.assigneeId, actorId: user.id, kind: "task_assigned", data: { taskId: t.id, content, recordId: t.recordId } } });
    }
    return json(t, 201);
  });
}
