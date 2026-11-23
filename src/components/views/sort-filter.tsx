"use client";
import { useState } from "react";
import clsx from "clsx";
import { ArrowDownWideNarrow, CircleHelp, GripVertical, ListFilter, Plus, Search, Trash2, X } from "lucide-react";
import type { Attr, FilterGroup, FilterRule, Op, SortRule } from "@/lib/types";
import { useI18n } from "@/i18n/client";
import type { MessageKey } from "@/i18n/dict";
import { useCrm } from "../crm-context";
import { Popover } from "../ui";
import { AttrIcon } from "../attr-icon";
import { DATE_TYPES, NUM_TYPES, PICK_TYPES, countRules, needsValue, opsFor, uid } from "./engine";

const selCls = "h-7 rounded-md border border-line-2 bg-white px-1.5 text-[13px] outline-none hover:bg-hover focus:border-[#9dbcf8]";

/** Chip "Sorted by X +1" com o popover de ordenação múltipla (arrastar para reordenar). */
export function SortPopover({ attrs, sorts, onChange }: { attrs: Attr[]; sorts: SortRule[]; onChange: (s: SortRule[]) => void }) {
  const { t } = useI18n();
  const [drag, setDrag] = useState<number | null>(null);
  const first = attrs.find((a) => a.slug === sorts[0]?.slug);
  const unused = attrs.filter((a) => !sorts.some((s) => s.slug === a.slug));
  const set = (i: number, patch: Partial<SortRule>) => onChange(sorts.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <Popover width={400} trigger={(open, toggle) => (
      <button onClick={toggle} data-testid="sort-chip" className={clsx("flex h-7 items-center gap-1.5 rounded-lg border border-line-2 px-2 text-[13px] hover:bg-hover", open && "bg-hover")}>
        <ArrowDownWideNarrow size={13} className="text-ink-2" />
        {first ? (<><span className="text-ink-2">{t("common.sortedBy")}</span><span className="font-medium">{first.name}</span>{sorts.length > 1 && <span className="rounded bg-[#efeff1] px-1 text-[11px] font-medium text-ink-2">+{sorts.length - 1}</span>}</>) : <span className="text-ink-2">{t("sort.none")}</span>}
      </button>
    )}>
      {() => (
        <div className="p-1" data-testid="sort-popover">
          {sorts.map((s, i) => (
            <div key={s.slug + i} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag === null || drag === i) return; const n = [...sorts]; const [m] = n.splice(drag, 1); n.splice(i, 0, m); onChange(n); setDrag(null); }}
              className="flex items-center gap-1.5 py-1" data-testid="sort-row">
              <GripVertical size={13} className="cursor-grab text-ink-3" />
              <select className={clsx(selCls, "flex-1")} value={s.slug} onChange={(e) => set(i, { slug: e.target.value })}>
                {attrs.filter((a) => a.slug === s.slug || !sorts.some((x) => x.slug === a.slug)).map((a) => <option key={a.id} value={a.slug}>{a.name}</option>)}
              </select>
              <select className={clsx(selCls, "w-[120px]")} value={s.dir} onChange={(e) => set(i, { dir: e.target.value as "asc" | "desc" })}>
                <option value="asc">{t("sort.asc")}</option><option value="desc">{t("sort.desc")}</option>
              </select>
              <button onClick={() => onChange(sorts.filter((_, j) => j !== i))} className="rounded p-1 text-ink-3 hover:bg-hover" aria-label={t("common.delete")}><X size={13} /></button>
            </div>
          ))}
          {unused.length > 0 && (
            <button onClick={() => onChange([...sorts, { slug: unused[0].slug, dir: "asc" }])} className="mt-1 flex h-7 items-center gap-1.5 rounded-md border border-line-2 px-2 text-[13px] font-medium hover:bg-hover">
              <Plus size={13} />{t("sort.add")}
            </button>
          )}
          <div className="-mx-1 mt-2 border-t px-2 pt-2">
            <a href="https://attio.com/help/reference/managing-your-data/views/sort-views" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12.5px] text-ink-2 hover:text-ink"><CircleHelp size={13} />{t("sort.learn")}</a>
          </div>
        </div>
      )}
    </Popover>
  );
}

