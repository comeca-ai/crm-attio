import { prisma } from "@/lib/db";
import { json, withUser } from "@/lib/api";

export async function PATCH(req: Request) {
  return withUser(async () => {
    const b = await req.json().catch(() => ({}));
    const name = String(b.name ?? "").trim();
    const ws = await prisma.workspace.findFirst();
    if (name && ws) await prisma.workspace.update({ where: { id: ws.id }, data: { name } });
    return json({ ok: true });
  });
}
