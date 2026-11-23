import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { getObjectWithAttrs, toRecord } from "@/lib/data";
import { ObjectView } from "@/components/object-view";

export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = await prisma.list.findUnique({ where: { id }, include: { object: true, entries: { include: { record: true }, orderBy: { createdAt: "asc" } } } });
  if (!list) notFound();
  const data = (await getObjectWithAttrs(list.object.slug))!;
  const { id: oid, slug, singular, plural, icon, color } = data.object;
  return (
    <ObjectView
      key={id}
      listId={id}
      title={list.name}
      crumbs={<><Link href="/lists" className="font-medium text-ink-2 hover:underline">Listas</Link><ChevronRight size={14} className="text-ink-3" /></>}
      object={{ id: oid, slug, singular, plural, icon, color }}
      attrs={data.attrs}
      records={list.entries.map((e) => toRecord(e.record))}
    />
  );
}
