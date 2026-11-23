import { Home } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { HomeView } from "@/components/home-view";

export default async function HomePage() {
  const me = await requireUser();
  const [tasks, recent] = await Promise.all([
    prisma.task.findMany({ where: { completed: false, assigneeId: me.id }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }], take: 6 }),
    prisma.activity.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const iso = (d: Date | null) => (d ? d.toISOString() : null);
  return (
    <>
      <PageHeader title="Início" icon={<Home size={15} className="text-ink-2" />} />
      <HomeView
        name={me.name}
        tasks={tasks.map((t) => ({ id: t.id, content: t.content, dueDate: iso(t.dueDate), completed: t.completed, completedAt: iso(t.completedAt), assigneeId: t.assigneeId, recordId: t.recordId, createdAt: t.createdAt.toISOString() }))}
        activities={recent.map((a) => ({ id: a.id, kind: a.kind, message: a.message, actorId: a.actorId, createdAt: a.createdAt.toISOString(), recordId: a.recordId }))}
      />
    </>
  );
}
