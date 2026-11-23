"use client";
import { SyncInboxBanner } from "./sync-banner";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, X, ListMinus } from "lucide-react";
import type { Attr, Calc, ObjectLite, RecordLite, SortRule, ViewConfig, ViewLite } from "@/lib/types";
import { COLOR_KEYS } from "@/lib/format";
import { useI18n } from "@/i18n/client";
import { useCrm } from "./crm-context";
import { Button, Field, Modal, ObjectIcon, Popover, MenuItem, api, inputCls, useSynced } from "./ui";
import { TopBar, Crumb } from "./topbar";
import { AddAttributeModal } from "./add-attribute";
import { EmptyState, LearnMore } from "./empty-state";
import { AttrIcon } from "./attr-icon";
import { matchGroup, sortRecords, toCsv, type Ctx } from "./views/engine";
import { FilterPopover, SortPopover } from "./views/sort-filter";
import { ImportExportMenu, ImportModal, NewViewModal, ViewMenu, ViewSettings } from "./views/view-controls";
import { RecordTable } from "./views/table";
import { KanbanBoard } from "./views/kanban";

type Props = {
  object: ObjectLite; attrs: Attr[]; records: RecordLite[]; views: ViewLite[]; initialViewId?: string;
  list?: { id: string; name: string };
};

