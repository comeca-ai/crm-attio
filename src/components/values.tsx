"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Check, Search } from "lucide-react";
import type { Attr } from "@/lib/types";
import { asArray, fmtCurrency, fmtDate, fmtDateTime, fmtNumber, optionFor, personName } from "@/lib/format";
import { Avatar, CompanyLogo, ObjectIcon, Tag, useClickOutside } from "./ui";
import { useCrm } from "./crm-context";
import { useI18n } from "@/i18n/client";

const linkCls = "truncate text-[#266df0] hover:underline";
const handle = (v: string) => v.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/").pop() || v;

export function RecordChip({ id, link = true }: { id: string; link?: boolean }) {
  const { relIndex } = useCrm();
  const r = relIndex[id];
  if (!r) return null;
  const icon = r.objectSlug === "companies" ? <CompanyLogo name={r.name} domain={r.domain} size={14} /> : r.objectSlug === "deals" ? <ObjectIcon icon="target" color="#f2802d" size={14} solid /> : <Avatar name={r.name} size={14} />;
  const cls = "inline-flex max-w-full shrink-0 items-center gap-1.5 truncate rounded-[6px] border border-line-2 bg-white px-1.5 py-[1px] text-[13px] hover:bg-hover";
  return link ? (
    <Link href={`/objects/${r.objectSlug}/${id}`} onClick={(e) => e.stopPropagation()} className={cls}>{icon}<span className="truncate">{r.name}</span></Link>
  ) : <span className={cls}>{icon}<span className="truncate">{r.name}</span></span>;
}

