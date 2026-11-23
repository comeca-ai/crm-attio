"use client";
import { createContext, useContext } from "react";
import type { Attr, ObjectLite, RelationIndex, UserLite } from "@/lib/types";

export type CrmCtx = {
  me: UserLite & { locale: string; timezone: string };
  workspaceName: string;
  users: UserLite[];
  objects: ObjectLite[];
  attrsByObject: Record<string, Attr[]>;
  relIndex: RelationIndex;
  relOptions: Record<string, { id: string; name: string; domain?: string }[]>;
  lists: { id: string; name: string; objectId: string }[];
  favorites: { recordId: string; name: string; objectSlug: string; domain?: string }[];
  unread: number;
};

const Ctx = createContext<CrmCtx | null>(null);
export function CrmProvider({ value, children }: { value: CrmCtx; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useCrm() {
  const c = useContext(Ctx);
  if (!c) throw new Error("CrmProvider missing");
  return c;
}
