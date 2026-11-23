import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getObjectWithAttrs, getViews, toRecord } from "@/lib/data";
import { getLocale } from "@/i18n/server";
import { ObjectView } from "@/components/object-view";
import { normalizeViewConfig } from "@/lib/types";

export default async function ObjectPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ view?: string }> }) {
  const { slug } = await params;
  const { view } = await searchParams;
  const locale = await getLocale();
  const data = await getObjectWithAttrs(slug, locale);
  if (!data) notFound();
  let views = await getViews(data.object.id, null, locale);
  if (views.length === 0) {
    // Objetos criados sem visualização ganham uma tabela padrão
    await prisma.view.create({ data: { objectId: data.object.id, name: `All ${data.object.plural}`, type: "table", config: normalizeViewConfig({ columns: data.attrs.filter((a) => !a.isPrimary).map((a) => a.slug) }) as object } });
    views = await getViews(data.object.id, null, locale);
  }
  const records = await prisma.record.findMany({ where: { objectId: data.object.id }, orderBy: { createdAt: "asc" } });
  return <ObjectView key={slug} object={data.object} attrs={data.attrs} records={records.map(toRecord)} views={views} initialViewId={view} />;
}