export function ObjectView({ object, attrs, records: initial, views: initialViews, initialViewId, list }: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { users, relIndex, relOptions } = useCrm();
  const [records, setRecords] = useSynced(initial);
  const [views, setViews] = useSynced(initialViews);
  const [viewId, setViewId] = useState(initialViewId && initialViews.some((v) => v.id === initialViewId) ? initialViewId : initialViews[0]?.id);
  const view = views.find((v) => v.id === viewId) ?? views[0];
  const cfg = view.config;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<null | "attr" | "import" | "newView" | "newRecord" | "addToList">(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctx: Ctx = { users, rel: relIndex, attrs };

  /** Atualiza a configuração da visualização e salva (com pequeno atraso). */
  const setCfg = (patch: Partial<ViewConfig>) => {
    const next = { ...cfg, ...patch };
    setViews(views.map((v) => (v.id === view.id ? { ...v, config: next } : v)));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { api(`/api/views/${view.id}`, "PATCH", { config: next }).catch(() => null); }, 250);
  };
  const selectView = (id: string) => {
    setViewId(id);
    setSelected(new Set());
    const u = new URL(location.href);
    u.searchParams.set("view", id);
    history.replaceState(null, "", u);
  };

  const columns = cfg.columns.map((s) => attrs.find((a) => a.slug === s)).filter((a): a is Attr => !!a && !a.isPrimary);
  const rows = useMemo(() => sortRecords(records.filter((r) => matchGroup(cfg.filter, r, ctx)), cfg.sorts, ctx, locale),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [records, cfg.filter, cfg.sorts, users, relIndex, attrs, locale]);
  const groupAttr = view.type === "kanban" ? attrs.find((a) => a.slug === cfg.groupBy) ?? attrs.find((a) => a.type === "status") : undefined;
  const primary = attrs.find((a) => a.isPrimary)!;

  const update = async (id: string, slug: string, v: unknown) => {
    setRecords(records.map((r) => (r.id === id ? { ...r, values: { ...r.values, [slug]: v } } : r)));
    await api(`/api/records/${id}`, "PATCH", { values: { [slug]: v } });
    if (attrs.find((a) => a.slug === slug)?.type === "relation" || slug === primary.slug) router.refresh();
  };
  const create = async (values: Record<string, unknown>) => {
    const r = await api<RecordLite>(`/api/objects/${object.slug}/records`, "POST", { values, listId: list?.id });
    setRecords([...records, r]);
    router.refresh();
  };
  const nameValue = (name: string) => (primary.type === "personal-name" ? { first_name: name.split(" ")[0], last_name: name.split(" ").slice(1).join(" ") } : name);

  const exportCsv = () => {
    const cols = [primary, ...columns];
    const blob = new Blob(["\ufeff" + toCsv(cols, rows, ctx)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(list?.name ?? object.plural).toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
  };
  const deleteSelected = async () => {
    if (!confirm(t("obj.confirmDeleteMany", { n: selected.size }))) return;
    for (const id of selected) await api(`/api/records/${id}`, "DELETE");
    setRecords(records.filter((r) => !selected.has(r.id)));
    setSelected(new Set());
    router.refresh();
  };
  const removeSelectedFromList = async () => {
    if (!list) return;
    for (const id of selected) await api(`/api/lists/${list.id}/entries?recordId=${id}`, "DELETE");
    setRecords(records.filter((r) => !selected.has(r.id)));
    setSelected(new Set());
    router.refresh();
  };
  const createView = async (name: string, type: "table" | "kanban", groupBy?: string, base?: ViewConfig) => {
    const config: ViewConfig = base ?? { ...cfg, groupBy: groupBy ?? cfg.groupBy, cardFields: cfg.cardFields ?? cfg.columns.slice(0, 3) };
    const { id } = await api<{ id: string }>("/api/views", "POST", { objectId: object.id, listId: list?.id ?? null, name, type, config });
    setViews([...views, { id, name, type, config }]);
    selectView(id);
    setModal(null);
  };
  const renameView = async (v: ViewLite) => {
    const name = prompt(t("view.renamePrompt"), v.name)?.trim();
    if (!name) return;
    setViews(views.map((x) => (x.id === v.id ? { ...x, name } : x)));
    await api(`/api/views/${v.id}`, "PATCH", { name });
  };
  const deleteView = async (v: ViewLite) => {
    if (views.length <= 1) { alert(t("view.cantDeleteLast")); return; }
    if (!confirm(t("common.confirmDelete", { name: v.name }))) return;
    await api(`/api/views/${v.id}`, "DELETE");
    const rest = views.filter((x) => x.id !== v.id);
    setViews(rest);
    if (v.id === view.id) selectView(rest[0].id);
  };
  const addStage = async (label: string) => {
    if (!groupAttr) return;
    const existing = (groupAttr.options ?? []).map((o) => ({ ...o }));
    const id = `${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now().toString(36)}`;
    await api(`/api/attributes/${groupAttr.id}`, "PATCH", { options: [...existing, { id, label, color: COLOR_KEYS[existing.length % COLOR_KEYS.length] }] });
    router.refresh();
  };

  const hiddenAttrs = attrs.filter((a) => !a.isPrimary && !cfg.columns.includes(a.slug));
  const addColumn = (
    <Popover width={240} align="right" trigger={(_o, toggle) => (
      <button onClick={toggle} className="flex h-[33px] w-full items-center gap-1.5 px-2.5 text-[13px] text-ink-2 hover:bg-hover" data-testid="add-column"><Plus size={13} />{t("obj.addColumn")}</button>
    )}>
      {(close) => (
        <div className="scroll-thin max-h-72 overflow-auto">
          {hiddenAttrs.map((a) => <MenuItem key={a.id} onClick={() => { setCfg({ columns: [...cfg.columns, a.slug] }); close(); }}><AttrIcon type={a.type} slug={a.slug} size={13} />{a.name}</MenuItem>)}
          <div className="my-1 border-t" />
          <MenuItem onClick={() => { close(); setModal("attr"); }}><Plus size={13} />{t("view.createAttribute")}</MenuItem>
        </div>
      )}
    </Popover>
  );

  const objKey = ["companies", "people", "deals"].includes(object.slug) ? object.slug : null;
  const emptyTitle = list ? t("list.empty") : objKey === "deals" ? t("obj.deals.empty") : t("obj.noRecords");
  const emptyText = list ? t("list.emptyText") : objKey === "deals" ? t("obj.deals.emptyText") : t("obj.noRecordsText");
  const isEmpty = records.length === 0;

  return (
    <>
      <TopBar>
        {list ? (<><Crumb icon={<ObjectIcon icon="list" size={14} />}>{list.name}</Crumb></>) : <Crumb icon={<ObjectIcon icon={object.icon} color={object.color} size={16} solid />}>{object.plural}</Crumb>}
      </TopBar>
      <div className="flex h-[43px] shrink-0 items-center justify-between border-b border-line px-3">
        <div className="flex items-center gap-1.5">
          <ViewMenu views={views} current={view} onSelect={selectView} onCreate={() => setModal("newView")} onRename={renameView}
            onDuplicate={(v) => createView(t("view.copy", { name: v.name }), v.type, v.config.groupBy, v.config)} onDelete={deleteView} />
          <ViewSettings attrs={attrs} columns={cfg.columns} onChange={(columns) => setCfg({ columns })} onNewAttribute={() => setModal("attr")}
            kanban={view.type === "kanban"} cardFields={cfg.cardFields ?? []} onCardFields={(cardFields) => setCfg({ cardFields })} />
        </div>
        <div className="flex items-center gap-1.5">
          {list && <Button onClick={() => setModal("addToList")} className="h-7">{t("list.addRecord")}</Button>}
          <ImportExportMenu onImport={() => setModal("import")} onExport={exportCsv} />
          <Button variant="primary" className="h-7 px-2" onClick={() => setModal("newRecord")} data-testid="new-record"><Plus size={14} />{object.newLabel}</Button>
        </div>
      </div>
      <div className="flex h-[43px] shrink-0 items-center gap-1.5 border-b border-line px-3">
        <SortPopover attrs={attrs} sorts={cfg.sorts} onChange={(sorts: SortRule[]) => setCfg({ sorts })} />
        <span className="mx-0.5 h-4 w-px bg-line-2" />
        <FilterPopover attrs={attrs} filter={cfg.filter} onChange={(filter) => setCfg({ filter })} objectName={object.singular} />
      </div>

      {view.type === "kanban" && groupAttr ? (
        <KanbanBoard object={object} attrs={attrs} records={rows} groupAttr={groupAttr} cardFields={cfg.cardFields ?? []}
          onMove={(id, stage) => update(id, groupAttr.slug, stage)} onAddStage={addStage}
          onCreate={(name, stage) => create({ [primary.slug]: nameValue(name), [groupAttr.slug]: stage })} />
      ) : isEmpty ? (
        <>
          <RecordTable object={object} attrs={attrs} columns={columns} rows={[]} sorts={cfg.sorts} calcs={cfg.calcs} selected={selected}
            onToggle={() => null} onToggleAll={() => null} onUpdate={update} onSort={() => null} onHide={() => null}
            onCalc={() => null} onDeleteAttr={() => null} addColumn={addColumn} onNew={() => setModal("newRecord")} />
        </>
      ) : (
        <RecordTable object={object} attrs={attrs} columns={columns} rows={rows} sorts={cfg.sorts} calcs={cfg.calcs} selected={selected}
          onToggle={(id) => { const s = new Set(selected); if (s.has(id)) s.delete(id); else s.add(id); setSelected(s); }}
          onToggleAll={() => setSelected(rows.every((r) => selected.has(r.id)) ? new Set() : new Set(rows.map((r) => r.id)))}
          onUpdate={update}
          onSort={(slug, dir) => setCfg({ sorts: [{ slug, dir }, ...cfg.sorts.filter((s) => s.slug !== slug)] })}
          onHide={(slug) => setCfg({ columns: cfg.columns.filter((c) => c !== slug) })}
          onCalc={(slug, c: Calc) => setCfg({ calcs: { ...cfg.calcs, [slug]: c } })}
          onDeleteAttr={async (a) => { if (!confirm(t("attr.confirmDelete", { name: a.name }))) return; await api(`/api/attributes/${a.id}`, "DELETE"); router.refresh(); }}
          addColumn={addColumn} onNew={() => setModal("newRecord")} footer={["companies", "people"].includes(object.slug) ? <SyncInboxBanner /> : undefined} />
      )}

      {isEmpty && (
        <div className="absolute inset-x-0 bottom-0 top-[180px] flex flex-col" style={{ pointerEvents: "none" }}>
          <div className="flex flex-1 flex-col" style={{ pointerEvents: "auto" }}>
            <EmptyState title={emptyTitle} text={emptyText} action={<>
              <Button onClick={() => setModal("import")} className="h-7"><Upload size={13} />{t("obj.importCsv")}</Button>
              <Button variant="primary" className="h-7" onClick={() => setModal("newRecord")}><Plus size={14} />{object.newLabel}</Button>
            </>} />
            <LearnMore label={t("common.learnMore")} title={t("learn.records")} />
          </div>
        </div>
      )}
      {!isEmpty && rows.length === 0 && view.type === "table" && (
        <EmptyState className="flex flex-col items-center py-14 text-center" title={t("obj.noMatch")} text={t("obj.noMatchText")} action={<Button className="h-7" onClick={() => setCfg({ filter: { ...cfg.filter, items: [] } })}>{t("filter.clear")}</Button>} />
      )}

      {selected.size > 0 && (
        <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-line-2 bg-white px-3 py-2 text-[13px] shadow-[0_8px_24px_rgba(0,0,0,0.12)]" data-testid="bulk-bar">
          <span className="font-medium">{t("obj.selected", { n: selected.size })}</span>
          {list && <Button className="h-7" onClick={removeSelectedFromList}><ListMinus size={13} />{t("obj.removeFromList")}</Button>}
          <Button variant="danger" className="h-7" onClick={deleteSelected}><Trash2 size={13} />{t("obj.deleteSelected")}</Button>
          <button onClick={() => setSelected(new Set())} className="rounded p-1 text-ink-3 hover:bg-hover" aria-label={t("common.clear")}><X size={14} /></button>
        </div>
      )}

      {modal === "attr" && <AddAttributeModal objectSlug={object.slug} onClose={() => setModal(null)} onCreated={(a) => setCfg({ columns: [...cfg.columns, a.slug] })} />}
      {modal === "import" && (
        <ImportModal object={object} attrs={attrs} onClose={() => { setModal(null); router.refresh(); }}
          onImport={async (body) => (await api<{ imported: number }>(`/api/objects/${object.slug}/import`, "POST", { rows: body, listId: list?.id })).imported} />
      )}
      {modal === "newView" && <NewViewModal attrs={attrs} initialName={t("common.untitled")} onClose={() => setModal(null)} onSave={(n, ty, g) => createView(n, ty, g)} />}
      {modal === "newRecord" && <NewRecordModal object={object} primary={primary} onClose={() => setModal(null)} onCreate={async (v) => { await create({ [primary.slug]: v }); setModal(null); }} />}
      {modal === "addToList" && list && (
        <AddToListModal options={(relOptions[object.id] ?? []).filter((o) => !records.some((r) => r.id === o.id))} onClose={() => setModal(null)}
          onPick={async (id) => { await api(`/api/lists/${list.id}/entries`, "POST", { recordId: id }); setModal(null); router.refresh(); }} />
      )}
    </>
  );
}

function NewRecordModal({ object, primary, onClose, onCreate }: { object: ObjectLite; primary: Attr; onClose: () => void; onCreate: (v: unknown) => Promise<void> }) {
  const { t } = useI18n();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [busy, setBusy] = useState(false);
  const isName = primary.type === "personal-name";
  const submit = async () => {
    if (!first.trim()) return;
    setBusy(true);
    await onCreate(isName ? { first_name: first.trim(), last_name: last.trim() } : first.trim()).finally(() => setBusy(false));
  };
  return (
    <Modal title={t("cmd.create", { singular: object.singular })} onClose={onClose} width={440}>
      {isName ? (
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("attr.firstName")}><input autoFocus className={inputCls} value={first} onChange={(e) => setFirst(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} data-testid="new-record-name" /></Field>
          <Field label={t("attr.lastName")}><input className={inputCls} value={last} onChange={(e) => setLast(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></Field>
        </div>
      ) : (
        <Field label={primary.name}><input autoFocus className={inputCls} value={first} onChange={(e) => setFirst(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} data-testid="new-record-name" /></Field>
      )}
      <div className="flex justify-end gap-2"><Button onClick={onClose}>{t("common.cancel")}</Button><Button variant="primary" disabled={busy || !first.trim()} onClick={submit} data-testid="new-record-save">{t("common.create")}</Button></div>
    </Modal>
  );
}

function AddToListModal({ options, onClose, onPick }: { options: { id: string; name: string }[]; onClose: () => void; onPick: (id: string) => void }) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const list = options.filter((o) => o.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Modal title={t("list.addRecord")} onClose={onClose} width={420}>
      <input autoFocus className={inputCls} placeholder={t("attr.searchRecord")} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="scroll-thin mt-2 max-h-72 overflow-auto">
        {list.map((o) => <MenuItem key={o.id} onClick={() => onPick(o.id)}>{o.name}</MenuItem>)}
        {list.length === 0 && <p className="px-2 py-2 text-[13px] text-ink-3">{t("common.noResults")}</p>}
      </div>
    </Modal>
  );
}