function AttrSearchList({ attrs, onPick, placeholder }: { attrs: Attr[]; onPick: (a: Attr) => void; placeholder: string }) {
  const [q, setQ] = useState("");
  const list = attrs.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="flex items-center gap-1.5 border-b px-2 pb-1.5 pt-1">
        <Search size={13} className="text-ink-3" />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-[13px] outline-none placeholder:text-ink-3" />
      </div>
      <div className="scroll-thin max-h-72 overflow-auto pt-1">
        {list.map((a) => (
          <button key={a.id} onClick={() => onPick(a)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-hover">
            <AttrIcon type={a.type} slug={a.slug} size={13} />{a.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function ValueInput({ attr, rule, onChange }: { attr: Attr; rule: FilterRule; onChange: (v: string) => void }) {
  const { t } = useI18n();
  const { users, relOptions } = useCrm();
  if (!needsValue(rule.op)) return null;
  if (attr.type === "checkbox") {
    return <select className={clsx(selCls, "flex-1")} value={rule.value} onChange={(e) => onChange(e.target.value)}><option value="">{t("filter.choose")}</option><option value="true">{t("attr.checked")}</option><option value="false">{t("attr.unchecked")}</option></select>;
  }
  if (PICK_TYPES.includes(attr.type)) {
    const opts = attr.type === "user" ? users.map((u) => ({ id: u.id, label: u.name })) : attr.type === "relation" ? (relOptions[attr.relationObjectId ?? ""] ?? []).map((r) => ({ id: r.id, label: r.name })) : (attr.options ?? []).map((o) => ({ id: o.id, label: o.label }));
    return <select className={clsx(selCls, "min-w-0 flex-1")} value={rule.value} onChange={(e) => onChange(e.target.value)} data-testid="filter-value"><option value="">{t("filter.choose")}</option>{opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select>;
  }
  const type = DATE_TYPES.includes(attr.type) ? "date" : NUM_TYPES.includes(attr.type) ? "number" : "text";
  return <input type={type} className={clsx(selCls, "min-w-0 flex-1 px-2")} value={rule.value} placeholder={t("filter.value")} onChange={(e) => onChange(e.target.value)} data-testid="filter-value" />;
}

function GroupEditor({ group, attrs, onChange, onRemove, depth }: { group: FilterGroup; attrs: Attr[]; onChange: (g: FilterGroup) => void; onRemove?: () => void; depth: number }) {
  const { t } = useI18n();
  const setItem = (i: number, it: FilterRule | FilterGroup | null) => onChange({ ...group, items: it ? group.items.map((x, j) => (j === i ? it : x)) : group.items.filter((_, j) => j !== i) });
  const newRule = (): FilterRule => ({ kind: "rule", id: uid(), slug: attrs[0].slug, op: opsFor(attrs[0])[0], value: "" });
  return (
    <div className={clsx(depth > 0 && "rounded-lg border border-line-2 bg-[#fafafb] p-2")} data-testid={depth > 0 ? "filter-group" : undefined}>
      {group.items.map((it, i) => (
        <div key={it.id} className="flex items-start gap-1.5 py-1">
          <div className="w-[62px] shrink-0 pt-1 text-[12.5px] text-ink-2">
            {i === 0 ? t("filter.where") : i === 1 ? (
              <select className={clsx(selCls, "-mt-1 w-full px-1")} value={group.conj} onChange={(e) => onChange({ ...group, conj: e.target.value as "and" | "or" })} data-testid="filter-conj">
                <option value="and">{t("filter.and")}</option><option value="or">{t("filter.or")}</option>
              </select>
            ) : t(`filter.${group.conj}` as MessageKey)}
          </div>
          {it.kind === "group" ? (
            <div className="min-w-0 flex-1"><GroupEditor group={it} attrs={attrs} depth={depth + 1} onChange={(g) => setItem(i, g)} onRemove={() => setItem(i, null)} /></div>
          ) : (() => {
            const a = attrs.find((x) => x.slug === it.slug) ?? attrs[0];
            return (
              <div className="flex min-w-0 flex-1 items-center gap-1.5" data-testid="filter-rule">
                <select className={clsx(selCls, "w-[130px]")} value={it.slug} onChange={(e) => { const na = attrs.find((x) => x.slug === e.target.value)!; setItem(i, { ...it, slug: na.slug, op: opsFor(na)[0], value: "" }); }}>
                  {attrs.map((x) => <option key={x.id} value={x.slug}>{x.name}</option>)}
                </select>
                <select className={clsx(selCls, "w-[118px]")} value={it.op} onChange={(e) => setItem(i, { ...it, op: e.target.value as Op })} data-testid="filter-op">
                  {opsFor(a).map((o) => <option key={o} value={o}>{t(`op.${o}` as MessageKey)}</option>)}
                </select>
                <ValueInput attr={a} rule={it} onChange={(v) => setItem(i, { ...it, value: v })} />
                <button onClick={() => setItem(i, null)} className="rounded p-1 text-ink-3 hover:bg-hover" aria-label={t("filter.removeRule")}><X size={13} /></button>
              </div>
            );
          })()}
        </div>
      ))}
      <div className="mt-1 flex items-center gap-1">
        <button onClick={() => onChange({ ...group, items: [...group.items, newRule()] })} className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[13px] text-ink-2 hover:bg-hover" data-testid="filter-add-rule"><Plus size={13} />{t("filter.addRule")}</button>
        {depth === 0 && <button onClick={() => onChange({ ...group, items: [...group.items, { kind: "group", id: uid(), conj: "or", items: [newRule()] }] })} className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[13px] text-ink-2 hover:bg-hover" data-testid="filter-add-group"><Plus size={13} />{t("filter.addGroup")}</button>}
        {onRemove && <button onClick={onRemove} className="ml-auto rounded p-1 text-ink-3 hover:bg-hover" aria-label={t("common.delete")}><Trash2 size={13} /></button>}
      </div>
    </div>
  );
}

/** Chip "Filter": lista de atributos pesquisável e, depois, editor de regras com grupos E/OU. */
export function FilterPopover({ attrs, filter, onChange, objectName }: { attrs: Attr[]; filter: FilterGroup; onChange: (f: FilterGroup) => void; objectName: string }) {
  const { t } = useI18n();
  const n = countRules(filter);
  return (
    <Popover width={n > 0 ? 560 : 260} trigger={(open, toggle) => (
      <button onClick={toggle} data-testid="filter-chip" className={clsx("flex h-7 items-center gap-1.5 rounded-lg px-2 text-[13px]", n > 0 ? "border border-[#c9dafc] bg-[#eef4ff] font-medium text-[#1d5bd8]" : "border border-dashed border-[#d9dadf] bg-[#fbfbfb] text-ink-3 hover:bg-hover hover:text-ink-2", open && n === 0 && "bg-hover")}>
        <ListFilter size={13} />{n > 0 ? t("filter.n", { n }) : t("common.filter")}
      </button>
    )}>
      {() => n === 0 ? (
        <div data-testid="filter-popover">
          <AttrSearchList attrs={attrs} placeholder={t("filter.search", { object: objectName.toLowerCase() })}
            onPick={(a) => onChange({ ...filter, items: [{ kind: "rule", id: uid(), slug: a.slug, op: opsFor(a)[0], value: "" }] })} />
        </div>
      ) : (
        <div className="p-2" data-testid="filter-popover">
          <GroupEditor group={filter} attrs={attrs} depth={0} onChange={onChange} />
          <div className="-mx-2 mt-2 flex justify-between border-t px-2 pt-2">
            <span className="text-[12px] text-ink-3">{t("filter.advanced")}</span>
            <button onClick={() => onChange({ ...filter, items: [] })} className="text-[12.5px] text-ink-2 hover:text-ink">{t("filter.clear")}</button>
          </div>
        </div>
      )}
    </Popover>
  );
}
