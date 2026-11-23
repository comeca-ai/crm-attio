import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getObjectWithAttrs, toAttr, toRecord } from "@/lib/data";
import { recordName } from "@/lib/format";
import { RecordView, type RelatedGroup } from "@/components/record-view";

export default async function RecordPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const data = await getObjectWithAttrs(slug);
  if (!data) notFound();
  const rec = await prisma.record.findUnique({ where: { id } });
  if (!rec || rec.objectId !== data.object.id) notFound();

  const [notes, tasks, activities] = await Promise.all([
    prisma.note.findMany({ where: { recordId: id }, orderBy: { updatedAt: "desc" } }),
    prisma.task.findMany({ where: { recordId: id }, orderBy: [{ completed: "asc" }, { dueDate: "asc" }] }),
    prisma.activity.findMany({ where: { recordId: id }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  // Relações reversas: registros de outros objetos que apontam para este
  const relAttrs = await prisma.attribute.findMany({ where: { type: "relation", relationObjectId: data.object.id }, include: { object: { include: { attributes: true } } } });
  const related: RelatedGroup[] = [];
  for (const ra of relAttrs) {
    const recs = await prisma.record.findMany({ where: { objectId: ra.objectId, values: { path: [ra.slug], equals: id } } });
    if (recs.length === 0) continue;
    const oattrs = ra.object.attributes.map(toAttr);
    const { id: oid, slug: oslug, singular, plural, icon, color } = ra.object;
    const label = oslug === "deals" ? "Negócios associados" : oslug === "people" ? "Equipe" : plural;
    related.push({ object: { id: oid, slug: oslug, singular, plural, icon, color }, attrName: ra.name, label, records: recs.map((r) => ({ id: r.id, name: recordName(r.values as Record<string, unknown>, oattrs) })) });
  }

  const entries = await prisma.listEntry.findMany({ where: { recordId: id }, include: { list: true } });
  const iso = (d: Date | null) => (d ? d.toISOString() : null);
  const { id: oid, singular, plural, icon, color } = data.object;
  return (
    <RecordView
      key={id}
      object={{ id: oid, slug, singular, plural, icon, color }}
      attrs={data.attrs}
      record={toRecord(rec)}
      notes={notes.map((n) => ({ id: n.id, recordId: n.recordId, title: n.title, content: n.content, authorId: n.authorId, createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString() }))}
      tasks={tasks.map((t) => ({ id: t.id, content: t.content, dueDate: iso(t.dueDate), completed: t.completed, completedAt: iso(t.completedAt), assigneeId: t.assigneeId, recordId: t.recordId, createdAt: t.createdAt.toISOString() }))}
      activities={activities.map((a) => ({ id: a.id, kind: a.kind, message: a.message, actorId: a.actorId, createdAt: a.createdAt.toISOString() }))}
      related={related}
      listNames={entries.map((e) => e.list.name)}
    />
  );
}
