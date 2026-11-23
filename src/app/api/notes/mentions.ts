import { prisma } from "@/lib/db";

/** Notifica quem foi mencionado com @Nome na nota (exceto o autor). */
export async function notifyMentions(content: string, authorId: string, noteId: string, title: string, recordId: string, already: Set<string> = new Set()) {
  if (!content.includes("@")) return;
  const users = await prisma.user.findMany();
  for (const u of users) {
    if (u.id === authorId || already.has(u.id)) continue;
    const re = new RegExp(`@${u.firstName}(\\s+${u.lastName})?\\b`, "i");
    if (re.test(content)) await prisma.notification.create({ data: { userId: u.id, actorId: authorId, kind: "mention", data: { noteId, title, recordId } } });
  }
}
