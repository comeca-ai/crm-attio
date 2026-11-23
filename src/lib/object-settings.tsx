import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getObjectWithAttrs } from "@/lib/data";
import { getLocale } from "@/i18n/server";
import { ObjectSettings } from "@/components/settings-views";

export async function ObjectSettingsPage({ slug, tab }: { slug: string; tab: "configuration" | "attributes" }) {
  const locale = await getLocale();
  const data = await getObjectWithAttrs(slug, locale);
  const raw = await prisma.objectType.findUnique({ where: { slug }, include: { _count: { select: { records: true } } } });
  if (!data || !raw) notFound();
  return <ObjectSettings object={data.object} slug={slug} raw={{ singular: raw.singular, plural: raw.plural }} attrs={data.attrs} tab={tab} counts={{ records: raw._count.records }} />;
}
