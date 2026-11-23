import { prisma } from "@/lib/db";
import { err, json, withUser } from "@/lib/api";
import { getRelationIndex, getUsers, logActivity, toAttr } from "@/lib/data";
import { coerceValue } from "@/lib/values";
import { syncInverse } from "@/lib/relations";

/** Importa linhas já mapeadas no navegador: [{ slugDoAtributo: "texto" }]. */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return withUser(async (user) => {
    const { slug } = await params;
    const o = await prisma.objectType.findUnique({ where: { slug }, include: { attributes: true } });
    if (!o) return err("api.notFound", 404, { what: slug });
    const b = await req.json().catch(() => ({}));
    const rows = Array.isArray(b.rows) ? (b.rows as Record<string, string>[]) : [];
    if (rows.length === 0) return err("import.empty");
    const attrs = o.attributes.map((a) => toAttr(a));
    const users = await getUsers();
    const idx = await getRelationIndex();
    const byName = new Map(Object.entries(idx).map(([id, r]) => [r.name.toLowerCase(), id]));
    const findRecord = (n: string) => byName.get(n.toLowerCase());
    let n = 0;
    for (const row of rows.slice(0, 5000)) {
      const values: Record<string, unknown> = {};
      for (const [s, raw] of Object.entries(row)) {
        const a = attrs.find((x) => x.slug === s);
        if (!a || a.config.readOnly) continue;
        const v = coerceValue(a, String(raw ?? ""), { users, findRecord });
        if (v !== null && !(Array.isArray(v) && v.length === 0)) values[s] = v;
      }
      if (Object.keys(values).length === 0) continue;
      const rec = await prisma.record.create({ data: { objectId: o.id, values: values as object, createdById: user.id } });
      for (const a of o.attributes.filter((x) => x.type === "relation" && values[x.slug])) await syncInverse(rec.id, a, null, values[a.slug]);
      await logActivity(rec.id, user.id, "created");
      if (b.listId) await prisma.listEntry.create({ data: { listId: String(b.listId), recordId: rec.id } }).catch(() => null);
      n++;
    }
    return json({ imported: n });
  });
}
