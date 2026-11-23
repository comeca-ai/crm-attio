import type { Attr, Calc, FilterGroup, FilterRule, Op, RecordLite, RelationIndex, SortRule, UserLite } from "@/lib/types";
import { asArray, fmtCurrency, fmtNumber, plainValue } from "@/lib/format";
import type { Locale } from "@/i18n/dict";

export type Ctx = { users: UserLite[]; rel: RelationIndex; attrs: Attr[] };

const isEmpty = (v: unknown) => v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const PICK_TYPES = ["select", "multiselect", "status", "user", "relation"];
export const NUM_TYPES = ["number", "currency"];
export const DATE_TYPES = ["date", "timestamp"];

export function opsFor(a: Attr): Op[] {
  if (a.type === "checkbox") return ["is"];
  if (PICK_TYPES.includes(a.type)) return ["is", "is_not", "empty", "not_empty"];
  if (NUM_TYPES.includes(a.type)) return ["is", "gt", "lt", "empty", "not_empty"];
  if (DATE_TYPES.includes(a.type)) return ["is", "before", "after", "empty", "not_empty"];
  return ["contains", "not_contains", "is", "is_not", "empty", "not_empty"];
}
export const needsValue = (op: Op) => op !== "empty" && op !== "not_empty";

function matchRule(rule: FilterRule, r: RecordLite, ctx: Ctx): boolean {
  const a = ctx.attrs.find((x) => x.slug === rule.slug);
  if (!a) return true;
  const v = r.values[a.slug];
  if (rule.op === "empty") return isEmpty(v);
  if (rule.op === "not_empty") return !isEmpty(v);
  if (rule.value === "" ) return true; // regra incompleta não filtra
  if (a.type === "checkbox") return !!v === (rule.value === "true");
  if (PICK_TYPES.includes(a.type)) {
    const has = asArray(v).includes(rule.value);
    return rule.op === "is_not" ? !has : has;
  }
  if (NUM_TYPES.includes(a.type)) {
    const n = Number(v), x = Number(rule.value);
    if (isEmpty(v) || Number.isNaN(n)) return false;
    return rule.op === "gt" ? n > x : rule.op === "lt" ? n < x : n === x;
  }
  if (DATE_TYPES.includes(a.type)) {
    if (isEmpty(v)) return false;
    const d = String(v).slice(0, 10);
    return rule.op === "before" ? d < rule.value : rule.op === "after" ? d > rule.value : d === rule.value;
  }
  const text = norm(plainValue(a, v, ctx.users, ctx.rel));
  const q = norm(rule.value);
  switch (rule.op) {
    case "contains": return text.includes(q);
    case "not_contains": return !text.includes(q);
    case "is": return text === q;
    case "is_not": return text !== q;
    default: return true;
  }
}

export function matchGroup(g: FilterGroup, r: RecordLite, ctx: Ctx): boolean {
  if (g.items.length === 0) return true;
  const res = g.items.map((it) => (it.kind === "group" ? matchGroup(it, r, ctx) : matchRule(it, r, ctx)));
  return g.conj === "and" ? res.every(Boolean) : res.some(Boolean);
}

export function countRules(g: FilterGroup): number {
  return g.items.reduce((n, it) => n + (it.kind === "group" ? countRules(it) : 1), 0);
}

export function sortRecords(rows: RecordLite[], sorts: SortRule[], ctx: Ctx, locale: Locale): RecordLite[] {
  if (sorts.length === 0) return rows;
  const collator = new Intl.Collator(locale === "pt-BR" ? "pt-BR" : "en", { numeric: true, sensitivity: "base" });
  const key = (a: Attr, r: RecordLite): string | number | null => {
    const v = r.values[a.slug];
    if (isEmpty(v)) return null;
    if (NUM_TYPES.includes(a.type)) return Number(v);
    if (DATE_TYPES.includes(a.type)) return String(v);
    if ((a.type === "select" || a.type === "status") && a.options) return a.options.findIndex((o) => o.id === v);
    return plainValue(a, v, ctx.users, ctx.rel);
  };
  return [...rows].sort((x, y) => {
    for (const s of sorts) {
      const a = ctx.attrs.find((z) => z.slug === s.slug);
      if (!a) continue;
      const kx = key(a, x), ky = key(a, y);
      if (kx === ky) continue;
      if (kx === null) return 1; // vazios sempre no fim
      if (ky === null) return -1;
      const c = typeof kx === "number" && typeof ky === "number" ? kx - ky : collator.compare(String(kx), String(ky));
      if (c !== 0) return s.dir === "asc" ? c : -c;
    }
    return 0;
  });
}

export function calcsFor(a: Attr): Calc[] {
  const base: Calc[] = ["count", "filled", "empty", "unique", "percentFilled"];
  return NUM_TYPES.includes(a.type) ? [...base, "sum", "avg", "min", "max"] : base;
}

export function calcValue(calc: Calc, a: Attr, rows: RecordLite[], locale: Locale): string {
  const vals = rows.map((r) => r.values[a.slug]);
  const filled = vals.filter((v) => !isEmpty(v));
  const nums = filled.map(Number).filter((n) => !Number.isNaN(n));
  const fmt = (n: number) => (a.type === "currency" ? fmtCurrency(n, a.config.currency ?? "USD", locale) : fmtNumber(Math.round(n * 100) / 100, locale));
  switch (calc) {
    case "count": return String(vals.length);
    case "filled": return String(filled.length);
    case "empty": return String(vals.length - filled.length);
    case "unique": return String(new Set(filled.map((v) => JSON.stringify(v))).size);
    case "percentFilled": return vals.length ? `${Math.round((filled.length / vals.length) * 100)}%` : "0%";
    case "sum": return fmt(nums.reduce((x, y) => x + y, 0));
    case "avg": return nums.length ? fmt(nums.reduce((x, y) => x + y, 0) / nums.length) : "—";
    case "min": return nums.length ? fmt(Math.min(...nums)) : "—";
    case "max": return nums.length ? fmt(Math.max(...nums)) : "—";
    default: return "";
  }
}

export function toCsv(attrs: Attr[], rows: RecordLite[], ctx: Ctx) {
  const esc = (v: string) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const head = attrs.map((a) => esc(a.name)).join(",");
  const body = rows.map((r) => attrs.map((a) => esc(plainValue(a, r.values[a.slug], ctx.users, ctx.rel))).join(","));
  return [head, ...body].join("\n");
}

/** CSV simples com aspas, vírgula ou ponto e vírgula. */
export function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

export const uid = () => Math.random().toString(36).slice(2, 10);
