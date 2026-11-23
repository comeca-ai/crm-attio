import { prisma } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { json, unauthorized } from "@/lib/api";
import { logActivity } from "@/lib/data";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const { id } = await params;
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
  if (typeof b.completed === "boolean" && t.recordId) {
    await logActivity(t.recordId, user.id, "task", `${b.completed ? "concluiu" : "reabriu"} a tarefa “${t.content}”`);
  }
  return json(t);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await apiUser())) return unauthorized();
  const { id } = await params;
  await prisma.task.delete({ where: { id } }).catch(() => null);
  return json({ ok: true });
}
