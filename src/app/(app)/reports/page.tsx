import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";

export default function Page() {
  return (
    <>
      <PageHeader title="Relatórios" icon={<BarChart3 size={15} className="text-ink-2" />} />
      <EmptyState kind="chart" title="Relatórios" text="Acompanhe o funil e as metas do time com relatórios. Em breve neste CRM." />
    </>
  );
}
