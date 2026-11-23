import { prisma } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { json, unauthorized } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await apiUser())) return unauthorized();
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const data: { title?: string; content?: string } = {};
  if (typeof b.title === "string") data.title = b.title.trim() || "Nota sem título";
  if (typeof b.content === "string") data.content = b.content;
  return json(await prisma.note.update({ where: { id }, data }));
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await apiUser())) return unauthorized();
  const { id } = await params;
  await prisma.note.delete({ where: { id } }).catch(() => null);
  return json({ ok: true });
}
