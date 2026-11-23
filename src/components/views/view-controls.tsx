"use client";
import { useRef, useState } from "react";
import clsx from "clsx";
import { ChevronDown, Download, Eye, EyeOff, GripVertical, Kanban, LayoutGrid, Plus, Search, SlidersHorizontal, Upload, EllipsisVertical, ChevronRight } from "lucide-react";
import type { Attr, ObjectLite, ViewLite } from "@/lib/types";
import { useI18n } from "@/i18n/client";
import { Button, Field, MenuItem, Modal, Popover, ToolButton, inputCls } from "../ui";
import { AttrIcon } from "../attr-icon";
import { parseCsv } from "./engine";

export function ViewTypeIcon({ type, size = 14 }: { type: "table" | "kanban"; size?: number }) {
  return type === "kanban"
    ? <span className="inline-flex items-center justify-center rounded-[4px] bg-[#f2802d]" style={{ width: size, height: size }}><Kanban size={size * 0.7} color="#fff" strokeWidth={2.5} /></span>
    : <span className="inline-flex items-center justify-center rounded-[4px] bg-[#2bb56a]" style={{ width: size, height: size }}><LayoutGrid size={size * 0.7} color="#fff" strokeWidth={2.5} /></span>;
}

/** Seletor de visualizações salvas (buscar, renomear, duplicar, excluir, criar). */
export function ViewMenu({ views, current, onSelect, onCreate, onRename, onDuplicate, onDelete }: {
  views: ViewLite[]; current: ViewLite; onSelect: (id: string) => void; onCreate: () => void;
  onRename: (v: ViewLite) => void; onDuplicate: (v: ViewLite) => void; onDelete: (v: ViewLite) => void;
}) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState<string | null>(null);
  const list = views.filter((v) => v.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Popover width={280} trigger={(open, toggle) => (
      <ToolButton onClick={toggle} active={open} data-testid="view-menu"><ViewTypeIcon type={current.type} /><span>{current.name}</span><ChevronDown size={13} className="text-ink-3" /></ToolButton>
    )}>
      {(close) => (
        <div data-testid="view-menu-popover">
          <div className="flex items-center gap-1.5 border-b px-2 pb-1.5 pt-1">
            <Search size={13} className="text-ink-3" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("view.search")} className="w-full bg-transparent text-[13px] outline-none placeholder:text-ink-3" />
          </div>
          <div className="pt-1">
            {list.map((v) => (
              <div key={v.id} className={clsx("group relative flex items-center rounded-md hover:bg-hover", v.id === current.id && "bg-hover")}>
                <button onClick={() => { onSelect(v.id); close(); }} className={clsx("flex flex-1 items-center gap-2 px-2 py-1.5 text-left text-[13px]", v.id === current.id && "text-[#266df0]")}>
                  <ViewTypeIcon type={v.type} />{v.name}
                </button>
                <button onClick={() => setMenu(menu === v.id ? null : v.id)} className="mr-1 rounded p-0.5 text-ink-3 hover:bg-[#e8e9ec]" aria-label="View options"><EllipsisVertical size={13} /></button>
                {menu === v.id && (
                  <div className="absolute right-0 top-full z-50 w-40 rounded-lg border border-line-2 bg-white p-1 shadow-lg">
                    <MenuItem onClick={() => { setMenu(null); close(); onRename(v); }}>{t("common.rename")}</MenuItem>
                    <MenuItem onClick={() => { setMenu(null); close(); onDuplicate(v); }}>{t("common.duplicate")}</MenuItem>
                    <MenuItem danger onClick={() => { setMenu(null); close(); onDelete(v); }}>{t("common.delete")}</MenuItem>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-1 border-t pt-1"><MenuItem onClick={() => { close(); onCreate(); }}><Plus size={13} />{t("view.create")}</MenuItem></div>
        </div>
      )}
    </Popover>
  );
}

export function NewViewModal({ attrs, initialName, onClose, onSave }: { attrs: Attr[]; initialName: string; onClose: () => void; onSave: (name: string, type: "table" | "kanban", groupBy?: string) => void }) {
  const { t } = useI18n();
  const groupable = attrs.filter((a) => a.type === "status" || a.type === "select");
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<"table" | "kanban">("table");
  const [groupBy, setGroupBy] = useState(groupable[0]?.slug ?? "");
  return (
    <Modal title={t("view.create")} onClose={onClose} width={420}>
      <Field label={t("view.name")}><input autoFocus className={inputCls} value={name} onChange={(e) => setName(e.target.value)} data-testid="view-name" /></Field>
      <Field label={t("view.type")}>
        <div className="grid grid-cols-2 gap-2">
          {(["table", "kanban"] as const).filter((x) => x === "table" || groupable.length > 0).map((x) => (
            <button key={x} type="button" onClick={() => setType(x)} className={clsx("flex h-9 items-center gap-2 rounded-lg border px-2 text-[13px]", type === x ? "border-[#9dbcf8] bg-[#f2f6fe]" : "border-line-2 hover:bg-hover")} data-testid={`view-type-${x}`}>
              <ViewTypeIcon type={x} />{t(x === "table" ? "view.table" : "view.kanban")}
            </button>
          ))}
        </div>
      </Field>
      {type === "kanban" && (
        <Field label={t("view.groupBy")}>
          <select className={inputCls} value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>{groupable.map((a) => <option key={a.id} value={a.slug}>{a.name}</option>)}</select>
        </Field>
      )}
      <div className="flex justify-end gap-2"><Button onClick={onClose}>{t("common.cancel")}</Button><Button variant="primary" onClick={() => name.trim() && onSave(name.trim(), type, type === "kanban" ? groupBy : undefined)} data-testid="view-save">{t("common.create")}</Button></div>
    </Modal>
  );
}

/** "View settings": colunas visíveis (arrastar para reordenar, ocultar) e adicionar atributo. */
export function ViewSettings({ attrs, columns, onChange, onNewAttribute, kanban, cardFields, onCardFields }: {
  attrs: Attr[]; columns: string[]; onChange: (cols: string[]) => void; onNewAttribute: () => void;
  kanban?: boolean; cardFields?: string[]; onCardFields?: (f: string[]) => void;
}) {
  const { t } = useI18n();
  const [drag, setDrag] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const shown = kanban ? cardFields ?? [] : columns;
  const set = kanban ? onCardFields! : onChange;
  const visible = shown.map((s) => attrs.find((a) => a.slug === s)).filter(Boolean) as Attr[];
  const hidden = attrs.filter((a) => !a.isPrimary && !shown.includes(a.slug));
  return (
    <Popover width={280} trigger={(open, toggle) => (
      <ToolButton onClick={toggle} active={open} data-testid="view-settings"><SlidersHorizontal size={13} className="text-ink-2" />{t("common.viewSettings")}<ChevronDown size={13} className="text-ink-3" /></ToolButton>
    )}>
      {() => (
        <div data-testid="view-settings-popover">
          {visible.map((a, i) => (
            <div key={a.id} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (drag === null || drag === i) return; const n = [...shown]; const [m] = n.splice(drag, 1); n.splice(i, 0, m); set(n); setDrag(null); }}
              className="group flex h-[30px] items-center gap-1.5 rounded-md px-1.5 text-[13px] hover:bg-hover" data-testid="column-row">
              <GripVertical size={13} className="cursor-grab text-ink-3" />
              <AttrIcon type={a.type} slug={a.slug} size={13} />
              <span className="flex-1 truncate">{a.name}</span>
              <button onClick={() => set(shown.filter((s) => s !== a.slug))} title={t("view.hide")} className="rounded p-0.5 text-ink-3 opacity-0 hover:bg-[#e8e9ec] group-hover:opacity-100" data-testid="column-hide"><EyeOff size={13} /></button>
            </div>
          ))}
          <div className="mt-1 border-t pt-1">
            <MenuItem onClick={() => setAdding(!adding)}><Plus size={13} /><span className="flex-1">{t("view.addAttribute")}</span><ChevronRight size={13} className={clsx("text-ink-3 transition-transform", adding && "rotate-90")} /></MenuItem>
            {adding && (
              <div className="scroll-thin max-h-56 overflow-auto pl-2">
                {hidden.length === 0 && <div className="px-2 py-1.5 text-[12.5px] text-ink-3">{t("view.allHidden")}</div>}
                {hidden.map((a) => (
                  <MenuItem key={a.id} onClick={() => set([...shown, a.slug])}><Eye size={13} className="text-ink-3" /><AttrIcon type={a.type} slug={a.slug} size={13} />{a.name}</MenuItem>
                ))}
                <MenuItem onClick={onNewAttribute}><Plus size={13} />{t("view.createAttribute")}</MenuItem>
              </div>
            )}
          </div>
        </div>
      )}
    </Popover>
  );
}

export function ImportExportMenu({ onImport, onExport }: { onImport: () => void; onExport: () => void }) {
  const { t } = useI18n();
  return (
    <Popover width={180} align="right" trigger={(open, toggle) => (
      <ToolButton onClick={toggle} active={open} data-testid="import-export"><Download size={13} className="rotate-180 text-ink-2" />{t("obj.importExport")}<ChevronDown size={13} className="text-ink-3" /></ToolButton>
    )}>
      {(close) => (
        <>
          <MenuItem onClick={() => { close(); onImport(); }}><Upload size={13} className="text-ink-2" />{t("obj.importCsv")}</MenuItem>
          <MenuItem onClick={() => { close(); onExport(); }}><Download size={13} className="text-ink-2" />{t("obj.exportCsv")}</MenuItem>
        </>
      )}
    </Popover>
  );
}

const simplify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Importação CSV: escolher arquivo → relacionar colunas → importar. */
export function ImportModal({ object, attrs, onClose, onImport }: { object: ObjectLite; attrs: Attr[]; onClose: () => void; onImport: (rows: Record<string, string>[]) => Promise<number> }) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<string[][] | null>(null);
  const [map, setMap] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const editable = attrs.filter((a) => !a.config.readOnly);
  const primary = attrs.find((a) => a.isPrimary)!;

  const load = async (f: File) => {
    const data = parseCsv(await f.text());
    if (data.length < 2) { setErr(t("import.empty")); return; }
    setErr("");
    setRows(data);
    setMap(data[0].map((h) => editable.find((a) => simplify(a.name) === simplify(h) || simplify(a.slug) === simplify(h))?.slug ?? ""));
  };
  const run = async () => {
    if (!rows) return;
    if (!map.includes(primary.slug)) { setErr(t("import.needPrimary", { attr: primary.name })); return; }
    setBusy(true);
    try {
      const body = rows.slice(1).map((r) => Object.fromEntries(map.map((s, i) => [s, r[i] ?? ""]).filter(([s]) => s)));
      setDone(await onImport(body));
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <Modal title={t("import.title", { object: object.plural })} onClose={onClose} width={620}>
      {done !== null ? (
        <div className="py-6 text-center"><p className="text-[14px] font-medium" data-testid="import-done">{t("import.done", { n: done })}</p><Button className="mt-4" variant="primary" onClick={onClose}>{t("common.done")}</Button></div>
      ) : !rows ? (
        <button onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-line-2 py-10 text-[13px] hover:bg-hover">
          <Upload size={20} className="text-ink-3" /><span className="font-medium">{t("import.pick")}</span><span className="text-ink-3">{t("import.pickText")}</span>
        </button>
      ) : (
        <div>
          <p className="mb-2 text-[13px] font-medium">{t("import.map")}</p>
          <div className="scroll-thin max-h-[50vh] overflow-auto rounded-lg border">
            <table className="w-full text-[13px]">
              <thead className="bg-[#fafafb] text-left text-ink-2"><tr><th className="px-2 py-1.5 font-medium">{t("import.column")}</th><th className="px-2 py-1.5 font-medium">{t("import.preview")}</th><th className="px-2 py-1.5 font-medium">{t("import.attribute")}</th></tr></thead>
              <tbody>
                {rows[0].map((h, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1.5 font-medium">{h}</td>
                    <td className="max-w-[160px] truncate px-2 py-1.5 text-ink-2">{rows[1]?.[i]}</td>
                    <td className="px-2 py-1">
                      <select className={inputCls} value={map[i]} onChange={(e) => setMap(map.map((m, j) => (j === i ? e.target.value : m)))} data-testid="import-map">
                        <option value="">{t("import.skip")}</option>
                        {editable.map((a) => <option key={a.id} value={a.slug}>{a.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex justify-end gap-2"><Button onClick={onClose}>{t("common.cancel")}</Button><Button variant="primary" disabled={busy} onClick={run} data-testid="import-run">{t("import.run", { n: rows.length - 1 })}</Button></div>
        </div>
      )}
      {err && <p className="mt-2 text-[12px] text-red-600">{err}</p>}
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" data-testid="import-file" onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
    </Modal>
  );
}
