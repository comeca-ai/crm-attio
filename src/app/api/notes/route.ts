import { prisma } from "@/lib/db";
import { err, json, withUser } from "@/lib/api";
import { logActivity } from "@/lib/data";
import { notifyMentions } from "./mentions";

export async function POST(req: Request) {
  return withUser(async (user) => {
    const b = await req.json().catch(() => ({}));
    if (!b.recordId) return err("notes.pickRequired");
    const title = String(b.title ?? "").trim() || "Untitled";
    const content = String(b.content ?? "");
    const n = await prisma.note.create({ data: { recordId: String(b.recordId), title, content, authorId: user.id } });
    await logActivity(n.recordId, user.id, "note", { title });
    await notifyMentions(content, user.id, n.id, title, n.recordId);
    return json(n, 201);
  });
}
