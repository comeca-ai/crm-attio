import { prisma } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { json, notFound, unauthorized } from "@/lib/api";
import { logActivity, toRecord } from "@/lib/data";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  if (!(await apiUser())) return unauthorized();
  const { slug } = await params;
  const o = await prisma.objectType.findUnique({ where: { slug } });
  if (!o) return notFound("Objeto");
  const recs = await prisma.record.findMany({ where: { objectId: o.id }, orderBy: { createdAt: "asc" } });
  return json(recs.map(toRecord));
}

export async function POST(req: Request, { params }: Ctx) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const { slug } = await params;
  const o = await prisma.objectType.findUnique({ where: { slug } });
  if (!o) return notFound("Objeto");
  const body = await req.json().catch(() => ({}));
  const values = (body.values ?? {}) as Record<string, unknown>;
  const rec = await prisma.record.create({ data: { objectId: o.id, values: values as object } });
  await logActivity(rec.id, user.id, "created", "criou o registro");
  if (body.listId) await prisma.listEntry.create({ data: { listId: String(body.listId), recordId: rec.id } }).catch(() => null);
  return json(toRecord(rec), 201);
}
