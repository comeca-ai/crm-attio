import { requireUser } from "@/lib/auth";
import { getLocale } from "@/i18n/server";
import { getShellData } from "@/lib/shell-data";
import { CrmProvider } from "@/components/crm-context";
import { AppShell } from "@/components/app-shell";
import { CommandPalette } from "@/components/command-palette";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser();
  const locale = await getLocale();
  const data = await getShellData(me, locale);
  return (
    <CrmProvider value={data}>
      <AppShell>{children}</AppShell>
      <CommandPalette />
    </CrmProvider>
  );
}
