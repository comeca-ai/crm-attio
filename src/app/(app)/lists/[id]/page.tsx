import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getViews, localizeObject, toAttr, toRecord } from "@/lib/data";
import { getLocale, getT } from "@/i18n/server";
import { ObjectView } from "@/components/object-view";
import { normalizeViewConfig } from "@/lib/types";

export default async function ListPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ view?: string }> }) {
  const { id } = await params;
  const { view } = await searchParams;
  const locale = await getLocale();
  const { t } = await getT();
  const list = await prisma.list.findUnique({ where: { id }, include: { object: { include: { attributes: { orderBy: { order: "asc" } } } }, entries: { include: { record: true }, orderBy: { createdAt: "asc" } } } });
  if (!list) notFound();
  const attrs = list.object.attributes.map((a) => toAttr(a, locale));
  let views = await getViews(list.objectId, list.id, locale);
  if (views.length === 0) {
    const base = await prisma.view.findFirst({ where: { objectId: list.objectId, listId: null }, orderBy: { order: "asc" } });
    await prisma.view.create({ data: { objectId: list.objectId, listId: list.id, name: t("list.allEntries"), type: "table", config: normalizeViewConfig(base?.config ?? { columns: attrs.filter((a) => !a.isPrimary).map((a) => a.slug) }) as object } });
    views = await getViews(list.objectId, list.id, locale);
  }
  return <ObjectView key={id} object={localizeObject(list.object, locale)} attrs={attrs} records={list.entries.map((e) => toRecord(e.record))} views={views} initialViewId={view} list={{ id: list.id, name: list.name }} />;
}
