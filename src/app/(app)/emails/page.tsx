import { Mail } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { EmptyState } from "@/components/empty-state";

export default function Page() {
  return (
    <>
      <PageHeader title="E-mails" icon={<Mail size={15} className="text-ink-2" />} />
      <EmptyState kind="doc" title="E-mails" text="Conecte sua caixa de e-mail para ver as conversas ligadas a cada registro. Em breve neste CRM." />
    </>
  );
}
