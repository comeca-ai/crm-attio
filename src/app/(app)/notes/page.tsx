import { prisma } from "@/lib/db";
import { NotesPage } from "@/components/simple-pages";
import { serializeNote } from "@/lib/serialize";

export default async function Page() {
  const notes = await prisma.note.findMany({ orderBy: { createdAt: "desc" } });
  return <NotesPage notes={notes.map(serializeNote)} />;
}
