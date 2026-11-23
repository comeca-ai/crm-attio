import { prisma } from "@/lib/db";
import { HomeView } from "@/components/home-view";
import { serializeTask } from "@/lib/serialize";

export default async function HomePage() {
  const tasks = await prisma.task.findMany({ where: { completed: false }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] });
  return <HomeView tasks={tasks.map(serializeTask)} />;
}
