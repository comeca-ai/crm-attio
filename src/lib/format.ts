import { safeTz } from "./time";
import type { Attr, RelationIndex, SelectOption, UserLite } from "./types";
import type { Locale } from "@/i18n/dict";

export const TAG_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
  gray: { bg: "#eef0f2", fg: "#46484d", dot: "#9a9ca2" },
  blue: { bg: "#e2eeff", fg: "#1557d6", dot: "#2e7cf6" },
  green: { bg: "#dcf6e6", fg: "#11823b", dot: "#2bb56a" },
  orange: { bg: "#ffeadb", fg: "#c4500d", dot: "#f2802d" },
  red: { bg: "#ffe4e4", fg: "#c4271f", dot: "#ef4b44" },
  purple: { bg: "#efe5ff", fg: "#6c33d6", dot: "#9a64f4" },
  pink: { bg: "#fde4f1", fg: "#bb2a77", dot: "#ec4f9e" },
  yellow: { bg: "#fdf2c7", fg: "#946200", dot: "#ebb517" },
};
export const COLOR_KEYS = Object.keys(TAG_COLORS);

const intl = (l: Locale) => (l === "pt-BR" ? "pt-BR" : "en-US");

export function fmtCurrency(v: unknown, currency = "USD", locale: Locale = "en", compact = false) {
  if (typeof v !== "number") return "";
  return new Intl.NumberFormat(intl(locale), { style: "currency", currency, maximumFractionDigits: compact ? 1 : 0, notation: compact ? "compact" : "standard" }).format(v);
}
export function fmtNumber(v: unknown, locale: Locale = "en") {
  return typeof v === "number" ? new Intl.NumberFormat(intl(locale)).format(v) : "";
}
export function fmtDate(v: unknown, locale: Locale = "en") {
  if (!v || typeof v !== "string") return "";
  const [y, m, d] = v.slice(0, 10).split("-").map(Number);
  if (!y) return "";
  return new Date(y, m - 1, d).toLocaleDateString(intl(locale), { day: "numeric", month: "short", year: "numeric" });
}
export function fmtDateTime(v: string | Date, locale: Locale = "en", timeZone?: string) {
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleString(intl(locale), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: timeZone ? safeTz(timeZone) : undefined });
}
export function fmtShortDate(v: string | Date, locale: Locale = "en") {
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleDateString(intl(locale), { day: "numeric", month: "short" });
}
export function relativeTime(v: string | Date, locale: Locale = "en") {
  const d = typeof v === "string" ? new Date(v) : v;
  const rtf = new Intl.RelativeTimeFormat(intl(locale), { numeric: "auto" });
  const s = Math.round((d.getTime() - Date.now()) / 1000);
  const a = Math.abs(s);
  if (a < 45) return rtf.format(0, "second");
  if (a < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (a < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (a < 86400 * 30) return rtf.format(Math.round(s / 86400), "day");
  return d.toLocaleDateString(intl(locale), { day: "numeric", month: "short", year: "numeric" });
}

export function optionFor(attr: Attr, v: unknown): SelectOption | undefined {
  return attr.options?.find((o) => o.id === v);
}
export function primaryAttr(attrs: Attr[]) {
  return attrs.find((a) => a.isPrimary) ?? attrs[0];
}
export function personName(v: unknown) {
  if (!v || typeof v !== "object") return typeof v === "string" ? v : "";
  const o = v as { first_name?: string; last_name?: string };
  return [o.first_name, o.last_name].filter(Boolean).join(" ").trim();
}
export function recordName(values: Record<string, unknown>, attrs?: Attr[], fallback = "Unnamed") {
  const a = attrs ? primaryAttr(attrs) : undefined;
  const v = values[a?.slug ?? "name"];
  const s = a?.type === "personal-name" || (v && typeof v === "object") ? personName(v) : typeof v === "string" ? v : "";
  return s.trim() ? s : fallback;
}
export const asArray = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : v ? [String(v)] : []);

/** Texto plano de um valor (busca, ordenação, filtro, CSV). */
export function plainValue(attr: Attr, v: unknown, users: UserLite[], rel: RelationIndex): string {
  if (v === null || v === undefined || v === "") return "";
  switch (attr.type) {
    case "select":
    case "status":
      return optionFor(attr, v)?.label ?? "";
    case "multiselect":
      return asArray(v).map((x) => optionFor(attr, x)?.label).filter(Boolean).join(", ");
    case "user":
      return users.find((u) => u.id === v)?.name ?? "";
    case "relation":
      return asArray(v).map((id) => rel[id]?.name).filter(Boolean).join(", ");
    case "personal-name":
      return personName(v);
    case "checkbox":
      return v ? "true" : "";
    default:
      return Array.isArray(v) ? v.join(", ") : String(v);
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
export const fullName = (u: { firstName: string; lastName: string }) => `${u.firstName} ${u.lastName}`.trim();
