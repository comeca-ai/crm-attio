import { prisma } from "@/lib/db";
import { json, withUser } from "@/lib/api";
import { localizeObject, toAttr } from "@/lib/data";
import { personName, recordName } from "@/lib/format";
import { getLocale } from "@/i18n/server";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const flat = (v: unknown): string => (v && typeof v === "object" ? (Array.isArray(v) ? "" : personName(v)) : typeof v === "string" ? v : "");

export async function GET(req: Request) {
  return withUser(async () => {
    const locale = await getLocale();
    const q = norm(new URL(req.url).searchParams.get("q") ?? "").trim();
    const objs = await prisma.objectType.findMany({ include: { attributes: true, records: { orderBy: { updatedAt: "desc" } } }, orderBy: { order: "asc" } });
    const out: { id: string; name: string; subtitle: string; objectSlug: string; objectName: string; icon: string; color: string }[] = [];
    for (const o of objs) {
      const attrs = o.attributes.map((a) => toAttr(a));
      const lo = localizeObject(o, locale);
      for (const r of o.records) {
        const v = r.values as Record<string, unknown>;
        const name = recordName(v, attrs);
        const hay = norm(Object.values(v).map(flat).join(" "));
        if (!q || hay.includes(q)) out.push({ id: r.id, name, subtitle: String(v.domains ?? v.email_addresses ?? ""), objectSlug: o.slug, objectName: lo.singular, icon: o.icon, color: o.color });
      }
    }
    if (q) out.sort((a, b) => (norm(a.name).startsWith(q) ? 0 : 1) - (norm(b.name).startsWith(q) ? 0 : 1) || a.name.localeCompare(b.name));
    return json(out.slice(0, 20));
  });
}
