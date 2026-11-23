import { CheckSquare } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { TaskList } from "@/components/tasks";

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({ orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] });
  const iso = (d: Date | null) => (d ? d.toISOString() : null);
  return (
    <>
      <PageHeader title="Tarefas" icon={<CheckSquare size={16} className="text-ink-2" />} />
      <TaskList filterable tasks={tasks.map((t) => ({ id: t.id, content: t.content, dueDate: iso(t.dueDate), completed: t.completed, completedAt: iso(t.completedAt), assigneeId: t.assigneeId, recordId: t.recordId, createdAt: t.createdAt.toISOString() }))} />
    </>
  );
}
