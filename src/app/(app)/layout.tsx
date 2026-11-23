import { requireUser } from "@/lib/auth";
import { getObjects, getRelationIndex, getRelationOptions, getUsers } from "@/lib/data";
import { prisma } from "@/lib/db";
import { CrmProvider } from "@/components/crm-context";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser();
  const [users, objects, relIndex, relOptions, lists, openTasks] = await Promise.all([
    getUsers(),
    getObjects(),
    getRelationIndex(),
    getRelationOptions(),
    prisma.list.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, objectId: true } }),
    prisma.task.count({ where: { completed: false, assigneeId: me.id } }),
  ]);
  return (
    <CrmProvider value={{ me, users, objects, relIndex, relOptions, lists }}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar openTasks={openTasks} />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
      <CommandPalette />
    </CrmProvider>
  );
}
