import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { DashboardPage } from "@/components/simple-pages";
import { getLocale } from "@/i18n/server";
import { fmtCurrency } from "@/lib/format";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const dashboard = await prisma.dashboard.findUnique({ where: { id } });
  if (!dashboard) notFound();
  const [deals, openTasks, records] = await Promise.all([
    prisma.record.findMany({ where: { object: { slug: "deals" } }, select: { values: true } }),
    prisma.task.count({ where: { completed: false } }),
    prisma.record.count(),
  ]);
  const stage = (d: { values: unknown }) => String((d.values as { stage?: string }).stage);
  const open = deals.filter((d) => !["won", "lost"].includes(stage(d)));
  const pipeline = open.reduce((s, d) => s + (Number((d.values as { value?: number }).value) || 0), 0);
  const won = deals.filter((d) => stage(d) === "won").length;
  return (
    <DashboardPage
      name={dashboard.name}
      stats={[
        { label: "reports.pipelineValue", value: fmtCurrency(pipeline, "USD", locale) },
        { label: "reports.dealsByStage", value: `${open.length} / ${won}` },
        { label: "reports.openTasks", value: String(openTasks) },
        { label: "reports.recordsByObject", value: String(records) },
      ]}
    />
  );
}
