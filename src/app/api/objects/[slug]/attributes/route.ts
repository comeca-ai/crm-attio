import { prisma } from "@/lib/db";
import { err, json, withUser } from "@/lib/api";
import { toAttr } from "@/lib/data";
import { ATTR_TYPES, type AttrType } from "@/lib/types";

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "field";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return withUser(async () => {
    const { slug } = await params;
    const o = await prisma.objectType.findUnique({ where: { slug }, include: { attributes: true } });
    if (!o) return err("api.notFound", 404, { what: slug });
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const type = String(body.type ?? "") as AttrType;
    if (!name) return err("attr.nameRequired");
    if (!ATTR_TYPES.includes(type)) return err("api.invalidType");
    if (type === "relation" && !body.relationObjectId) return err("api.pickRelation");
    let s = slugify(name);
    const taken = new Set(o.attributes.map((a) => a.slug));
    for (let i = 2; taken.has(s); i++) s = `${slugify(name)}_${i}`;
    const options = Array.isArray(body.options)
      ? body.options.filter((x: { label?: string }) => x?.label?.trim()).map((x: { label: string; color?: string }, idx: number) => ({ id: `${slugify(x.label)}_${idx}`, label: x.label.trim(), color: x.color || "gray" }))
      : undefined;
    const config: Record<string, unknown> = {};
    if (type === "currency") config.currency = body.currency === "BRL" ? "BRL" : "USD";
    if (type === "relation" && body.multiple) config.multiple = true;
    const a = await prisma.attribute.create({
      data: { objectId: o.id, slug: s, name, type, options, config: config as object, relationObjectId: type === "relation" ? String(body.relationObjectId) : null, order: o.attributes.length },
    });
    return json(toAttr(a), 201);
  });
}
