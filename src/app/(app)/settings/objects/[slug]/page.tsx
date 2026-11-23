import { notFound } from "next/navigation";
import { Settings } from "lucide-react";
import { getObjectWithAttrs, getObjects } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { AttributesSettings } from "@/components/attributes-settings";

export default async function ObjectSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getObjectWithAttrs(slug);
  if (!data) notFound();
  const objects = await getObjects();
  const { id, singular, plural, icon, color } = data.object;
  return (
    <>
      <PageHeader title="Configurações / Objetos" icon={<Settings size={15} className="text-ink-2" />} />
      <AttributesSettings object={{ id, slug, singular, plural, icon, color }} attrs={data.attrs} objects={objects} />
    </>
  );
}
