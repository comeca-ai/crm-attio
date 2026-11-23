import { prisma } from "./db";
import { getAllAttrs, getObjects, getRelationIndex, getUsers } from "./data";
import type { CrmCtx } from "@/components/crm-context";
import type { Locale } from "@/i18n/dict";

/** Dados compartilhados por todas as telas logadas (barra lateral, editores, busca). */
export async function getShellData(user: { id: string; name: string; firstName: string; lastName: string; email: string; avatarColor: string; locale: string; timezone: string }, locale: Locale): Promise<CrmCtx> {
  const [objects, users, relIndex, attrsByObject, lists, favs, unread, ws] = await Promise.all([
    getObjects(locale),
    getUsers(),
    getRelationIndex(),
    getAllAttrs(locale),
    prisma.list.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, objectId: true } }),
    prisma.favorite.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
    prisma.workspace.findFirst(),
  ]);
  const relOptions: CrmCtx["relOptions"] = {};
  for (const o of objects) relOptions[o.id] = [];
  for (const [id, r] of Object.entries(relIndex)) {
    const o = objects.find((x) => x.slug === r.objectSlug);
    if (o) relOptions[o.id].push({ id, name: r.name, domain: r.domain });
  }
  for (const k of Object.keys(relOptions)) relOptions[k].sort((a, b) => a.name.localeCompare(b.name));
  return {
    me: { id: user.id, name: user.name, firstName: user.firstName, lastName: user.lastName, email: user.email, avatarColor: user.avatarColor, locale: user.locale, timezone: user.timezone },
    workspaceName: ws?.name ?? user.firstName,
    users, objects, attrsByObject, relIndex, relOptions, lists,
    favorites: favs.filter((f) => relIndex[f.recordId]).map((f) => ({ recordId: f.recordId, name: relIndex[f.recordId].name, objectSlug: relIndex[f.recordId].objectSlug, domain: relIndex[f.recordId].domain })),
    unread,
  };
}
