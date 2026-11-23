import { prisma } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { bad, json, unauthorized } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  if (!(await apiUser())) return unauthorized();
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  if (!b.recordId) return bad("Escolha um registro.");
  const e = await prisma.listEntry.upsert({
    where: { listId_recordId: { listId: id, recordId: String(b.recordId) } },
    create: { listId: id, recordId: String(b.recordId) },
    update: {},
  });
  return json(e, 201);
}

export async function DELETE(req: Request, { params }: Ctx) {
  if (!(await apiUser())) return unauthorized();
  const { id } = await params;
  const recordId = new URL(req.url).searchParams.get("recordId");
  if (!recordId) return bad("Informe o registro.");
  await prisma.listEntry.deleteMany({ where: { listId: id, recordId } });
  return json({ ok: true });
}
