import { notFound } from "next/navigation";
import { getT } from "@/i18n/server";
import { SETTINGS_SECTIONS } from "@/lib/settings-nav";
import { ComingSoonSettings } from "@/components/settings-views";

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const { t } = await getT();
  const item = SETTINGS_SECTIONS.flatMap((s) => s.items).find((i) => i.href === section);
  if (!item) notFound();
  return <ComingSoonSettings title={t(item.key)} />;
}
