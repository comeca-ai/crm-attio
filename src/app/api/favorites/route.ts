import { prisma } from "@/lib/db";
import { json, withUser } from "@/lib/api";

/** Alterna o favorito do registro para o usuário logado. */
export async function POST(req: Request) {
  return withUser(async (user) => {
    const { recordId } = await req.json().catch(() => ({}));
    const existing = await prisma.favorite.findUnique({ where: { userId_recordId: { userId: user.id, recordId } } });
    if (existing) await prisma.favorite.delete({ where: { id: existing.id } });
    else await prisma.favorite.create({ data: { userId: user.id, recordId } });
    return json({ favorite: !existing });
  });
}