export function ValueDisplay({ attr, value, compact = true }: { attr: Attr; value: unknown; compact?: boolean }) {
  const { users, me } = useCrm();
  const tz = me.timezone;
  const { t, locale } = useI18n();
  const empty = value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
  const placeholder = compact ? null : <span className="text-ink-3">{t("common.empty")}</span>;
  if (attr.type === "checkbox") {
    return (
      <span className={clsx("inline-flex h-4 w-4 items-center justify-center rounded border", value ? "border-[#266df0] bg-[#266df0] text-white" : "border-line-2 bg-white")}>
        {!!value && <Check size={12} strokeWidth={3} />}
      </span>
    );
  }
  if (empty) return placeholder;
  switch (attr.type) {
    case "multiselect":
      return <span className={clsx("flex min-w-0 gap-1", compact ? "overflow-hidden" : "flex-wrap")}>{asArray(value).map((id) => { const o = optionFor(attr, id); return o ? <Tag key={o.id} label={o.label} color={o.color} /> : null; })}</span>;
    case "currency":
      return <span className="tabular-nums">{fmtCurrency(value, attr.config.currency ?? "USD", locale)}</span>;
    case "number":
      return <span className="tabular-nums">{fmtNumber(value, locale)}</span>;
    case "date":
      return <span>{fmtDate(value, locale)}</span>;
    case "timestamp":
      return <span>{fmtDateTime(String(value), locale, tz)}</span>;
    case "select":
    case "status": {
      const o = optionFor(attr, value);
      return o ? <Tag label={o.label} color={o.color} dot={attr.type === "status"} /> : null;
    }
    case "user": {
      const u = users.find((x) => x.id === value);
      return u ? <span className="inline-flex min-w-0 items-center gap-1.5"><Avatar name={u.name} color={u.avatarColor} size={16} /><span className="truncate">{u.name}</span></span> : null;
    }
    case "relation":
      return <span className={clsx("flex min-w-0 gap-1", compact ? "overflow-hidden" : "flex-wrap")}>{asArray(value).map((id) => <RecordChip key={id} id={id} />)}</span>;
    case "personal-name":
      return <span className="truncate">{personName(value)}</span>;
    case "email":
      return <span className="flex min-w-0 gap-1 overflow-hidden">{asArray(value).map((e) => <a key={e} href={`mailto:${e}`} onClick={(ev) => ev.stopPropagation()} className={linkCls}>{e}</a>)}</span>;
    case "domain":
      return <span className="flex min-w-0 gap-1 overflow-hidden">{asArray(value).map((d) => <a key={d} href={`https://${d}`} target="_blank" rel="noreferrer" onClick={(ev) => ev.stopPropagation()} className={linkCls}>{d}</a>)}</span>;
    case "url": {
      const v = String(value);
      return <a href={v.startsWith("http") ? v : `https://${v}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className={linkCls}>{compact ? handle(v) : v.replace(/^https?:\/\//, "")}</a>;
    }
    case "phone":
      return <a href={`tel:${String(value).replace(/\s/g, "")}`} onClick={(e) => e.stopPropagation()} className="truncate hover:underline">{String(value)}</a>;
    default:
      return <span className={compact ? "truncate" : "whitespace-pre-wrap break-words"}>{String(value)}</span>;
  }
}

type Opt = { id: string; label: React.ReactNode; search: string };

function OptionPicker({ options, value, onPick, placeholder, allowClear = true }: { options: Opt[]; value: unknown; onPick: (v: string | null) => void; placeholder: string; allowClear?: boolean }) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const list = useMemo(() => options.filter((o) => o.search.toLowerCase().includes(q.toLowerCase())), [options, q]);
  return (
    <div className="w-60 rounded-xl border border-line-2 bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <div className="flex items-center gap-1.5 border-b px-2 pb-1.5 pt-1">
        <Search size={13} className="text-ink-3" />
        <input
          autoFocus
          value={q}
          onChange={(e) => { setQ(e.target.value); setHi(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, list.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
            if (e.key === "Enter" && list[hi]) onPick(list[hi].id);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-ink-3"
        />
      </div>
      <div className="scroll-thin max-h-60 overflow-auto pt-1">
        {list.map((o, i) => (
          <button key={o.id} onMouseEnter={() => setHi(i)} onClick={() => onPick(o.id)} className={clsx("flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-[13px]", i === hi && "bg-hover")}>
            <span className="min-w-0 truncate">{o.label}</span>
            {o.id === value && <Check size={14} className="shrink-0 text-[#266df0]" />}
          </button>
        ))}
        {list.length === 0 && <div className="px-2 py-2 text-[13px] text-ink-3">{t("common.noResults")}</div>}
        {allowClear && value ? (
          <button onClick={() => onPick(null)} className="mt-1 w-full rounded-lg border-t px-2 py-1.5 text-left text-[13px] text-ink-2 hover:bg-hover">{t("common.clear")}</button>
        ) : null}
      </div>
    </div>
  );
}

export function MultiPicker({ options, value, onToggle, onClose, placeholder }: { options: Opt[]; value: string[]; onToggle: (id: string) => void; onClose: () => void; placeholder?: string }) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const list = options.filter((o) => o.search.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="w-60 rounded-xl border border-line-2 bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <div className="flex items-center gap-1.5 border-b px-2 pb-1.5 pt-1">
        <Search size={13} className="text-ink-3" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => (e.key === "Enter" || e.key === "Escape") && onClose()} placeholder={placeholder ?? t("attr.searchOption")} className="w-full bg-transparent text-[13px] outline-none placeholder:text-ink-3" />
      </div>
      <div className="scroll-thin max-h-60 overflow-auto pt-1">
        {list.map((o) => (
          <button key={o.id} onClick={() => onToggle(o.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-hover">
            <span className={clsx("flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border", value.includes(o.id) ? "border-[#266df0] bg-[#266df0] text-white" : "border-line-2")}>{value.includes(o.id) && <Check size={10} strokeWidth={3} />}</span>
            <span className="min-w-0 truncate">{o.label}</span>
          </button>
        ))}
      </div>
      <button onClick={onClose} className="mt-1 w-full rounded-lg border-t px-2 py-1.5 text-left text-[13px] text-ink-2 hover:bg-hover">{t("common.done")}</button>
    </div>
  );
}

/** Editor do valor de um atributo. Chama onDone(valor) ao confirmar; onCancel ao sair sem salvar. */
export function ValueEditor({ attr, value, onDone, onCancel }: { attr: Attr; value: unknown; onDone: (v: unknown) => void; onCancel: () => void }) {
  const { users, relOptions } = useCrm();
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<string>(() => {
    if (value === null || value === undefined) return "";
    if (attr.type === "date") return String(value).slice(0, 10);
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
  });
  const commitText = () => {
    let v: unknown = draft.trim();
    if (attr.type === "number" || attr.type === "currency") {
      const n = Number(String(v).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
      v = v === "" || Number.isNaN(n) ? null : n;
    }
    if ((attr.type === "email" || attr.type === "domain") && typeof v === "string" && v.includes(",")) v = v.split(",").map((x) => x.trim()).filter(Boolean);
    if (v === "") v = null;
    onDone(v);
  };
  const [multi, setMulti] = useState<string[]>(() => (Array.isArray(value) ? (value as string[]) : []));
  const [name, setName] = useState(() => ({ first_name: "", last_name: "", ...((value as object) ?? {}) }) as { first_name: string; last_name: string });
  const isMultiRel = attr.type === "relation" && !!attr.config.multiple;
  const isPicker = ["select", "status", "user"].includes(attr.type) || (attr.type === "relation" && !isMultiRel);
  const isMulti = attr.type === "multiselect" || isMultiRel;
  const isName = attr.type === "personal-name";
  useClickOutside(ref, () => (isMulti ? onDone(multi) : isName ? onDone(name) : isPicker ? onCancel() : commitText()));

  useEffect(() => {
    if (attr.type === "checkbox") onDone(!value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (attr.type === "checkbox") return null;

  if (isName) {
    const cls = "h-[30px] w-full rounded-md border border-line-2 px-2 text-[13px] outline-none focus:border-[#9dbcf8]";
    const key = (e: React.KeyboardEvent) => { if (e.key === "Enter") onDone(name); if (e.key === "Escape") onCancel(); };
    return (
      <div ref={ref} className="absolute left-0 top-0 z-30 flex w-[300px] gap-1.5 rounded-lg border border-line-2 bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
        <input autoFocus className={cls} placeholder={t("attr.firstName")} value={name.first_name} onChange={(e) => setName({ ...name, first_name: e.target.value })} onKeyDown={key} />
        <input className={cls} placeholder={t("attr.lastName")} value={name.last_name} onChange={(e) => setName({ ...name, last_name: e.target.value })} onKeyDown={key} />
      </div>
    );
  }

  if (isMulti) {
    const options = isMultiRel
      ? (relOptions[attr.relationObjectId ?? ""] ?? []).map((r) => ({ id: r.id, label: <span className="inline-flex items-center gap-1.5"><RecordChip id={r.id} link={false} /></span>, search: r.name }))
      : (attr.options ?? []).map((o) => ({ id: o.id, label: <Tag label={o.label} color={o.color} />, search: o.label }));
    return (
      <div ref={ref} className="absolute left-0 top-0 z-30">
        <MultiPicker placeholder={isMultiRel ? t("attr.searchRecord") : undefined} options={options} value={multi} onToggle={(id) => setMulti((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]))} onClose={() => onDone(multi)} />
      </div>
    );
  }

  if (isPicker) {
    let options: Opt[] = [];
    let placeholder = t("common.search");
    if (attr.type === "select" || attr.type === "status") {
      options = (attr.options ?? []).map((o) => ({ id: o.id, label: <Tag label={o.label} color={o.color} dot={attr.type === "status"} />, search: o.label }));
      placeholder = t("attr.searchOption");
    } else if (attr.type === "user") {
      options = users.map((u) => ({ id: u.id, label: <span className="inline-flex items-center gap-1.5"><Avatar name={u.name} color={u.avatarColor} size={18} />{u.name}</span>, search: u.name }));
      placeholder = t("attr.searchUser");
    } else {
      options = (relOptions[attr.relationObjectId ?? ""] ?? []).map((r) => ({ id: r.id, label: <RecordChip id={r.id} link={false} />, search: r.name }));
      placeholder = t("attr.searchRecord");
    }
    return (
      <div ref={ref} className="absolute left-0 top-0 z-30">
        <OptionPicker options={options} value={value} placeholder={placeholder} onPick={(v) => onDone(v)} />
      </div>
    );
  }

  return (
    <div ref={ref} className="absolute left-0 top-0 z-30 min-w-full">
      <input
        autoFocus
        type={attr.type === "date" ? "date" : "text"}
        inputMode={attr.type === "number" || attr.type === "currency" ? "decimal" : undefined}
        value={draft}
        placeholder={attr.type === "currency" ? (attr.config.currency === "BRL" ? "R$ 0" : "$0") : attr.type === "email" ? "name@company.com" : attr.type === "domain" ? "company.com" : ""}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitText();
          if (e.key === "Escape") onCancel();
        }}
        className="h-[34px] w-full min-w-[220px] rounded-md border border-[#9dbcf8] bg-white px-2 text-[13px] shadow-[0_4px_16px_rgba(0,0,0,0.10)] outline-none ring-2 ring-[#e3ecfd]"
      />
    </div>
  );
}
