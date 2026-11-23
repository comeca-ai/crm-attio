"use client";
import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { EllipsisVertical, Plus } from "lucide-react";
import type { Attr, ObjectLite, RecordLite } from "@/lib/types";
import { TAG_COLORS, recordName } from "@/lib/format";
import { useI18n } from "@/i18n/client";
import { inputCls } from "../ui";
import { ValueDisplay } from "../values";
import { AttrIcon } from "../attr-icon";
import { RecordIcon } from "./table";

export function KanbanBoard({ object, attrs, records, groupAttr, cardFields, onMove, onCreate, onAddStage }: {
  object: ObjectLite; attrs: Attr[]; records: RecordLite[]; groupAttr: Attr; cardFields: string[];
  onMove: (id: string, stage: string | null) => void; onCreate: (name: string, stage: string | null) => Promise<void>; onAddStage: (label: string) => void;
}) {
  const { t } = useI18n();
  const [over, setOver] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [stage, setStage] = useState<string | null>(null);
  const fields = cardFields.map((s) => attrs.find((a) => a.slug === s)).filter(Boolean) as Attr[];
  const hasNone = records.some((r) => !r.values[groupAttr.slug]);
  const cols = [...(groupAttr.options ?? []), ...(hasNone ? [{ id: "__none", label: t("kanban.noStage"), color: "gray" }] : [])];

  return (
    <div className="scroll-thin flex min-h-0 flex-1 items-start gap-2.5 overflow-auto px-3 pb-3 pt-2.5" data-testid="kanban">
      {cols.map((c) => {
        const items = records.filter((r) => (c.id === "__none" ? !r.values[groupAttr.slug] : r.values[groupAttr.slug] === c.id));
        return (
          <div key={c.id} data-testid={`kanban-col-${c.id}`}
            onDragOver={(e) => { e.preventDefault(); setOver(c.id); }} onDragLeave={() => setOver(null)}
            onDrop={(e) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData("text/plain"); if (id) onMove(id, c.id === "__none" ? null : c.id); }}
            className={clsx("flex w-[262px] shrink-0 flex-col self-start rounded-xl border border-transparent bg-[#fafafb] p-1.5", over === c.id && "border-[#c6d8fc] bg-[#f3f7ff]")}>
            <div className="flex h-8 items-center gap-2 px-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: (TAG_COLORS[c.color] ?? TAG_COLORS.gray).dot }} />
              <span className="truncate text-[13px] font-semibold">{c.label}</span>
              <span className="rounded bg-[#efeff1] px-1 text-[11px] font-medium text-ink-2">{items.length}</span>
              <span className="ml-auto flex items-center text-ink-3">
                <button onClick={() => setAdding(c.id)} className="rounded p-0.5 hover:bg-[#ececef]" aria-label={object.newLabel}><Plus size={13} /></button>
                <button className="rounded p-0.5 hover:bg-[#ececef]" aria-label="More"><EllipsisVertical size={13} /></button>
              </span>
            </div>
            <div className="mt-1 flex flex-col gap-1.5">
              {items.map((r) => {
                const name = recordName(r.values, attrs, t("common.noName"));
                return (
                  <div key={r.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", r.id); e.dataTransfer.effectAllowed = "move"; }}
                    className="cursor-grab rounded-lg border border-line-2 bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-[#d5d6da]" data-testid="kanban-card">
                    <Link href={`/objects/${object.slug}/${r.id}`} draggable={false} className="mb-1.5 flex items-center gap-2 text-[13px] font-medium hover:underline">
                      <RecordIcon object={object} name={name} values={r.values} size={16} /><span className="truncate">{name}</span>
                    </Link>
                    <div className="space-y-1">
                      {fields.map((a) => (r.values[a.slug] ? (
                        <div key={a.id} className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-ink-2"><AttrIcon type={a.type} slug={a.slug} size={12} /><ValueDisplay attr={a} value={r.values[a.slug]} /></div>
                      ) : null))}
                    </div>
                  </div>
                );
              })}
              {adding === c.id ? (
                <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                  onBlur={() => { setAdding(null); setNewName(""); }}
                  onKeyDown={async (e) => {
                    if (e.key === "Escape") { setAdding(null); setNewName(""); }
                    if (e.key === "Enter" && newName.trim()) { await onCreate(newName.trim(), c.id === "__none" ? null : c.id); setNewName(""); setAdding(null); }
                  }}
                  placeholder={t("kanban.namePh")} className={inputCls} data-testid="kanban-new-input" />
              ) : (
                <button onClick={() => setAdding(c.id)} className="flex h-7 w-full items-center justify-center gap-1.5 rounded-lg bg-[#f1f1f3] text-[12.5px] text-ink-2 hover:bg-[#eaeaed] hover:text-ink"><Plus size={13} />{object.newLabel}</button>
              )}
            </div>
          </div>
        );
      })}
      {stage === null ? (
        <button onClick={() => setStage("")} title={t("kanban.addStage")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line-2 text-ink-2 hover:bg-hover" data-testid="kanban-add-stage"><Plus size={14} /></button>
      ) : (
        <input autoFocus value={stage} onChange={(e) => setStage(e.target.value)} onBlur={() => setStage(null)} placeholder={t("kanban.stageName")}
          onKeyDown={(e) => { if (e.key === "Escape") setStage(null); if (e.key === "Enter" && stage.trim()) { onAddStage(stage.trim()); setStage(null); } }}
          className={clsx(inputCls, "w-[200px] shrink-0")} />
      )}
    </div>
  );
}
