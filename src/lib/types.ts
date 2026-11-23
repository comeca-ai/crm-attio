export type AttrType =
  | "text" | "number" | "currency" | "date" | "select" | "multiselect" | "status"
  | "user" | "relation" | "email" | "url" | "checkbox";

export type SelectOption = { id: string; label: string; color: string };

export type Attr = {
  id: string;
  slug: string;
  name: string;
  type: AttrType;
  options: SelectOption[] | null;
  relationObjectId: string | null;
  isPrimary: boolean;
  isSystem: boolean;
  order: number;
};

export type ObjectLite = { id: string; slug: string; singular: string; plural: string; icon: string; color: string };
export type UserLite = { id: string; name: string; email: string; avatarColor: string };
export type RecordLite = { id: string; objectId: string; values: Record<string, unknown>; createdAt: string; updatedAt: string };
/** Mapa id -> {nome, slug do objeto} para exibir relações */
export type RelationIndex = Record<string, { name: string; objectSlug: string }>;

export const ATTR_TYPE_LABELS: Record<AttrType, string> = {
  text: "Texto",
  number: "Número",
  currency: "Moeda",
  date: "Data",
  select: "Seleção",
  multiselect: "Seleção múltipla",
  status: "Status",
  user: "Usuário",
  relation: "Relação",
  email: "E-mail",
  url: "Link",
  checkbox: "Caixa de seleção",
};
