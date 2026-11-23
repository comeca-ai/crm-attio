import { prisma } from "@/lib/db";
import { TasksPage } from "@/components/simple-pages";
import { serializeTask } from "@/lib/serialize";

export default async function Page() {
  const tasks = await prisma.task.findMany({ orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] });
  return <TasksPage tasks={tasks.map(serializeTask)} />;
}
