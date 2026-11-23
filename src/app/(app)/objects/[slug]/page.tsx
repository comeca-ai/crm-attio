import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getObjectWithAttrs, toRecord } from "@/lib/data";
import { ObjectView } from "@/components/object-view";

export default async function ObjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getObjectWithAttrs(slug);
  if (!data) notFound();
  const records = (await prisma.record.findMany({ where: { objectId: data.object.id }, orderBy: { createdAt: "asc" } })).map(toRecord);
  const { id, singular, plural, icon, color } = data.object;
  return <ObjectView key={slug} object={{ id, slug, singular, plural, icon, color }} attrs={data.attrs} records={records} />;
}
