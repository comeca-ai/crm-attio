import { ObjectSettingsPage } from "@/lib/object-settings";
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ObjectSettingsPage slug={slug} tab="attributes" />;
}
