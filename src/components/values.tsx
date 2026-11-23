"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Check, Search } from "lucide-react";
import type { Attr } from "@/lib/types";
import { fmtCurrency, fmtDate, fmtNumber, optionFor } from "@/lib/format";
import { Avatar, Tag, useClickOutside } from "./ui";
import { useCrm } from "./crm-context";

export function ValueDisplay({ attr, value, compact = true }: { attr: Attr; value: unknown; compact?: boolean }) {
  const { users, relIndex, objects } = useCrm();
  const empty = value === null || value === undefined || value === "";
  if (attr.type === "checkbox") {
    return (
      <span className={clsx("inline-flex h-4 w-4 items-center justify-center rounded border", value ? "border-[#266df0] bg-[#266df0] text-white" : "border-line-2 bg-white")}>
        {!!value && <Check size={12} strokeWidth={3} />}
      </span>
    );
  }
  if (attr.type === "multiselect") {
    const ids = Array.isArray(value) ? value : [];
    if (ids.length === 0) return compact ? null : <span className="text-ink-3">Vazio</span>;
    return <span className="flex min-w-0 gap-1 overflow-hidden">{ids.map((id) => { const o = optionFor(attr, id); return o ? <Tag key={o.id} label={o.label} color={o.color} /> : null; })}</span>;
  }
  if (empty) return compact ? null : <span className="text-ink-3">Vazio</span>;
  switch (attr.type) {
    case "currency":
      return <span className="tabular-nums">{fmtCurrency(value)}</span>;
    case "number":
      return <span className="tabular-nums">{fmtNumber(value)}</span>;
    case "date":
      return <span>{fmtDate(value)}</span>;
    case "select":
    case "status": {
      const o = optionFor(attr, value);
      return o ? <Tag label={o.label} color={o.color} dot={attr.type === "status"} /> : null;
    }
    case "user": {
      const u = users.find((x) => x.id === value);
      return u ? (
        <span className="inline-flex items-center gap-1.5 truncate"><Avatar name={u.name} color={u.avatarColor} size={18} /><span className="truncate">{u.name}</span></span>
      ) : null;
    }
    case "relation": {
      const r = relIndex[String(value)];
      if (!r) return null;
      const obj = objects.find((o) => o.slug === r.objectSlug);
      return (
        <Link href={`/objects/${r.objectSlug}/${value}`} onClick={(e) => e.stopPropagation()} className="inline-flex max-w-full items-center gap-1.5 truncate rounded-md border border-line-2 bg-white px-1.5 py-[1px] text-[13px] hover:bg-hover">
          <Avatar name={r.name} size={14} square={obj?.slug === "companies"} />
          <span className="truncate">{r.name}</span>
        </Link>
      );
    }
    case "email":
      return <a href={`mailto:${value}`} onClick={(e) => e.stopPropagation()} className="truncate text-ink hover:underline">{String(value)}</a>;
    case "url": {
      const v = String(value);
      return <a href={v.startsWith("http") ? v : `https://${v}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="truncate text-ink hover:underline">{v.replace(/^https?:\/\//, "")}</a>;
    }
    default:
      return <span className="truncate">{String(value)}</span>;
  }
}

type Opt = { id: string; label: React.ReactNode; search: string };

function OptionPicker({ options, value, onPick, placeholder, allowClear = true }: { options: Opt[]; value: unknown; onPick: (v: string | null) => void; placeholder: string; allowClear?: boolean }) {
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
        {list.length === 0 && <div className="px-2 py-2 text-[13px] text-ink-3">Nada encontrado</div>}
        {allowClear && value ? (
          <button onClick={() => onPick(null)} className="mt-1 w-full rounded-lg border-t px-2 py-1.5 text-left text-[13px] text-ink-2 hover:bg-hover">Limpar</button>
        ) : null}
      </div>
    </div>
  );
}

function MultiPicker({ options, value, onToggle, onClose }: { options: Opt[]; value: string[]; onToggle: (id: string) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const list = options.filter((o) => o.search.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="w-60 rounded-xl border border-line-2 bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <div className="flex items-center gap-1.5 border-b px-2 pb-1.5 pt-1">
        <Search size={13} className="text-ink-3" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => (e.key === "Enter" || e.key === "Escape") && onClose()} placeholder="Buscar opção…" className="w-full bg-transparent text-[13px] outline-none placeholder:text-ink-3" />
      </div>
      <div className="scroll-thin max-h-60 overflow-auto pt-1">
        {list.map((o) => (
          <button key={o.id} onClick={() => onToggle(o.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-hover">
            <span className={clsx("flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border", value.includes(o.id) ? "border-[#266df0] bg-[#266df0] text-white" : "border-line-2")}>{value.includes(o.id) && <Check size={10} strokeWidth={3} />}</span>
            <span className="min-w-0 truncate">{o.label}</span>
          </button>
        ))}
      </div>
      <button onClick={onClose} className="mt-1 w-full rounded-lg border-t px-2 py-1.5 text-left text-[13px] text-ink-2 hover:bg-hover">Concluir</button>
    </div>
  );
}

/** Editor do valor de um atributo. Chama onDone(valor) ao confirmar; onCancel ao sair sem salvar. */
export function ValueEditor({ attr, value, onDone, onCancel }: { attr: Attr; value: unknown; onDone: (v: unknown) => void; onCancel: () => void }) {
  const { users, relOptions } = useCrm();
  const ref = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<string>(() => {
    if (value === null || value === undefined) return "";
    if (attr.type === "date") return String(value).slice(0, 10);
    return String(value);
  });
  const commitText = () => {
    let v: unknown = draft.trim();
    if (attr.type === "number" || attr.type === "currency") {
      const n = Number(String(v).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
      v = v === "" || Number.isNaN(n) ? null : n;
    }
    if (v === "") v = null;
    onDone(v);
  };
  const [multi, setMulti] = useState<string[]>(() => (Array.isArray(value) ? (value as string[]) : []));
  const isPicker = ["select", "status", "user", "relation"].includes(attr.type);
  const isMulti = attr.type === "multiselect";
  useClickOutside(ref, () => (isMulti ? onDone(multi) : isPicker ? onCancel() : commitText()));

  useEffect(() => {
    if (attr.type === "checkbox") onDone(!value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (attr.type === "checkbox") return null;

  if (isMulti) {
    const options = (attr.options ?? []).map((o) => ({ id: o.id, label: <Tag label={o.label} color={o.color} />, search: o.label }));
    return (
      <div ref={ref} className="absolute left-0 top-0 z-30">
        <MultiPicker options={options} value={multi} onToggle={(id) => setMulti((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]))} onClose={() => onDone(multi)} />
      </div>
    );
  }

  if (isPicker) {
    let options: Opt[] = [];
    let placeholder = "Buscar…";
    if (attr.type === "select" || attr.type === "status") {
      options = (attr.options ?? []).map((o) => ({ id: o.id, label: <Tag label={o.label} color={o.color} dot={attr.type === "status"} />, search: o.label }));
      placeholder = "Buscar opção…";
    } else if (attr.type === "user") {
      options = users.map((u) => ({ id: u.id, label: <span className="inline-flex items-center gap-1.5"><Avatar name={u.name} color={u.avatarColor} size={18} />{u.name}</span>, search: u.name }));
      placeholder = "Buscar pessoa do time…";
    } else {
      options = (relOptions[attr.relationObjectId ?? ""] ?? []).map((r) => ({ id: r.id, label: <span className="inline-flex items-center gap-1.5"><Avatar name={r.name} size={16} square />{r.name}</span>, search: r.name }));
      placeholder = "Buscar registro…";
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
        placeholder={attr.type === "currency" ? "R$ 0" : attr.type === "email" ? "nome@empresa.com" : ""}
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
