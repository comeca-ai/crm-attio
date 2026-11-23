import { prisma } from "@/lib/db";
import { err, json, withUser } from "@/lib/api";
import { logActivity, toRecord } from "@/lib/data";
import { detachRecord, syncInverse } from "@/lib/relations";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  return withUser(async () => {
    const { id } = await params;
    const r = await prisma.record.findUnique({ where: { id } });
    return r ? json(toRecord(r)) : err("api.notFound", 404, { what: "Record" });
  });
}

export async function PATCH(req: Request, { params }: Ctx) {
  return withUser(async (user) => {
    const { id } = await params;
    const r = await prisma.record.findUnique({ where: { id }, include: { object: { include: { attributes: true } } } });
    if (!r) return err("api.notFound", 404, { what: "Record" });
    const body = await req.json().catch(() => ({}));
    const patch = (body.values ?? {}) as Record<string, unknown>;
    const old = r.values as Record<string, unknown>;
    const attrs = r.object.attributes;
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      const a = attrs.find((x) => x.slug === k);
      if (!a || (a.config as { readOnly?: boolean } | null)?.readOnly) continue;
      clean[k] = v;
    }
    const updated = await prisma.record.update({ where: { id }, data: { values: { ...old, ...clean } as object } });
    for (const [k, v] of Object.entries(clean)) {
      const a = attrs.find((x) => x.slug === k)!;
      if (a.type === "relation") await syncInverse(id, a, old[k], v);
      await logActivity(id, user.id, "updated", { attr: k, value: v ?? null });
    }
    const fresh = await prisma.record.findUnique({ where: { id } });
    return json(toRecord(fresh ?? updated));
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return withUser(async () => {
    const { id } = await params;
    await detachRecord(id);
    await prisma.record.delete({ where: { id } }).catch(() => null);
    return json({ ok: true });
  });
}
