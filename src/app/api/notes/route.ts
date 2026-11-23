import { prisma } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { bad, json, unauthorized } from "@/lib/api";
import { logActivity } from "@/lib/data";

export async function POST(req: Request) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const b = await req.json().catch(() => ({}));
  if (!b.recordId) return bad("Escolha um registro para a nota.");
  const title = String(b.title ?? "").trim() || "Nota sem título";
  const n = await prisma.note.create({ data: { recordId: String(b.recordId), title, content: String(b.content ?? ""), authorId: user.id } });
  await logActivity(n.recordId, user.id, "note", `adicionou a nota “${title}”`);
  return json(n, 201);
}
