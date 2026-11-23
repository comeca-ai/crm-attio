"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { ArrowDownUp, ArrowDown, ArrowUp, Filter, KanbanSquare, Plus, Table2, Trash2, X, ChevronDown, Download, Upload, SlidersHorizontal, GripVertical, Eye, EyeOff, EyeOff as HideIcon } from "lucide-react";
import type { Attr, ObjectLite, RecordLite } from "@/lib/types";
import { fmtCurrency, optionFor, plainValue, primaryAttr, recordName } from "@/lib/format";
import { useCrm } from "./crm-context";
import { Avatar, Button, MenuItem, ObjectIcon, PageHeader, Popover, Tag, api, inputCls, useSynced } from "./ui";
import { ValueDisplay, ValueEditor } from "./values";
import { AttrIcon } from "./attr-icon";
import { AddAttributeModal } from "./add-attribute";
import { EmptyState } from "./empty-state";
import { objLabels } from "@/lib/labels";

type Sort = { slug: string; dir: "asc" | "desc" } | null;
type Op = "contains" | "is" | "empty" | "not_empty" | "gt" | "lt";
type FilterRule = { slug: string; op: Op; value: string };

const OPS: Record<Op, string> = { contains: "contém", is: "é", empty: "está vazio", not_empty: "não está vazio", gt: "maior que", lt: "menor que" };
function opsFor(a: Attr): Op[] {
  if (["select", "multiselect", "status", "user", "relation", "checkbox"].includes(a.type)) return ["is", "empty", "not_empty"];
  if (["number", "currency", "date"].includes(a.type)) return ["gt", "lt", "is", "empty", "not_empty"];
  return ["contains", "is", "empty", "not_empty"];
}

type Calc = "none" | "filled" | "empty" | "unique" | "sum" | "avg" | "min" | "max";
const CALC_LABEL: Record<Calc, string> = { none: "Nenhum", filled: "Preenchidos", empty: "Vazios", unique: "Únicos", sum: "Soma", avg: "Média", min: "Mínimo", max: "Máximo" };

function calcValue(calc: Calc, a: Attr, rows: RecordLite[]) {
  const vals = rows.map((r) => r.values[a.slug]);
  const filled = vals.filter((v) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0));
  const nums = filled.map(Number).filter((n) => !Number.isNaN(n));
  const money = (n: number) => (a.type === "currency" ? fmtCurrency(n) : n.toLocaleString("pt-BR", { maximumFractionDigits: 2 }));
  switch (calc) {
    case "filled": return String(filled.length);
    case "empty": return String(vals.length - filled.length);
    case "unique": return String(new Set(filled.map((v) => JSON.stringify(v))).size);
    case "sum": return money(nums.reduce((x, y) => x + y, 0));
    case "avg": return nums.length ? money(nums.reduce((x, y) => x + y, 0) / nums.length) : "—";
    case "min": return nums.length ? money(Math.min(...nums)) : "—";
    case "max": return nums.length ? money(Math.max(...nums)) : "—";
    default: return "";
  }
}

function toCsv(attrs: Attr[], rows: RecordLite[], users: ReturnType<typeof useCrm>["users"], rel: ReturnType<typeof useCrm>["relIndex"]) {
  const esc = (v: string) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const head = attrs.map((a) => esc(a.name)).join(",");
  const body = rows.map((r) => attrs.map((a) => esc(plainValue(a, r.values[a.slug], users, rel))).join(","));
  return [head, ...body].join("\n");
}

