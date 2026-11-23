import type { Attr } from "./types";

/** Converte texto (CSV, formulários) para o formato salvo de cada tipo de atributo. */
export function coerceValue(attr: Attr, raw: string, ctx: { users: { id: string; email: string; name: string }[]; findRecord: (name: string) => string | undefined }): unknown {
  const s = raw.trim();
  if (!s) return null;
  switch (attr.type) {
    case "number":
    case "currency": {
      const n = Number(s.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
      return Number.isNaN(n) ? null : n;
    }
    case "date": {
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    }
    case "checkbox":
      return /^(true|yes|sim|1|x)$/i.test(s);
    case "select":
    case "status":
      return attr.options?.find((o) => o.label.toLowerCase() === s.toLowerCase() || o.id === s)?.id ?? null;
    case "multiselect":
      return s.split(/[;,]/).map((p) => attr.options?.find((o) => o.label.toLowerCase() === p.trim().toLowerCase())?.id).filter(Boolean);
    case "user":
      return ctx.users.find((u) => u.email.toLowerCase() === s.toLowerCase() || u.name.toLowerCase() === s.toLowerCase())?.id ?? null;
    case "relation": {
      const ids = s.split(/[;]/).map((p) => ctx.findRecord(p.trim())).filter(Boolean) as string[];
      return attr.config.multiple ? ids : ids[0] ?? null;
    }
    case "personal-name": {
      const [first, ...rest] = s.split(/\s+/);
      return { first_name: first, last_name: rest.join(" ") };
    }
    default:
      return s;
  }
}
