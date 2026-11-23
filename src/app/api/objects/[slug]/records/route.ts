import { prisma } from "@/lib/db";
import { err, json, withUser } from "@/lib/api";
import { logActivity, toRecord } from "@/lib/data";
import { syncInverse } from "@/lib/relations";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  return withUser(async () => {
    const { slug } = await params;
    const o = await prisma.objectType.findUnique({ where: { slug } });
    if (!o) return err("api.notFound", 404, { what: slug });
    const recs = await prisma.record.findMany({ where: { objectId: o.id }, orderBy: { createdAt: "asc" } });
    return json(recs.map(toRecord));
  });
}

export async function POST(req: Request, { params }: Ctx) {
  return withUser(async (user) => {
    const { slug } = await params;
    const o = await prisma.objectType.findUnique({ where: { slug }, include: { attributes: true } });
    if (!o) return err("api.notFound", 404, { what: slug });
    const body = await req.json().catch(() => ({}));
    const values = { ...((body.values ?? {}) as Record<string, unknown>) };
    delete values.created_at;
    delete values.created_by;
    const rec = await prisma.record.create({ data: { objectId: o.id, values: values as object, createdById: user.id } });
    for (const a of o.attributes.filter((x) => x.type === "relation" && values[x.slug])) await syncInverse(rec.id, a, null, values[a.slug]);
    await logActivity(rec.id, user.id, "created");
    if (body.listId) await prisma.listEntry.create({ data: { listId: String(body.listId), recordId: rec.id } }).catch(() => null);
    return json(toRecord(rec), 201);
  });
}
