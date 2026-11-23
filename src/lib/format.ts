import type { Attr, RelationIndex, SelectOption, UserLite } from "./types";

export const TAG_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
  gray: { bg: "#f1f2f4", fg: "#4b5563", dot: "#9ca3af" },
  blue: { bg: "#e8f0fe", fg: "#1d4ed8", dot: "#3b82f6" },
  green: { bg: "#e7f6ec", fg: "#15803d", dot: "#22c55e" },
  orange: { bg: "#fdf0e3", fg: "#c2410c", dot: "#f97316" },
  red: { bg: "#fde8e8", fg: "#b91c1c", dot: "#ef4444" },
  purple: { bg: "#f1ebfd", fg: "#6d28d9", dot: "#8b5cf6" },
  pink: { bg: "#fce8f3", fg: "#be185d", dot: "#ec4899" },
  yellow: { bg: "#fdf6dc", fg: "#a16207", dot: "#eab308" },
};
export const COLOR_KEYS = Object.keys(TAG_COLORS);

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("pt-BR");

export function fmtCurrency(v: unknown) {
  return typeof v === "number" ? brl.format(v) : "";
}
export function fmtNumber(v: unknown) {
  return typeof v === "number" ? num.format(v) : "";
}
export function fmtDate(v: unknown) {
  if (!v || typeof v !== "string") return "";
  const [y, m, d] = v.slice(0, 10).split("-").map(Number);
  if (!y) return "";
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
}
export function fmtDateTime(v: string | Date) {
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).replace(".", "");
}
export function relativeTime(v: string | Date) {
  const d = typeof v === "string" ? new Date(v) : v;
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "agora";
  const m = Math.round(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  const dd = Math.round(h / 24);
  if (dd < 30) return `há ${dd} ${dd === 1 ? "dia" : "dias"}`;
  return d.toLocaleDateString("pt-BR");
}

export function optionFor(attr: Attr, v: unknown): SelectOption | undefined {
  return attr.options?.find((o) => o.id === v);
}

export function primaryAttr(attrs: Attr[]) {
  return attrs.find((a) => a.isPrimary) ?? attrs[0];
}

export function recordName(values: Record<string, unknown>, attrs?: Attr[]) {
  const slug = attrs ? primaryAttr(attrs)?.slug : "name";
  const v = values[slug ?? "name"];
  return typeof v === "string" && v.trim() ? v : "Sem nome";
}

/** Texto plano de um valor (usado em busca, ordenação e filtro). */
export function plainValue(attr: Attr, v: unknown, users: UserLite[], rel: RelationIndex): string {
  if (v === null || v === undefined || v === "") return "";
  switch (attr.type) {
    case "select":
    case "status":
      return optionFor(attr, v)?.label ?? "";
    case "multiselect":
      return Array.isArray(v) ? v.map((x) => optionFor(attr, x)?.label).filter(Boolean).join(", ") : "";
    case "user":
      return users.find((u) => u.id === v)?.name ?? "";
    case "relation":
      return rel[String(v)]?.name ?? "";
    case "checkbox":
      return v ? "sim" : "não";
    default:
      return String(v);
  }
}

export function initials(name: string) {
  return name.split(/\s+/).filter((p) => /[\p{L}\p{N}]/u.test(p[0] ?? "")).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

export function domainColor(seed: string) {
  const palette = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}
