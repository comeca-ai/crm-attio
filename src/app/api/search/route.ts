import { prisma } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { json, unauthorized } from "@/lib/api";
import { toAttr } from "@/lib/data";
import { recordName } from "@/lib/format";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export async function GET(req: Request) {
  if (!(await apiUser())) return unauthorized();
  const q = norm(new URL(req.url).searchParams.get("q") ?? "").trim();
  const objs = await prisma.objectType.findMany({ include: { attributes: true, records: true }, orderBy: { order: "asc" } });
  const out: { id: string; name: string; subtitle: string; objectSlug: string; objectName: string; icon: string; color: string }[] = [];
  for (const o of objs) {
    const attrs = o.attributes.map(toAttr);
    for (const r of o.records) {
      const v = r.values as Record<string, unknown>;
      const name = recordName(v, attrs);
      const hay = norm(Object.values(v).filter((x) => typeof x === "string").join(" "));
      if (!q || hay.includes(q)) {
        const subtitle = String(v.domain ?? v.email ?? v.job_title ?? "");
        out.push({ id: r.id, name, subtitle, objectSlug: o.slug, objectName: o.singular, icon: o.icon, color: o.color });
      }
    }
  }
  out.sort((a, b) => {
    const as = norm(a.name).startsWith(q) ? 0 : 1;
    const bs = norm(b.name).startsWith(q) ? 0 : 1;
    return as - bs || a.name.localeCompare(b.name);
  });
  return json(out.slice(0, 20));
}
