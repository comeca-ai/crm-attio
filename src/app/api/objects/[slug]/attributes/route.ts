import { prisma } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { bad, json, notFound, unauthorized } from "@/lib/api";
import { toAttr } from "@/lib/data";

const TYPES = ["text", "number", "currency", "date", "select", "multiselect", "status", "user", "relation", "email", "url", "checkbox"];
const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "campo";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await apiUser())) return unauthorized();
  const { slug } = await params;
  const o = await prisma.objectType.findUnique({ where: { slug }, include: { attributes: true } });
  if (!o) return notFound("Objeto");
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const type = String(body.type ?? "");
  if (!name) return bad("Dê um nome ao atributo.");
  if (!TYPES.includes(type)) return bad("Tipo de atributo inválido.");
  if (type === "relation" && !body.relationObjectId) return bad("Escolha o objeto relacionado.");
  let s = slugify(name);
  const taken = new Set(o.attributes.map((a) => a.slug));
  let i = 2;
  while (taken.has(s)) s = `${slugify(name)}_${i++}`;
  const options = Array.isArray(body.options)
    ? body.options.filter((x: { label?: string }) => x?.label?.trim()).map((x: { label: string; color?: string }, idx: number) => ({ id: `${slugify(x.label)}_${idx}`, label: x.label.trim(), color: x.color || "gray" }))
    : undefined;
  const a = await prisma.attribute.create({
    data: { objectId: o.id, slug: s, name, type, options, relationObjectId: type === "relation" ? String(body.relationObjectId) : null, order: o.attributes.length },
  });
  return json(toAttr(a), 201);
}
