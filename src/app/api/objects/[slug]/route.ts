import { prisma } from "@/lib/db";
import { err, json, withUser } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return withUser(async () => {
    const { slug } = await params;
    const o = await prisma.objectType.findUnique({ where: { slug } });
    if (!o) return err("api.notFound", 404, { what: slug });
    const b = await req.json().catch(() => ({}));
    const singular = String(b.singular ?? "").trim() || o.singular;
    const plural = String(b.plural ?? "").trim() || o.plural;
    // Renomear desliga a tradução automática do nome padrão
    await prisma.objectType.update({ where: { id: o.id }, data: { singular, plural, nameKey: null } });
    return json({ ok: true });
  });
}
