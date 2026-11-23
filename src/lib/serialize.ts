import type { TaskLite } from "@/components/tasks";
import type { NoteLite } from "@/components/notes";

type DbTask = { id: string; content: string; dueDate: Date | null; completed: boolean; completedAt: Date | null; assigneeId: string | null; recordId: string | null; createdAt: Date };
type DbNote = { id: string; recordId: string; title: string; content: string; authorId: string; createdAt: Date; updatedAt: Date };

export const serializeTask = (x: DbTask): TaskLite => ({
  id: x.id, content: x.content, dueDate: x.dueDate?.toISOString() ?? null, completed: x.completed, completedAt: x.completedAt?.toISOString() ?? null,
  assigneeId: x.assigneeId, recordId: x.recordId, createdAt: x.createdAt.toISOString(),
});
export const serializeNote = (n: DbNote): NoteLite => ({
  id: n.id, recordId: n.recordId, title: n.title, content: n.content, authorId: n.authorId, createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString(),
});