export function ObjectView({
  object, attrs, records: initial, listId, title, crumbs,
}: { object: ObjectLite; attrs: Attr[]; records: RecordLite[]; listId?: string; title?: string; crumbs?: React.ReactNode }) {
  const router = useRouter();
  const { users, relIndex } = useCrm();
  const labels = objLabels(object.slug);
  const [records, setRecords] = useSynced(initial);
  const statusAttr = attrs.find((a) => a.type === "status");
  const [view, setView] = useState<"table" | "kanban">(statusAttr && !listId ? "kanban" : "table");
  const [sort, setSort] = useState<Sort>(null);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [editing, setEditing] = useState<{ id: string; slug: string } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addAttr, setAddAttr] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [calcs, setCalcs] = useState<Record<string, Calc>>({});
  const primary = primaryAttr(attrs);

  // Ordem das colunas: primária sempre primeiro; novas colunas entram no fim
  const ordered = useMemo(() => {
    const rest = attrs.filter((a) => !a.isPrimary);
    const pos = (a: Attr) => { const i = order.indexOf(a.slug); return i === -1 ? 1000 + a.order : i; };
    return [primary, ...rest.sort((x, y) => pos(x) - pos(y))];
  }, [attrs, order, primary]);
  const cols = ordered.filter((a) => a.isPrimary || !hidden.has(a.slug));

  const rows = useMemo(() => {
    let out = records.filter((r) =>
      filters.every((f) => {
        const a = attrs.find((x) => x.slug === f.slug);
        if (!a) return true;
        const raw = r.values[a.slug];
        const txt = plainValue(a, raw, users, relIndex).toLowerCase();
        switch (f.op) {
          case "empty": return !txt;
          case "not_empty": return !!txt;
          case "contains": return txt.includes(f.value.toLowerCase());
          case "is":
            if (a.type === "multiselect") return Array.isArray(raw) && raw.includes(f.value);
            if (["select", "status", "user", "relation"].includes(a.type)) return raw === f.value;
            if (a.type === "checkbox") return String(!!raw) === f.value;
            return txt === f.value.toLowerCase();
          case "gt":
          case "lt": {
            if (raw === null || raw === undefined || raw === "" || f.value === "") return f.value === "";
            const cmp = a.type === "date" ? String(raw).localeCompare(f.value) : Number(raw) - Number(f.value);
            return f.op === "gt" ? cmp > 0 : cmp < 0;
          }
        }
      }),
    );
    if (sort) {
      const a = attrs.find((x) => x.slug === sort.slug);
      if (a) {
        out = [...out].sort((x, y) => {
          const vx = x.values[a.slug], vy = y.values[a.slug];
          let c: number;
          if (["number", "currency"].includes(a.type)) c = (Number(vx) || 0) - (Number(vy) || 0);
          else if (a.type === "status" || a.type === "select") {
            const ix = a.options?.findIndex((o) => o.id === vx) ?? -1, iy = a.options?.findIndex((o) => o.id === vy) ?? -1;
            c = ix - iy;
          } else c = plainValue(a, vx, users, relIndex).localeCompare(plainValue(a, vy, users, relIndex), "pt-BR");
          return sort.dir === "asc" ? c : -c;
        });
      }
    }
    return out;
  }, [records, filters, sort, attrs, users, relIndex]);

  const save = async (id: string, slug: string, value: unknown) => {
    setEditing(null);
    setRecords((rs) => rs.map((r) => (r.id === id ? { ...r, values: { ...r.values, [slug]: value } } : r)));
    await api(`/api/records/${id}`, "PATCH", { values: { [slug]: value } });
    router.refresh();
  };

  const createRecord = async (values: Record<string, unknown> = {}) => {
    const r = await api<RecordLite>(`/api/objects/${object.slug}/records`, "POST", { values, listId });
    setRecords((rs) => [...rs, r]);
    if (!values[primary.slug]) { setView("table"); setEditing({ id: r.id, slug: primary.slug }); }
    router.refresh();
    return r;
  };

  const deleteSelected = async () => {
    const ids = [...selected];
    if (!confirm(`Excluir ${ids.length} ${ids.length === 1 ? "registro" : "registros"}? Essa ação não pode ser desfeita.`)) return;
    setRecords((rs) => rs.filter((r) => !selected.has(r.id)));
    setSelected(new Set());
    if (listId) await Promise.all(ids.map((id) => api(`/api/lists/${listId}/entries?recordId=${id}`, "DELETE")));
    else await Promise.all(ids.map((id) => api(`/api/records/${id}`, "DELETE")));
    router.refresh();
  };

  const exportCsv = () => {
    const blob = new Blob(["\ufeff" + toCsv(cols, rows, users, relIndex)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(title ?? object.plural).toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
  };

  const viewLabel = view === "kanban" ? "Pipeline" : listId ? "Todas as entradas" : labels.all;

  return (
    <>
      <PageHeader title={title ?? object.plural} crumbs={crumbs} icon={<ObjectIcon icon={object.icon} color={object.color} size={16} solid />} />

      {/* Linha 1: visualização, configurações, importar/exportar, criar */}
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 px-3">
        <div className="flex items-center gap-1.5">
          <Popover
            width={220}
            trigger={(_, toggle) => (
              <button onClick={toggle} className="flex h-7 items-center gap-1.5 rounded-lg border border-line-2 px-2 text-[13px] font-medium shadow-[0_1px_1px_rgba(0,0,0,0.03)] hover:bg-hover">
                {view === "table" ? <Table2 size={14} className="text-[#22a06b]" /> : <KanbanSquare size={14} className="text-[#f97316]" />}
                {viewLabel}
                <ChevronDown size={13} className="text-ink-3" />
              </button>
            )}
          >
            {(close) => (
              <>
                <div className="px-2 pb-1 pt-1 text-[12px] font-medium text-ink-3">Visualizações</div>
                {statusAttr && <MenuItem active={view === "kanban"} onClick={() => { setView("kanban"); close(); }}><KanbanSquare size={14} className="text-[#f97316]" /> Pipeline</MenuItem>}
                <MenuItem active={view === "table"} onClick={() => { setView("table"); close(); }}><Table2 size={14} className="text-[#22a06b]" /> {listId ? "Todas as entradas" : labels.all}</MenuItem>
              </>
            )}
          </Popover>
          <ViewSettings ordered={ordered} hidden={hidden} setHidden={setHidden} setOrder={setOrder} onAddAttr={() => setAddAttr(true)} />
          {selected.size > 0 && (
            <Button variant="danger" className="h-7" onClick={deleteSelected}><Trash2 size={13} /> {listId ? "Remover da lista" : "Excluir"} ({selected.size})</Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Popover
            align="right"
            width={200}
            trigger={(_, toggle) => (
              <button onClick={toggle} className="flex h-7 items-center gap-1.5 rounded-lg border border-line-2 px-2 text-[13px] font-medium shadow-[0_1px_1px_rgba(0,0,0,0.03)] hover:bg-hover">
                <ArrowDownUp size={13} className="text-ink-2" /> Importar / Exportar <ChevronDown size={13} className="text-ink-3" />
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuItem onClick={() => { exportCsv(); close(); }}><Download size={14} className="text-ink-3" /> Exportar CSV</MenuItem>
                <MenuItem onClick={() => { close(); alert("Importação de CSV ainda não está disponível nesta versão."); }}><Upload size={14} className="text-ink-3" /> Importar CSV</MenuItem>
              </>
            )}
          </Popover>
          <Button variant="primary" className="h-7" onClick={() => createRecord()}><Plus size={14} /> {listId ? "Adicionar registro" : labels.new}</Button>
        </div>
      </div>

      {/* Linha 2: ordenação e filtros */}
      <div className="flex h-10 shrink-0 items-center gap-1.5 border-b px-3">
        <SortMenu attrs={attrs} sort={sort} setSort={setSort} />
        <FilterMenu attrs={attrs} filters={filters} setFilters={setFilters} />
        {filters.map((f, i) => {
          const a = attrs.find((x) => x.slug === f.slug)!;
          let shown = f.value;
          if (["select", "multiselect", "status"].includes(a.type)) shown = optionFor(a, f.value)?.label ?? "";
          if (a.type === "user") shown = users.find((u) => u.id === f.value)?.name ?? "";
          if (a.type === "relation") shown = relIndex[f.value]?.name ?? "";
          return (
            <span key={i} className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#c6d8fc] bg-[#f2f6fe] pl-2 pr-1 text-[12.5px]">
              <AttrIcon type={a.type} /> <b className="font-medium">{a.name}</b> <span className="text-ink-2">{OPS[f.op]}</span> {shown && <b className="font-medium">{shown}</b>}
              <button onClick={() => setFilters(filters.filter((_, j) => j !== i))} className="rounded p-0.5 text-ink-3 hover:bg-white" aria-label="Remover filtro"><X size={12} /></button>
            </span>
          );
        })}
        {filters.length > 0 && <button onClick={() => setFilters([])} className="text-[12.5px] text-ink-2 hover:text-ink">Limpar filtros</button>}
      </div>

      {records.length === 0 ? (
        <EmptyState
          title={labels.empty}
          text="Crie um registro para começar a usar esta visualização."
          action={<Button variant="primary" onClick={() => createRecord()}><Plus size={14} /> {labels.new}</Button>}
        />
      ) : view === "table" ? (
        <div className="scroll-thin relative min-h-0 flex-1 overflow-auto">
          <table className="border-separate border-spacing-0 text-[13px]">
            <thead className="sticky top-0 z-20 bg-white">
              <tr>
                <th className="sticky left-0 z-20 w-9 border-b border-r bg-white px-2">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todos"
                    checked={rows.length > 0 && selected.size === rows.length}
                    onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())}
                    className="h-3.5 w-3.5 accent-[#266df0]"
                  />
                </th>
                {cols.map((a) => (
                  <th key={a.id} className={clsx("h-9 border-b border-r bg-white px-0 text-left font-normal", a.isPrimary && "sticky left-9 z-20")}>
                    <HeaderCell attr={a} sort={sort} setSort={setSort} onHide={() => setHidden(new Set(hidden).add(a.slug))} />
                  </th>
                ))}
                <th className="h-9 border-b border-r bg-white px-1 text-left font-normal">
                  <button onClick={() => setAddAttr(true)} className="flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-[13px] text-ink-2 hover:bg-hover hover:text-ink"><Plus size={14} /> Adicionar coluna</button>
                </th>
                <th className="w-full border-b bg-white" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="group">
                  <td className={clsx("sticky left-0 z-10 border-b border-r px-2", selected.has(r.id) ? "bg-[#f2f6fe]" : "bg-white group-hover:bg-[#fafafa]")}>
                    <input
                      type="checkbox"
                      aria-label="Selecionar"
                      checked={selected.has(r.id)}
                      onChange={(e) => {
                        const s = new Set(selected);
                        if (e.target.checked) s.add(r.id); else s.delete(r.id);
                        setSelected(s);
                      }}
                      className="h-3.5 w-3.5 accent-[#266df0]"
                    />
                  </td>
                  {cols.map((a) => {
                    const isEditing = editing?.id === r.id && editing.slug === a.slug;
                    const right = a.type === "number" || a.type === "currency";
                    return (
                      <td
                        key={a.id}
                        onClick={() => !isEditing && setEditing({ id: r.id, slug: a.slug })}
                        className={clsx(
                          "relative h-9 max-w-[280px] cursor-default border-b border-r px-2.5",
                          a.isPrimary ? "sticky left-9 z-10 min-w-[220px]" : "min-w-[160px]",
                          selected.has(r.id) ? "bg-[#f2f6fe]" : "bg-white group-hover:bg-[#fafafa]",
                          isEditing && "z-30",
                        )}
                      >
                        {a.isPrimary ? (
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar name={recordName(r.values, attrs)} size={18} square={object.slug !== "people"} />
                            <Link href={`/objects/${object.slug}/${r.id}`} onClick={(e) => e.stopPropagation()} className="truncate font-medium hover:underline">
                              {recordName(r.values, attrs)}
                            </Link>
                          </div>
                        ) : (
                          <div className={clsx("flex min-w-0 items-center overflow-hidden whitespace-nowrap", right && "justify-end", (a.type === "url" || a.type === "email") && "text-[#266df0] [&_a]:text-[#266df0]")}><ValueDisplay attr={a} value={r.values[a.slug]} /></div>
                        )}
                        {isEditing && (
                          <ValueEditor attr={a} value={r.values[a.slug]} onDone={(v) => save(r.id, a.slug, v)} onCancel={() => setEditing(null)} />
                        )}
                      </td>
                    );
                  })}
                  <td className="border-b border-r" />
                  <td className="border-b" />
                </tr>
              ))}
              <tr>
                <td className="sticky left-0 z-10 border-b border-r bg-white" />
                <td colSpan={cols.length + 2} className="border-b">
                  <button onClick={() => createRecord()} className="sticky left-9 flex h-9 items-center gap-1.5 px-2.5 text-[13px] text-ink-3 hover:text-ink"><Plus size={14} /> {listId ? "Adicionar registro" : labels.new}</button>
                </td>
              </tr>
            </tbody>
            <tfoot className="sticky bottom-0 z-20 bg-white">
              <tr>
                <td className="sticky left-0 z-20 border-r border-t bg-white" />
                {cols.map((a) => (
                  <td key={a.id} className={clsx("h-9 border-r border-t bg-white px-0", a.isPrimary && "sticky left-9 z-20")}>
                    {a.isPrimary ? (
                      <div className="px-2.5 text-right text-[12.5px] text-ink-3"><b className="font-medium text-ink-2">{rows.length}</b> {rows.length === 1 ? "registro" : "registros"}</div>
                    ) : (
                      <CalcCell attr={a} calc={calcs[a.slug] ?? "none"} setCalc={(c) => setCalcs({ ...calcs, [a.slug]: c })} value={calcValue(calcs[a.slug] ?? "none", a, rows)} />
                    )}
                  </td>
                ))}
                <td className="border-r border-t bg-white" />
                <td className="border-t bg-white" />
              </tr>
            </tfoot>
          </table>
          {rows.length === 0 && (
            <div className="px-6 py-14 text-center">
              <p className="text-[14px] font-medium">Nenhum registro corresponde aos filtros</p>
              <p className="mt-1 text-[13px] text-ink-3">Ajuste ou limpe os filtros para ver mais.</p>
            </div>
          )}
        </div>
      ) : (
        statusAttr && <Kanban object={object} attrs={attrs} records={rows} statusAttr={statusAttr} newLabel={labels.new} onMove={(id, stage) => save(id, statusAttr.slug, stage)} onCreate={(values) => createRecord(values)} />
      )}

      {addAttr && <AddAttributeModal objectSlug={object.slug} onClose={() => setAddAttr(false)} />}
    </>
  );
}

