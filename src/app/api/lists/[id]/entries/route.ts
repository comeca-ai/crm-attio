import { prisma } from "@/lib/db";
import { err, json, withUser } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  return withUser(async () => {
    const { id } = await params;
    const b = await req.json().catch(() => ({}));
    if (!b.recordId) return err("api.pickRecord");
    const e = await prisma.listEntry.upsert({
      where: { listId_recordId: { listId: id, recordId: String(b.recordId) } },
      create: { listId: id, recordId: String(b.recordId) },
      update: {},
    });
    return json(e, 201);
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  return withUser(async () => {
    const { id } = await params;
    const recordId = new URL(req.url).searchParams.get("recordId");
    if (!recordId) return err("api.pickRecord");
    await prisma.listEntry.deleteMany({ where: { listId: id, recordId } });
    return json({ ok: true });
  });
}
