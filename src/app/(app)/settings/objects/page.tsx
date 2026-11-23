import { prisma } from "@/lib/db";
import { localizeObject } from "@/lib/data";
import { getLocale } from "@/i18n/server";
import { ObjectsSettings } from "@/components/settings-views";
export default async function Page() {
  const locale = await getLocale();
  const objs = await prisma.objectType.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { records: true, attributes: true } } } });
  return <ObjectsSettings objects={objs.map((o) => ({ ...localizeObject(o, locale), records: o._count.records, attributes: o._count.attributes }))} />;
}
