import { prisma } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { bad, json, unauthorized } from "@/lib/api";
import { toAttr } from "@/lib/data";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await apiUser())) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: { name?: string; options?: object } = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (Array.isArray(body.options)) data.options = body.options;
  const a = await prisma.attribute.update({ where: { id }, data });
  return json(toAttr(a));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await apiUser())) return unauthorized();
  const { id } = await params;
  const a = await prisma.attribute.findUnique({ where: { id } });
  if (!a) return json({ ok: true });
  if (a.isSystem || a.isPrimary) return bad("Atributos padrão não podem ser excluídos.");
  await prisma.attribute.delete({ where: { id } });
  return json({ ok: true });
}
