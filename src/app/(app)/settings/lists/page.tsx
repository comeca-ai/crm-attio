import { prisma } from "@/lib/db";
import { localizeObject } from "@/lib/data";
import { getLocale } from "@/i18n/server";
import { ListsSettings } from "@/components/settings-views";
export default async function Page() {
  const locale = await getLocale();
  const lists = await prisma.list.findMany({ orderBy: { createdAt: "asc" }, include: { object: true, _count: { select: { entries: true } } } });
  return <ListsSettings lists={lists.map((l) => ({ id: l.id, name: l.name, object: localizeObject(l.object, locale).plural, entries: l._count.entries }))} />;
}
