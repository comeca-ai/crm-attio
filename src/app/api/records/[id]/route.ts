import { prisma } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { json, notFound, unauthorized } from "@/lib/api";
import { logActivity, toAttr, toRecord } from "@/lib/data";
import { plainValue } from "@/lib/format";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  if (!(await apiUser())) return unauthorized();
  const { id } = await params;
  const r = await prisma.record.findUnique({ where: { id } });
  return r ? json(toRecord(r)) : notFound();
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const r = await prisma.record.findUnique({ where: { id }, include: { object: { include: { attributes: true } } } });
  if (!r) return notFound();
  const body = await req.json().catch(() => ({}));
  const patch = (body.values ?? {}) as Record<string, unknown>;
  const values = { ...(r.values as Record<string, unknown>), ...patch };
  const updated = await prisma.record.update({ where: { id }, data: { values: values as object } });
  const attrs = r.object.attributes.map(toAttr);
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, avatarColor: true } });
  for (const [k, v] of Object.entries(patch)) {
    const a = attrs.find((x) => x.slug === k);
    if (!a) continue;
    let shown = plainValue(a, v, users, {});
    if (a.type === "relation" && v) {
      const rel = await prisma.record.findUnique({ where: { id: String(v) } });
      shown = rel ? String((rel.values as Record<string, unknown>).name ?? "") : "";
    }
    await logActivity(id, user.id, "updated", shown ? `alterou ${a.name} para “${shown}”` : `limpou ${a.name}`);
  }
  return json(toRecord(updated));
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await apiUser())) return unauthorized();
  const { id } = await params;
  await prisma.record.delete({ where: { id } }).catch(() => null);
  return json({ ok: true });
}