function CalcCell({ attr, calc, setCalc, value }: { attr: Attr; calc: Calc; setCalc: (c: Calc) => void; value: string }) {
  const numeric = attr.type === "number" || attr.type === "currency";
  const options: Calc[] = numeric ? ["none", "sum", "avg", "min", "max", "filled", "empty"] : ["none", "filled", "empty", "unique"];
  return (
    <Popover
      width={180}
      trigger={(_, toggle) => (
        <button onClick={toggle} className="group/calc flex h-9 w-full items-center justify-end gap-1 whitespace-nowrap px-2.5 text-[12.5px] text-ink-3 hover:bg-hover">
          {calc === "none" ? (
            <span className="opacity-0 transition-opacity group-hover/calc:opacity-100"><Plus size={12} className="mr-1 inline" />Adicionar cálculo</span>
          ) : (
            <><span>{CALC_LABEL[calc]}</span> <b className="font-medium text-ink">{value}</b></>
          )}
        </button>
      )}
    >
      {(close) => options.map((o) => <MenuItem key={o} active={o === calc} onClick={() => { setCalc(o); close(); }}>{CALC_LABEL[o]}</MenuItem>)}
    </Popover>
  );
}

function ViewSettings({ ordered, hidden, setHidden, setOrder, onAddAttr }: { ordered: Attr[]; hidden: Set<string>; setHidden: (h: Set<string>) => void; setOrder: (o: string[]) => void; onAddAttr: () => void }) {
  const [drag, setDrag] = useState<string | null>(null);
  const rest = ordered.filter((a) => !a.isPrimary);
  const move = (from: string, to: string) => {
    const slugs = rest.map((a) => a.slug);
    const i = slugs.indexOf(from), j = slugs.indexOf(to);
    if (i < 0 || j < 0 || i === j) return;
    slugs.splice(j, 0, slugs.splice(i, 1)[0]);
    setOrder(slugs);
  };
  return (
    <Popover
      width={260}
      trigger={(_, toggle) => (
        <button onClick={toggle} className="flex h-7 items-center gap-1.5 rounded-lg border border-line-2 px-2 text-[13px] font-medium shadow-[0_1px_1px_rgba(0,0,0,0.03)] hover:bg-hover">
          <SlidersHorizontal size={13} className="text-ink-2" /> Configurar visualização <ChevronDown size={13} className="text-ink-3" />
        </button>
      )}
    >
      {() => (
        <div>
          <div className="px-2 pb-1 pt-1 text-[12px] font-medium text-ink-3">Colunas (arraste para reordenar)</div>
          <div className="scroll-thin max-h-72 overflow-y-auto">
            {rest.map((a) => (
              <div
                key={a.id}
                draggable
                onDragStart={() => setDrag(a.slug)}
                onDragOver={(e) => { e.preventDefault(); if (drag && drag !== a.slug) move(drag, a.slug); }}
                onDragEnd={() => setDrag(null)}
                className={clsx("flex h-8 items-center gap-2 rounded-lg px-1.5 text-[13px] hover:bg-hover", drag === a.slug && "bg-hover")}
              >
                <GripVertical size={13} className="cursor-grab text-ink-3" />
                <AttrIcon type={a.type} />
                <span className={clsx("flex-1 truncate", hidden.has(a.slug) && "text-ink-3")}>{a.name}</span>
                <button
                  onClick={() => { const h = new Set(hidden); if (h.has(a.slug)) h.delete(a.slug); else h.add(a.slug); setHidden(h); }}
                  className="rounded p-1 text-ink-3 hover:bg-white hover:text-ink"
                  aria-label={hidden.has(a.slug) ? "Mostrar coluna" : "Ocultar coluna"}
                >
                  {hidden.has(a.slug) ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            ))}
          </div>
          <div className="my-1 border-t" />
          <MenuItem onClick={onAddAttr}><Plus size={14} className="text-ink-3" /> Adicionar atributo à visualização</MenuItem>
        </div>
      )}
    </Popover>
  );
}

function HeaderCell({ attr, sort, setSort, onHide }: { attr: Attr; sort: Sort; setSort: (s: Sort) => void; onHide: () => void }) {
  const router = useRouter();
  const active = sort?.slug === attr.slug;
  return (
    <Popover
      width={200}
      trigger={(_, toggle) => (
        <button onClick={toggle} className="flex h-9 w-full items-center gap-1.5 px-2.5 text-[13px] font-medium text-ink-2 hover:bg-hover">
          <AttrIcon type={attr.type} />
          <span className="truncate">{attr.name}</span>
          {active && (sort!.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
        </button>
      )}
    >
      {(close) => (
        <>
          <MenuItem onClick={() => { setSort({ slug: attr.slug, dir: "asc" }); close(); }}><ArrowUp size={14} className="text-ink-3" /> Ordenar crescente</MenuItem>
          <MenuItem onClick={() => { setSort({ slug: attr.slug, dir: "desc" }); close(); }}><ArrowDown size={14} className="text-ink-3" /> Ordenar decrescente</MenuItem>
          {!attr.isPrimary && <MenuItem onClick={() => { onHide(); close(); }}><HideIcon size={14} className="text-ink-3" /> Ocultar da visualização</MenuItem>}
          {!attr.isSystem && !attr.isPrimary && (
            <>
              <div className="my-1 border-t" />
              <MenuItem danger onClick={async () => {
                close();
                if (!confirm(`Excluir o atributo “${attr.name}”? Os valores dessa coluna deixam de aparecer.`)) return;
                await api(`/api/attributes/${attr.id}`, "DELETE");
                router.refresh();
              }}><Trash2 size={14} /> Excluir atributo</MenuItem>
            </>
          )}
        </>
      )}
    </Popover>
  );
}

function SortMenu({ attrs, sort, setSort }: { attrs: Attr[]; sort: Sort; setSort: (s: Sort) => void }) {
  return (
    <Popover
      width={280}
      trigger={(_, toggle) => (
        <button onClick={toggle} className={clsx("flex h-7 items-center gap-1.5 rounded-lg border border-line-2 px-2 text-[13px] hover:bg-hover", sort ? "bg-[#f2f6fe] text-[#1d4ed8]" : "text-ink-2")}>
          <ArrowDownUp size={13} /> {sort ? <>Ordenado por <b className="font-medium">{attrs.find((a) => a.slug === sort.slug)?.name}</b></> : "Ordenar"}
        </button>
      )}
    >
      {(close) => (
        <div className="p-1.5">
          <div className="mb-1.5 text-[12px] font-medium text-ink-3">Ordenar por</div>
          <div className="flex gap-1.5">
            <select className={inputCls} value={sort?.slug ?? ""} onChange={(e) => setSort(e.target.value ? { slug: e.target.value, dir: sort?.dir ?? "asc" } : null)}>
              <option value="">Sem ordenação</option>
              {attrs.map((a) => <option key={a.id} value={a.slug}>{a.name}</option>)}
            </select>
            <select className={`${inputCls} w-28`} value={sort?.dir ?? "asc"} disabled={!sort} onChange={(e) => sort && setSort({ ...sort, dir: e.target.value as "asc" | "desc" })}>
              <option value="asc">Crescente</option>
              <option value="desc">Decrescente</option>
            </select>
          </div>
          {sort && <button onClick={() => { setSort(null); close(); }} className="mt-2 text-[12.5px] text-ink-2 hover:text-ink">Remover ordenação</button>}
        </div>
      )}
    </Popover>
  );
}

function FilterMenu({ attrs, filters, setFilters }: { attrs: Attr[]; filters: FilterRule[]; setFilters: (f: FilterRule[]) => void }) {
  const { users, relOptions } = useCrm();
  const [slug, setSlug] = useState(attrs[0]?.slug ?? "");
  const a = attrs.find((x) => x.slug === slug) ?? attrs[0];
  const [op, setOp] = useState<Op>(opsFor(a)[0]);
  const [value, setValue] = useState("");
  const needsValue = op !== "empty" && op !== "not_empty";
  const choices: { id: string; label: string }[] | null =
    a.type === "select" || a.type === "multiselect" || a.type === "status" ? (a.options ?? []).map((o) => ({ id: o.id, label: o.label }))
    : a.type === "user" ? users.map((u) => ({ id: u.id, label: u.name }))
    : a.type === "relation" ? (relOptions[a.relationObjectId ?? ""] ?? []).map((r) => ({ id: r.id, label: r.name }))
    : a.type === "checkbox" ? [{ id: "true", label: "Marcado" }, { id: "false", label: "Desmarcado" }]
    : null;

  return (
    <Popover
      width={300}
      trigger={(_, toggle) => (
        <button onClick={toggle} className={clsx("flex h-7 items-center gap-1.5 rounded-md px-2 text-[13px] hover:bg-hover", filters.length ? "bg-[#f2f6fe] text-[#1d4ed8]" : "text-ink-2")}>
          <Filter size={13} /> {filters.length ? `${filters.length} ${filters.length === 1 ? "filtro" : "filtros"}` : "Filtro"}
        </button>
      )}
    >
      {(close) => (
        <div className="space-y-1.5 p-1.5">
          <div className="text-[12px] font-medium text-ink-3">Adicionar filtro</div>
          <select className={inputCls} value={slug} onChange={(e) => { const nx = attrs.find((x) => x.slug === e.target.value) ?? attrs[0]; setSlug(nx.slug); setOp(opsFor(nx)[0]); setValue(""); }}>
            {attrs.map((x) => <option key={x.id} value={x.slug}>{x.name}</option>)}
          </select>
          <select className={inputCls} value={op} onChange={(e) => setOp(e.target.value as Op)}>
            {opsFor(a).map((o) => <option key={o} value={o}>{OPS[o]}</option>)}
          </select>
          {needsValue && (choices ? (
            <select className={inputCls} value={value} onChange={(e) => setValue(e.target.value)}>
              <option value="">Escolha…</option>
              {choices.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          ) : (
            <input className={inputCls} type={a.type === "date" ? "date" : a.type === "number" || a.type === "currency" ? "number" : "text"} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Valor" />
          ))}
          <Button variant="primary" className="w-full justify-center" disabled={needsValue && !value} onClick={() => { setFilters([...filters, { slug: a.slug, op, value }]); setValue(""); close(); }}>
            Aplicar filtro
          </Button>
        </div>
      )}
    </Popover>
  );
}

function Kanban({ object, attrs, records, statusAttr, newLabel, onMove, onCreate }: { object: ObjectLite; attrs: Attr[]; records: RecordLite[]; statusAttr: Attr; newLabel: string; onMove: (id: string, stage: string) => void; onCreate: (values: Record<string, unknown>) => Promise<RecordLite> }) {
  const [over, setOver] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const primary = primaryAttr(attrs);
  const money = attrs.find((a) => a.type === "currency");
  const cardAttrs = attrs.filter((a) => !a.isPrimary && a.id !== statusAttr.id && ["relation", "currency", "user", "date"].includes(a.type)).slice(0, 4);
  const cols = [...(statusAttr.options ?? []), { id: "__none", label: "Sem etapa", color: "gray" }];

  return (
    <div className="scroll-thin flex min-h-0 flex-1 gap-3 overflow-x-auto bg-panel p-3">
      {cols.map((c) => {
        const items = records.filter((r) => (c.id === "__none" ? !optionFor(statusAttr, r.values[statusAttr.slug]) : r.values[statusAttr.slug] === c.id));
        if (c.id === "__none" && items.length === 0) return null;
        const total = money ? items.reduce((s, r) => s + (Number(r.values[money.slug]) || 0), 0) : 0;
        return (
          <div
            key={c.id}
            onDragOver={(e) => { e.preventDefault(); setOver(c.id); }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => { e.preventDefault(); setOver(null); const id = e.dataTransfer.getData("text/plain"); if (id) onMove(id, c.id === "__none" ? "" : c.id); }}
            className={clsx("flex w-[272px] shrink-0 flex-col rounded-xl border bg-[#f6f7f8] transition-colors", over === c.id ? "border-[#9dbcf8] bg-[#f2f6fe]" : "border-transparent")}
          >
            <div className="flex items-center justify-between px-2.5 pb-1 pt-2.5">
              <div className="flex items-center gap-2">
                <Tag label={c.label} color={c.color} dot />
                <span className="text-[12.5px] text-ink-3">{items.length}</span>
              </div>
              {money && <span className="text-[12px] text-ink-3">{fmtCurrency(total)}</span>}
            </div>
            <div className="scroll-thin flex-1 space-y-2 overflow-y-auto p-2">
              {items.map((r) => (
                <div
                  key={r.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", r.id)}
                  className="cursor-grab rounded-lg border border-line-2 bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-[#d0d2d7] active:cursor-grabbing"
                >
                  <Link draggable={false} href={`/objects/${object.slug}/${r.id}`} className="mb-1.5 flex items-center gap-2 text-[13.5px] font-medium hover:underline">
                    <Avatar name={recordName(r.values, attrs)} size={18} square />
                    <span className="truncate">{recordName(r.values, attrs)}</span>
                  </Link>
                  <div className="space-y-1">
                    {cardAttrs.map((a) => (r.values[a.slug] ? (
                      <div key={a.id} className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-ink-2"><AttrIcon type={a.type} size={12} /><ValueDisplay attr={a} value={r.values[a.slug]} /></div>
                    ) : null))}
                  </div>
                </div>
              ))}
              {adding === c.id ? (
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={() => { setAdding(null); setNewName(""); }}
                  onKeyDown={async (e) => {
                    if (e.key === "Escape") { setAdding(null); setNewName(""); }
                    if (e.key === "Enter" && newName.trim()) {
                      await onCreate({ [primary.slug]: newName.trim(), [statusAttr.slug]: c.id === "__none" ? null : c.id });
                      setNewName("");
                      setAdding(null);
                    }
                  }}
                  placeholder="Nome do registro e Enter"
                  className={inputCls}
                />
              ) : (
                <button onClick={() => setAdding(c.id)} className="flex h-8 w-full items-center gap-1.5 rounded-lg px-2 text-[13px] text-ink-3 hover:bg-white hover:text-ink"><Plus size={14} /> {newLabel}</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
