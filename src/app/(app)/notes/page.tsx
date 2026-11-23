import { FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { NotesGrid } from "@/components/notes";

export default async function NotesPage() {
  const notes = await prisma.note.findMany({ orderBy: { updatedAt: "desc" } });
  return (
    <>
      <PageHeader title="Notas" icon={<FileText size={16} className="text-ink-2" />} />
      <NotesGrid notes={notes.map((n) => ({ id: n.id, recordId: n.recordId, title: n.title, content: n.content, authorId: n.authorId, createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString() }))} />
    </>
  );
}
