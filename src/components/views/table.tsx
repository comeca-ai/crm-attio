"use client";
import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowDown, ArrowUp, Check, EyeOff, Plus, Trash2 } from "lucide-react";
import type { Attr, Calc, ObjectLite, RecordLite, SortRule } from "@/lib/types";
import { recordName } from "@/lib/format";
import { useI18n } from "@/i18n/client";
import type { MessageKey } from "@/i18n/dict";
import { Avatar, CompanyLogo, MenuItem, ObjectIcon, Popover } from "../ui";
import { ValueDisplay, ValueEditor } from "../values";
import { AttrIcon } from "../attr-icon";
import { calcValue, calcsFor } from "./engine";

export const colWidth = (a: Attr) => (a.isPrimary ? 220 : a.slug === "description" ? 252 : a.type === "relation" || a.type === "multiselect" ? 200 : 160);

export function RecordIcon({ object, name, values, size = 16 }: { object: ObjectLite; name: string; values: Record<string, unknown>; size?: number }) {
  if (object.slug === "companies") return <CompanyLogo name={name} domain={typeof values.domains === "string" ? values.domains : undefined} size={size} />;
  if (object.slug === "people") return <Avatar name={name} size={size} />;
  return <ObjectIcon icon={object.icon} color={object.color} size={size} solid />;
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onChange(); }} aria-label={label} className={clsx("flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[4px] border", checked ? "border-[#266df0] bg-[#266df0] text-white" : "border-[#d5d6da] bg-white hover:border-ink-3")}>
      {checked && <Check size={10} strokeWidth={3} />}
    </button>
  );
}

function HeaderCell({ attr, sorts, onSort, onHide, onDelete }: { attr: Attr; sorts: SortRule[]; onSort: (dir: "asc" | "desc") => void; onHide: () => void; onDelete?: () => void }) {
  const { t } = useI18n();
  const s = sorts.find((x) => x.slug === attr.slug);
  return (
    <Popover width={200} trigger={(_o, toggle) => (
      <button onClick={toggle} className="flex h-[33px] w-full min-w-0 items-center gap-1.5 px-2.5 text-[13px] font-medium text-ink hover:bg-hover" data-testid={`col-${attr.slug}`}>
        <AttrIcon type={attr.type} slug={attr.slug} size={13} />
        <span className="truncate">{attr.name}</span>
        {s && (s.dir === "asc" ? <ArrowUp size={12} className="text-ink-3" /> : <ArrowDown size={12} className="text-ink-3" />)}
      </button>
    )}>
      {(close) => (
        <>
          <MenuItem onClick={() => { onSort("asc"); close(); }}><ArrowUp size={14} className="text-ink-3" />{t("sort.sortAsc")}</MenuItem>
          <MenuItem onClick={() => { onSort("desc"); close(); }}><ArrowDown size={14} className="text-ink-3" />{t("sort.sortDesc")}</MenuItem>
          <MenuItem onClick={() => { onHide(); close(); }}><EyeOff size={14} className="text-ink-3" />{t("view.hide")}</MenuItem>
          {onDelete && (<><div className="my-1 border-t" /><MenuItem danger onClick={() => { close(); onDelete(); }}><Trash2 size={14} />{t("attr.delete")}</MenuItem></>)}
        </>
      )}
    </Popover>
  );
}

function CalcCell({ attr, calc, rows, onChange, first }: { attr: Attr; calc?: Calc; rows: RecordLite[]; onChange: (c: Calc) => void; first?: boolean }) {
  const { t, locale } = useI18n();
  return (
    <Popover width={180} trigger={(_o, toggle) => (
      <button onClick={toggle} className={clsx("group flex h-[33px] w-full items-center justify-end gap-1 px-2.5 text-[12.5px] hover:bg-hover", calc && calc !== "none" ? "text-ink" : "text-ink-3")} data-testid={`calc-${attr.slug}`}>
        {first && (!calc || calc === "none" || calc === "count") ? (
          <><span className="font-medium text-ink">{rows.length}</span><span className="text-ink-3">{t("common.count")}</span></>
        ) : calc && calc !== "none" ? (
          <><span className="text-ink-3">{t(`calc.${calc}` as MessageKey)}</span><span className="font-medium">{calcValue(calc, attr, rows, locale)}</span></>
        ) : (
          <span className="flex items-center gap-1"><Plus size={12} />{t("obj.addCalculation")}</span>
        )}
      </button>
    )}>
      {(close) => (
        <>
          {(["none", ...calcsFor(attr)] as Calc[]).map((c) => (
            <MenuItem key={c} active={calc === c} onClick={() => { onChange(c); close(); }}>{t(`calc.${c}` as MessageKey)}</MenuItem>
          ))}
        </>
      )}
    </Popover>
  );
}

