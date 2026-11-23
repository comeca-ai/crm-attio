import { Phone } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";

export default function Page() {
  return (
    <>
      <PageHeader title="Ligações" icon={<Phone size={15} className="text-ink-2" />} />
      <EmptyState kind="note" title="Ligações" text="Grave e resuma ligações direto no registro. Em breve neste CRM." />
    </>
  );
}
