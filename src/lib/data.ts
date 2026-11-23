import { prisma } from "./db";
import type { Attr, ObjectLite, RecordLite, RelationIndex, UserLite } from "./types";
import { recordName } from "./format";

export async function getObjects(): Promise<ObjectLite[]> {
  return prisma.objectType.findMany({ orderBy: { order: "asc" }, select: { id: true, slug: true, singular: true, plural: true, icon: true, color: true } });
}

export async function getUsers(): Promise<UserLite[]> {
  return prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true, avatarColor: true } });
}

export function toAttr(a: { id: string; slug: string; name: string; type: string; options: unknown; relationObjectId: string | null; isPrimary: boolean; isSystem: boolean; order: number }): Attr {
  return { ...a, type: a.type as Attr["type"], options: (a.options as Attr["options"]) ?? null };
}

export function toRecord(r: { id: string; objectId: string; values: unknown; createdAt: Date; updatedAt: Date }): RecordLite {
  return { id: r.id, objectId: r.objectId, values: (r.values ?? {}) as Record<string, unknown>, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
}

/** Índice de nomes de todos os registros (para relações e busca). */
export async function getRelationIndex(): Promise<RelationIndex> {
  const objs = await prisma.objectType.findMany({ include: { attributes: true } });
  const recs = await prisma.record.findMany({ select: { id: true, objectId: true, values: true } });
  const idx: RelationIndex = {};
  for (const r of recs) {
    const o = objs.find((x) => x.id === r.objectId)!;
    idx[r.id] = { name: recordName(r.values as Record<string, unknown>, o.attributes.map(toAttr)), objectSlug: o.slug };
  }
  return idx;
}

export async function getObjectWithAttrs(slug: string) {
  const o = await prisma.objectType.findUnique({ where: { slug }, include: { attributes: { orderBy: { order: "asc" } } } });
  if (!o) return null;
  const { attributes, ...obj } = o;
  return { object: obj as ObjectLite & { createdAt: Date; order: number }, attrs: attributes.map(toAttr) };
}

/** Opções de registros por objeto, para editores de relação. */
export async function getRelationOptions() {
  const objs = await prisma.objectType.findMany({ include: { attributes: true, records: { select: { id: true, values: true } } } });
  const out: Record<string, { id: string; name: string }[]> = {};
  for (const o of objs) {
    const attrs = o.attributes.map(toAttr);
    out[o.id] = o.records.map((r) => ({ id: r.id, name: recordName(r.values as Record<string, unknown>, attrs) })).sort((a, b) => a.name.localeCompare(b.name));
  }
  return out;
}

export async function logActivity(recordId: string, actorId: string | null, kind: string, message: string) {
  await prisma.activity.create({ data: { recordId, actorId, kind, message } });
}