export function RecordTable({ object, attrs, columns, rows, sorts, calcs, selected, onToggle, onToggleAll, onUpdate, onSort, onHide, onCalc, onDeleteAttr, addColumn, onNew, footer }: {
  object: ObjectLite; attrs: Attr[]; columns: Attr[]; rows: RecordLite[]; sorts: SortRule[]; calcs: Record<string, Calc>;
  selected: Set<string>; onToggle: (id: string) => void; onToggleAll: () => void;
  onUpdate: (id: string, slug: string, v: unknown) => void; onSort: (slug: string, dir: "asc" | "desc") => void; onHide: (slug: string) => void;
  onCalc: (slug: string, c: Calc) => void; onDeleteAttr: (a: Attr) => void; addColumn: React.ReactNode; onNew: () => void; footer?: React.ReactNode;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState<{ id: string; slug: string } | null>(null);
  const primary = attrs.find((a) => a.isPrimary)!;
  const all = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const stickyFirst = "sticky left-0 z-10 bg-white";
  return (
    <div className="scroll-thin min-h-0 flex-1 overflow-auto" data-testid="record-table">
      <table className="border-separate border-spacing-0 text-[13px]" style={{ tableLayout: "fixed", width: 220 + 150 + columns.reduce((s, a) => s + colWidth(a), 0) }}>
        <colgroup>
          <col style={{ width: 220 }} />
          {columns.map((a) => <col key={a.id} style={{ width: colWidth(a) }} />)}
          <col style={{ width: 150 }} />
        </colgroup>
        <thead className="sticky top-0 z-20 bg-white">
          <tr>
            <th className={clsx(stickyFirst, "z-30 border-b border-r border-line p-0 text-left font-medium")}>
              <div className="flex h-[33px] items-center gap-2.5 pl-3 pr-1.5">
                <Checkbox checked={all} onChange={onToggleAll} label="Select all" />
                <span className="flex-1 truncate text-[13px] font-medium">{object.singular}</span>
                <button onClick={onNew} className="rounded p-0.5 text-ink-3 hover:bg-hover hover:text-ink" aria-label={object.newLabel}><Plus size={14} /></button>
              </div>
            </th>
            {columns.map((a) => (
              <th key={a.id} className="border-b border-r border-line p-0 text-left font-medium">
                <HeaderCell attr={a} sorts={sorts} onSort={(d) => onSort(a.slug, d)} onHide={() => onHide(a.slug)} onDelete={!a.isSystem ? () => onDeleteAttr(a) : undefined} />
              </th>
            ))}
            <th className="border-b border-line p-0 text-left font-normal">{addColumn}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const name = recordName(r.values, attrs, t("common.noName"));
            const sel = selected.has(r.id);
            return (
              <tr key={r.id} className={clsx("group", sel ? "[&>td]:bg-[#f5f8ff]" : "hover:[&>td]:bg-[#fafafb]")} data-testid="record-row">
                <td className={clsx(stickyFirst, "h-[31px] border-b border-r border-line p-0")}>
                  <div className="flex h-[31px] items-center gap-2.5 pl-3 pr-2">
                    <Checkbox checked={sel} onChange={() => onToggle(r.id)} label="Select" />
                    <Link href={`/objects/${object.slug}/${r.id}`} className="flex min-w-0 items-center gap-2 hover:underline">
                      <RecordIcon object={object} name={name} values={r.values} />
                      <span className="truncate">{name}</span>
                    </Link>
                  </div>
                </td>
                {columns.map((a) => {
                  const isEd = editing?.id === r.id && editing.slug === a.slug;
                  const ro = !!a.config.readOnly;
                  return (
                    <td key={a.id} className={clsx("relative h-[31px] border-b border-r border-line p-0", !ro && "cursor-pointer")}
                      onClick={() => !ro && !isEd && setEditing({ id: r.id, slug: a.slug })} data-testid={`cell-${a.slug}`}>
                      <div className={clsx("flex h-[31px] min-w-0 items-center overflow-hidden px-2.5", (a.type === "number" || a.type === "currency") && "justify-end")}>
                        <ValueDisplay attr={a} value={r.values[a.slug]} />
                      </div>
                      {isEd && (
                        <ValueEditor attr={a} value={r.values[a.slug]} onCancel={() => setEditing(null)}
                          onDone={(v) => { setEditing(null); onUpdate(r.id, a.slug, v); }} />
                      )}
                    </td>
                  );
                })}
                <td className="border-b border-line" />
              </tr>
            );
          })}
          <tr>
            <td className={clsx(stickyFirst, "border-b border-r border-line p-0")}><CalcCell first attr={primary} calc={calcs[primary.slug]} rows={rows} onChange={(c) => onCalc(primary.slug, c)} /></td>
            {columns.map((a) => <td key={a.id} className="border-b border-r border-line p-0"><CalcCell attr={a} calc={calcs[a.slug]} rows={rows} onChange={(c) => onCalc(a.slug, c)} /></td>)}
            <td className="border-b border-line" />
          </tr>
        </tbody>
      </table>
      {footer}
    </div>
  );
}
