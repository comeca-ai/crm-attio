import { prisma } from "@/lib/db";
import { GeneralSettings } from "@/components/settings-views";
export default async function Page() {
  const ws = await prisma.workspace.findFirst();
  return <GeneralSettings name={ws?.name ?? ""} />;
}
