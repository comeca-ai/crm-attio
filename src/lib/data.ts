import { prisma } from "./db";
import type { Attr, AttrConfig, ObjectLite, RecordLite, RelationIndex, SelectOption, UserLite, ViewLite } from "./types";
import { normalizeViewConfig } from "./types";
import { fullName, recordName } from "./format";
import { translate, translateMaybe, type Locale, type MessageKey } from "@/i18n/dict";

type DbObject = { id: string; slug: string; singular: string; plural: string; nameKey: string | null; icon: string; color: string };
type DbAttr = { id: string; objectId: string; slug: string; name: string; nameKey: string | null; type: string; options: unknown; config: unknown; relationObjectId: string | null; isPrimary: boolean; isSystem: boolean; order: number };

export function localizeObject(o: DbObject, locale: Locale): ObjectLite {
  const plural = translateMaybe(locale, o.nameKey ? `obj.${o.nameKey}.plural` : null, o.plural);
  const singular = translateMaybe(locale, o.nameKey ? `obj.${o.nameKey}.singular` : null, o.singular);
  const newKey = o.nameKey ? `obj.${o.nameKey}.new` : null;
  const newLabel = translateMaybe(locale, newKey, translate(locale, "obj.new", { singular: locale === "en" ? singular : singular.toLowerCase() }));
  return { id: o.id, slug: o.slug, singular, plural, icon: o.icon, color: o.color, newLabel };
}

export function toAttr(a: DbAttr, locale: Locale = "en"): Attr {
  const options = ((a.options as SelectOption[] | null) ?? null)?.map((o) => ({ ...o, label: translateMaybe(locale, o.key, o.label) })) ?? null;
  return {
    id: a.id, objectId: a.objectId, slug: a.slug,
    name: translateMaybe(locale, a.nameKey, a.name),
    type: a.type as Attr["type"], options, config: (a.config as AttrConfig) ?? {},
    relationObjectId: a.relationObjectId, isPrimary: a.isPrimary, isSystem: a.isSystem, order: a.order,
  };
}

/** Injeta os valores automáticos (Criado em / Criado por). */
export function toRecord(r: { id: string; objectId: string; values: unknown; createdAt: Date; updatedAt: Date; createdById?: string | null }): RecordLite {
  const values = { ...((r.values ?? {}) as Record<string, unknown>), created_at: r.createdAt.toISOString(), created_by: r.createdById ?? null };
  return { id: r.id, objectId: r.objectId, values, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() };
}

export async function getObjects(locale: Locale): Promise<ObjectLite[]> {
  const objs = await prisma.objectType.findMany({ orderBy: { order: "asc" } });
  return objs.map((o) => localizeObject(o, locale));
}

export async function getUsers(): Promise<UserLite[]> {
  const us = await prisma.user.findMany({ orderBy: { firstName: "asc" } });
  return us.map((u) => ({ id: u.id, name: fullName(u), firstName: u.firstName, lastName: u.lastName, email: u.email, avatarColor: u.avatarColor }));
}

export async function getAllAttrs(locale: Locale): Promise<Record<string, Attr[]>> {
  const attrs = await prisma.attribute.findMany({ orderBy: { order: "asc" } });
  const out: Record<string, Attr[]> = {};
  for (const a of attrs) (out[a.objectId] ??= []).push(toAttr(a, locale));
  return out;
}

export async function getRelationIndex(): Promise<RelationIndex> {
  const objs = await prisma.objectType.findMany({ include: { attributes: true } });
  const recs = await prisma.record.findMany({ select: { id: true, objectId: true, values: true } });
  const idx: RelationIndex = {};
  for (const r of recs) {
    const o = objs.find((x) => x.id === r.objectId)!;
    const v = r.values as Record<string, unknown>;
    idx[r.id] = { name: recordName(v, o.attributes.map((a) => toAttr(a))), objectSlug: o.slug, domain: typeof v.domains === "string" ? v.domains : undefined };
  }
  return idx;
}

export async function getObjectWithAttrs(slug: string, locale: Locale) {
  const o = await prisma.objectType.findUnique({ where: { slug }, include: { attributes: { orderBy: { order: "asc" } } } });
  if (!o) return null;
  return { object: localizeObject(o, locale), attrs: o.attributes.map((a) => toAttr(a, locale)) };
}

export async function getViews(objectId: string, listId: string | null, locale: Locale): Promise<ViewLite[]> {
  const vs = await prisma.view.findMany({ where: { objectId, listId }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return vs.map((v) => ({ id: v.id, name: translateMaybe(locale, v.nameKey, v.name), type: v.type === "kanban" ? "kanban" : "table", config: normalizeViewConfig(v.config) }));
}

export async function logActivity(recordId: string, actorId: string | null, kind: string, data: Record<string, unknown> = {}) {
  await prisma.activity.create({ data: { recordId, actorId, kind, data: data as object } });
}

export const tk = (k: string) => k as MessageKey;
