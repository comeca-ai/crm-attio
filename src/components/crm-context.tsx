"use client";
import { createContext, useContext } from "react";
import type { ObjectLite, RelationIndex, UserLite } from "@/lib/types";

export type CrmCtx = {
  me: UserLite;
  users: UserLite[];
  objects: ObjectLite[];
  relIndex: RelationIndex;
  relOptions: Record<string, { id: string; name: string }[]>;
  lists: { id: string; name: string; objectId: string }[];
};

const Ctx = createContext<CrmCtx | null>(null);
export function CrmProvider({ value, children }: { value: CrmCtx; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useCrm() {
  const c = useContext(Ctx);
  if (!c) throw new Error("CrmProvider ausente");
  return c;
}
