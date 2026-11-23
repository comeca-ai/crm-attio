import { prisma } from "@/lib/db";
import { json, withUser } from "@/lib/api";

export async function GET() {
  return withUser(async (user) => json(await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 })));
}

/** Marca como lidas: { ids: [...] } ou { all: true }. */
export async function PATCH(req: Request) {
  return withUser(async (user) => {
    const b = await req.json().catch(() => ({}));
    await prisma.notification.updateMany({ where: { userId: user.id, ...(b.all ? {} : { id: { in: (b.ids ?? []) as string[] } }) }, data: { read: true } });
    return json({ ok: true });
  });
}
