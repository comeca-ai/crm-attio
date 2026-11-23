import { prisma } from "@/lib/db";
import { json, withUser } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  return withUser(async () => {
    const { id } = await params;
    const b = await req.json().catch(() => ({}));
    const data: { name?: string; favorite?: boolean } = {};
    if (typeof b.name === "string" && b.name.trim()) data.name = b.name.trim();
    if (typeof b.favorite === "boolean") data.favorite = b.favorite;
    return json(await prisma.dashboard.update({ where: { id }, data }));
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return withUser(async () => {
    const { id } = await params;
    await prisma.dashboard.delete({ where: { id } }).catch(() => null);
    return json({ ok: true });
  });
}
