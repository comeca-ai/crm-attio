import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { InboxPage } from "@/components/simple-pages";

export default async function Page() {
  const me = await requireUser();
  const items = await prisma.notification.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const recIds = items.map((n) => (n.data as { recordId?: string }).recordId).filter(Boolean) as string[];
  const recs = await prisma.record.findMany({ where: { id: { in: recIds } }, select: { id: true, object: { select: { slug: true } } } });
  return (
    <InboxPage items={items.map((n) => {
      const d = (n.data ?? {}) as { recordId?: string | null; content?: string; title?: string };
      const r = recs.find((x) => x.id === d.recordId);
      const href = n.kind === "task_assigned" ? "/tasks" : r ? `/objects/${r.object.slug}/${r.id}` : "/notes";
      return { id: n.id, href, kind: n.kind, actorId: n.actorId, read: n.read, createdAt: n.createdAt.toISOString(), data: d };
    })} />
  );
}
