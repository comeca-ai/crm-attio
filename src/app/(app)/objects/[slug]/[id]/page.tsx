import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getObjectWithAttrs, toAttr, toRecord, localizeObject } from "@/lib/data";
import { getLocale } from "@/i18n/server";
import { RecordView } from "@/components/record-view";
import { serializeNote, serializeTask } from "@/lib/serialize";
import { asArray } from "@/lib/format";

export default async function RecordPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const me = await requireUser();
  const locale = await getLocale();
  const data = await getObjectWithAttrs(slug, locale);
  if (!data) notFound();
  const rec = await prisma.record.findUnique({ where: { id } });
  if (!rec || rec.objectId !== data.object.id) notFound();
  const values = rec.values as Record<string, unknown>;
  const [notes, tasks, activities, files, entries, fav, objs] = await Promise.all([
    prisma.note.findMany({ where: { recordId: id }, orderBy: { createdAt: "desc" } }),
    prisma.task.findMany({ where: { recordId: id }, orderBy: [{ dueDate: "asc" }] }),
    prisma.activity.findMany({ where: { recordId: id }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.file.findMany({ where: { recordId: id }, orderBy: { createdAt: "desc" } }),
    prisma.listEntry.findMany({ where: { recordId: id }, include: { list: true } }),
    prisma.favorite.findUnique({ where: { userId_recordId: { userId: me.id, recordId: id } } }),
    prisma.objectType.findMany({ include: { attributes: { orderBy: { order: "asc" } } } }),
  ]);
  // Abas de relação: atributos com vários valores (Team, Associated deals…)
  const relAttrs = data.attrs.filter((a) => a.type === "relation" && a.config.multiple);
  const relationTabs = await Promise.all(relAttrs.map(async (a) => {
    const o = objs.find((x) => x.id === a.relationObjectId)!;
    const rs = await prisma.record.findMany({ where: { id: { in: asArray(values[a.slug]) } } });
    return { attr: a, object: localizeObject(o, locale), attrs: o.attributes.map((x) => toAttr(x, locale)), records: rs.map(toRecord) };
  }));
  return (
    <RecordView
      key={id}
      object={data.object}
      attrs={data.attrs}
      record={toRecord(rec)}
      notes={notes.map(serializeNote)}
      tasks={tasks.map(serializeTask)}
      activities={activities.map((a) => ({ id: a.id, kind: a.kind, data: (a.data ?? {}) as Record<string, unknown>, actorId: a.actorId, createdAt: a.createdAt.toISOString() }))}
      files={files.map((f) => ({ id: f.id, name: f.name, size: f.size, mime: f.mime, uploaderId: f.uploaderId, createdAt: f.createdAt.toISOString() }))}
      relationTabs={relationTabs}
      memberLists={entries.map((e) => ({ id: e.list.id, name: e.list.name }))}
      favorite={!!fav}
    />
  );
}
