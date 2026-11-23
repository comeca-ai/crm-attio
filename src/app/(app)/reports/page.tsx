import { prisma } from "@/lib/db";
import { ReportsPage } from "@/components/simple-pages";

export default async function Page() {
  const dashboards = await prisma.dashboard.findMany({ orderBy: { createdAt: "desc" } });
  return <ReportsPage dashboards={dashboards.map((d) => ({ id: d.id, name: d.name, favorite: d.favorite, createdAt: d.createdAt.toISOString(), reports: 4 }))} />;
}
