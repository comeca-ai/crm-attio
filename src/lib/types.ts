import type { MessageKey } from "@/i18n/dict";

export type AttrType =
  | "text" | "number" | "currency" | "date" | "timestamp" | "select" | "multiselect" | "status"
  | "user" | "relation" | "email" | "url" | "domain" | "phone" | "location" | "personal-name" | "checkbox";

export const ATTR_TYPES: AttrType[] = [
  "text", "number", "currency", "date", "select", "multiselect", "status", "user", "relation",
  "email", "url", "domain", "phone", "location", "personal-name", "checkbox",
];
export const typeKey = (t: AttrType) => `type.${t}` as MessageKey;

export type SelectOption = { id: string; label: string; color: string; key?: string };
export type AttrConfig = { multiple?: boolean; inverseAttrId?: string; currency?: "USD" | "BRL"; readOnly?: boolean };

export type Attr = {
  id: string;
  objectId: string;
  slug: string;
  name: string;
  type: AttrType;
  options: SelectOption[] | null;
  config: AttrConfig;
  relationObjectId: string | null;
  isPrimary: boolean;
  isSystem: boolean;
  order: number;
};

export type ObjectLite = { id: string; slug: string; singular: string; plural: string; icon: string; color: string; newLabel: string };
export type UserLite = { id: string; name: string; firstName: string; lastName: string; email: string; avatarColor: string };
export type RecordLite = { id: string; objectId: string; values: Record<string, unknown>; createdAt: string; updatedAt: string };
export type RelationIndex = Record<string, { name: string; objectSlug: string; domain?: string }>;

export type Calc = "none" | "count" | "filled" | "empty" | "unique" | "percentFilled" | "sum" | "avg" | "min" | "max";
export type Op = "contains" | "not_contains" | "is" | "is_not" | "empty" | "not_empty" | "gt" | "lt" | "before" | "after";
export type FilterRule = { kind: "rule"; id: string; slug: string; op: Op; value: string };
export type FilterGroup = { kind: "group"; id: string; conj: "and" | "or"; items: (FilterRule | FilterGroup)[] };
export type SortRule = { slug: string; dir: "asc" | "desc" };
export type ViewConfig = { sorts: SortRule[]; filter: FilterGroup; columns: string[]; calcs: Record<string, Calc>; groupBy?: string; cardFields?: string[] };
export type ViewLite = { id: string; name: string; type: "table" | "kanban"; config: ViewConfig };

export const emptyFilter = (): FilterGroup => ({ kind: "group", id: "root", conj: "and", items: [] });
export function normalizeViewConfig(c: unknown): ViewConfig {
  const v = (c ?? {}) as Partial<ViewConfig>;
  return {
    sorts: Array.isArray(v.sorts) ? v.sorts : [],
    filter: v.filter && v.filter.kind === "group" ? v.filter : emptyFilter(),
    columns: Array.isArray(v.columns) ? v.columns : [],
    calcs: v.calcs ?? {},
    groupBy: v.groupBy,
    cardFields: v.cardFields,
  };
}
