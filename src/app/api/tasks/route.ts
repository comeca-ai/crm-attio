import { prisma } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { bad, json, unauthorized } from "@/lib/api";
import { logActivity } from "@/lib/data";

export async function GET() {
  if (!(await apiUser())) return unauthorized();
  return json(await prisma.task.findMany({ orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] }));
}

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const b = await req.json().catch(() => ({}));
  const content = String(b.content ?? "").trim();
  if (!content) return bad("Escreva a tarefa.");
  const t = await prisma.task.create({
    data: {
      content,
      dueDate: b.dueDate ? new Date(b.dueDate) : null,
      assigneeId: b.assigneeId || null,
      recordId: b.recordId || null,
      creatorId: user.id,
    },
  });
  if (t.recordId) await logActivity(t.recordId, user.id, "task", `criou a tarefa “${content}”`);
  return json(t, 201);
}
