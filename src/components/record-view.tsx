"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { Activity, CheckSquare, ChevronDown, FileText, LayoutGrid, Mail, MoreHorizontal, Plus, Star, Trash2, ListPlus } from "lucide-react";
import type { Attr, ObjectLite, RecordLite } from "@/lib/types";
import { fmtDateTime, recordName, relativeTime } from "@/lib/format";
import { useCrm } from "./crm-context";
import { Avatar, Button, MenuItem, ObjectIcon, Popover, api, useSynced } from "./ui";
import { ValueDisplay, ValueEditor } from "./values";
import { AttrIcon } from "./attr-icon";
import { TaskList, type TaskLite } from "./tasks";
import { NotesGrid, NoteModal, type NoteLite } from "./notes";
import { AddAttributeModal } from "./add-attribute";

export type ActivityLite = { id: string; kind: string; message: string; actorId: string | null; createdAt: string };
export type RelatedGroup = { object: ObjectLite; attrName: string; label: string; records: { id: string; name: string }[] };

function ActivityFeed({ activities }: { activities: ActivityLite[] }) {
  const { users } = useCrm();
  if (activities.length === 0) return <p className="text-[13px] text-ink-3">Nenhuma atividade ainda.</p>;
  return (
    <ol className="space-y-0.5">
      {activities.map((a) => {
        const u = users.find((x) => x.id === a.actorId);
        return (
          <li key={a.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] hover:bg-[#fafafa]">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line-2 bg-white text-ink-3">
              {a.kind === "note" ? <FileText size={10} /> : a.kind === "task" ? <CheckSquare size={10} /> : <Activity size={10} />}
            </span>
            <p className="min-w-0 flex-1 truncate"><b className="font-medium">{u?.name ?? "Sistema"}</b> <span className="text-ink-2">{a.message}</span></p>
            <span className="shrink-0 text-[12px] text-ink-3" title={fmtDateTime(a.createdAt)}>{relativeTime(a.createdAt)}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function RecordView({ object, attrs, record: initial, notes, tasks, activities, related, listNames }: {
  object: ObjectLite; attrs: Attr[]; record: RecordLite; notes: NoteLite[]; tasks: TaskLite[]; activities: ActivityLite[]; related: RelatedGroup[]; listNames: string[];
}) {
  const router = useRouter();
  const { lists } = useCrm();
  const [record, setRecord] = useSynced(initial);
  const [tab, setTab] = useState<string>("overview");
  const [editing, setEditing] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [addAttr, setAddAttr] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [starred, setStarred] = useState(false);
  const name = recordName(record.values, attrs);
  const openTasks = tasks.filter((t) => !t.completed).length;
  const objLists = lists.filter((l) => l.objectId === object.id);
  const email = attrs.find((a) => a.type === "email");
  const emailValue = email ? (record.values[email.slug] as string | undefined) : undefined;
  const detailAttrs = showAll ? attrs : attrs.slice(0, 7);
  const highlights = attrs.filter((a) => !a.isPrimary).slice(0, 6);

  const save = async (slug: string, v: unknown) => {
    setEditing(null);
    setRecord((r) => ({ ...r, values: { ...r.values, [slug]: v } }));
    await api(`/api/records/${record.id}`, "PATCH", { values: { [slug]: v } });
    router.refresh();
  };
  const remove = async () => {
    if (!confirm(`Excluir “${name}”? Notas e histórico também serão apagados.`)) return;
    await api(`/api/records/${record.id}`, "DELETE");
    router.push(`/objects/${object.slug}`);
    router.refresh();
  };

  const tabs = [
    { id: "overview", label: "Visão geral", icon: <LayoutGrid size={14} />, count: undefined as number | undefined },
    { id: "activity", label: "Atividade", icon: <Activity size={14} />, count: undefined },
    { id: "notes", label: "Notas", icon: <FileText size={14} />, count: notes.length },
    { id: "tasks", label: "Tarefas", icon: <CheckSquare size={14} />, count: openTasks },
    ...related.map((g, i) => ({ id: `rel-${i}`, label: g.label, icon: <ObjectIcon icon={g.object.icon} size={14} />, count: g.records.length })),
  ];

  const addToList = (close: () => void) =>
    objLists.length === 0 ? (
      <div className="px-2 py-2 text-[12.5px] text-ink-3">Nenhuma lista de {object.plural.toLowerCase()} ainda.</div>
    ) : (
      objLists.map((l) => (
        <MenuItem key={l.id} onClick={async () => { close(); await api(`/api/lists/${l.id}/entries`, "POST", { recordId: record.id }); router.refresh(); }}>
          <ListPlus size={14} className="text-ink-3" /> {l.name}
        </MenuItem>
      ))
    );

  return (
    <>
      <header className="flex h-11 shrink-0 items-center justify-between border-b px-4">
        <div className="flex min-w-0 items-center gap-1.5 text-[13.5px]">
          <Link href={`/objects/${object.slug}`} className="flex items-center gap-1.5 rounded-md px-1 py-0.5 font-medium text-ink-2 hover:bg-hover">
            <ObjectIcon icon={object.icon} color={object.color} size={16} solid /> {object.plural}
          </Link>
          <span className="text-ink-3">/</span>
          <span className="truncate font-medium">{name}</span>
        </div>
        <Popover align="right" width={220} trigger={(_, toggle) => <Button variant="ghost" className="h-7 px-1.5" onClick={toggle} aria-label="Mais ações"><MoreHorizontal size={16} /></Button>}>
          {(close) => <MenuItem danger onClick={() => { close(); remove(); }}><Trash2 size={14} /> Excluir registro</MenuItem>}
        </Popover>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Painel esquerdo: identidade + detalhes */}
        <aside className="scroll-thin w-[340px] shrink-0 overflow-y-auto border-r">
          <div className="px-4 pt-4">
            <div className="flex items-center gap-2.5">
              <Avatar name={name} size={28} square={object.slug !== "people"} />
              <h1 className="min-w-0 flex-1 truncate text-[18px] font-semibold tracking-[-0.01em]">{name}</h1>
              <button onClick={() => setStarred(!starred)} aria-label="Favoritar" className="rounded-md p-1 text-ink-3 hover:bg-hover">
                <Star size={15} className={clsx(starred && "fill-[#f5b301] text-[#f5b301]")} />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <a href={emailValue ? `mailto:${emailValue}` : undefined} aria-disabled={!emailValue} title={emailValue ? undefined : "Este registro não tem e-mail"}>
                <Button className="h-7" disabled={!emailValue}><Mail size={13} /> Escrever e-mail</Button>
              </a>
              <Popover width={220} trigger={(_, toggle) => <Button className="h-7" onClick={toggle}><ListPlus size={13} /> Adicionar à lista</Button>}>
                {(close) => addToList(close)}
              </Popover>
              <Button className="h-7" onClick={() => setNoteOpen(true)}><FileText size={13} /> Nova nota</Button>
            </div>
          </div>

          <div className="mt-4 border-t px-2 py-2">
            <div className="flex items-center gap-1 px-2 py-1.5 text-[12.5px] font-medium text-ink-2">Detalhes do registro <ChevronDown size={12} /></div>
            {detailAttrs.map((a) => (
              <div key={a.id} className="flex min-h-[32px] items-center gap-1">
                <div className="flex w-[120px] shrink-0 items-center gap-1.5 px-2 text-[13px] text-ink-3">
                  <AttrIcon type={a.type} /> <span className="truncate">{a.name}</span>
                </div>
                <div
                  onClick={() => editing !== a.slug && setEditing(a.slug)}
                  className={clsx("relative flex min-h-[28px] min-w-0 flex-1 cursor-default items-center rounded-md px-2 text-[13px] hover:bg-hover", (a.type === "url" || a.type === "email") && "[&_a]:text-[#266df0]")}
                >
                  <div className="min-w-0 truncate">{record.values[a.slug] === undefined || record.values[a.slug] === null || record.values[a.slug] === "" ? <span className="text-ink-3">Definir {a.name.toLowerCase()}</span> : <ValueDisplay attr={a} value={record.values[a.slug]} compact={false} />}</div>
                  {editing === a.slug && <ValueEditor attr={a} value={record.values[a.slug]} onDone={(v) => save(a.slug, v)} onCancel={() => setEditing(null)} />}
                </div>
              </div>
            ))}
            {attrs.length > 7 && (
              <button onClick={() => setShowAll(!showAll)} className="ml-2 mt-1 h-7 rounded-md px-2 text-[12.5px] text-ink-2 hover:bg-hover">
                {showAll ? "Mostrar menos" : "Ver todos os valores"}
              </button>
            )}
            <button onClick={() => setAddAttr(true)} className="ml-2 mt-1 flex h-7 items-center gap-1.5 rounded-md px-2 text-[12.5px] text-ink-3 hover:bg-hover hover:text-ink"><Plus size={13} /> Adicionar atributo</button>
          </div>

          <div className="border-t px-4 py-3">
            <div className="mb-1.5 flex items-center justify-between text-[12.5px] font-medium text-ink-2">
              Listas
              <Popover align="right" width={220} trigger={(_, toggle) => <button onClick={toggle} className="text-ink-3 hover:text-ink">Adicionar à lista</button>}>
                {(close) => addToList(close)}
              </Popover>
            </div>
            {listNames.length === 0 ? (
              <p className="text-[12.5px] text-ink-3">Este registro ainda não está em nenhuma lista.</p>
            ) : (
              <div className="flex flex-wrap gap-1">{listNames.map((n) => <span key={n} className="rounded-md border border-line-2 px-1.5 text-[12.5px]">{n}</span>)}</div>
            )}
            <p className="mt-3 text-[12px] text-ink-3">Criado em {fmtDateTime(record.createdAt)}</p>
          </div>
        </aside>

        {/* Abas */}
        <div className="flex min-w-0 flex-1 flex-col">
          <nav className="scroll-thin flex h-11 shrink-0 items-end gap-4 overflow-x-auto border-b px-4">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={clsx("-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 pb-2.5 text-[13px] font-medium", tab === t.id ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink-2")}>
                {t.icon} {t.label}
                {t.count !== undefined && <span className="rounded-md bg-hover px-1.5 text-[11.5px] text-ink-2">{t.count}</span>}
              </button>
            ))}
          </nav>

          {tab === "overview" && (
            <div className="scroll-thin flex-1 overflow-y-auto px-5 py-4">
              <h3 className="mb-2 text-[13px] font-medium text-ink-2">Destaques</h3>
              <div className="grid grid-cols-3 gap-2">
                {highlights.map((a) => (
                  <div key={a.id} className="relative rounded-xl border border-line-2 px-3 py-2.5">
                    <div className="flex items-center justify-between text-[12px] text-ink-2">{a.name} <AttrIcon type={a.type} size={12} /></div>
                    <div onClick={() => editing !== `h-${a.slug}` && setEditing(`h-${a.slug}`)} className="relative mt-3 min-h-[22px] truncate text-[13.5px] font-medium">
                      <ValueDisplay attr={a} value={record.values[a.slug]} compact={false} />
                      {editing === `h-${a.slug}` && <ValueEditor attr={a} value={record.values[a.slug]} onDone={(v) => save(a.slug, v)} onCancel={() => setEditing(null)} />}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mb-2 mt-6 flex items-center justify-between">
                <h3 className="text-[13px] font-medium text-ink-2">Atividade</h3>
                <button onClick={() => setTab("activity")} className="text-[12.5px] text-ink-2 hover:text-ink">Ver tudo</button>
              </div>
              <div className="rounded-xl border border-line-2 p-1"><ActivityFeed activities={activities.slice(0, 4)} /></div>
              {[
                { id: "notes", label: "Notas", count: notes.length, add: () => setNoteOpen(true) },
                { id: "tasks", label: "Tarefas", count: openTasks, add: () => setTab("tasks") },
              ].map((s) => (
                <div key={s.id} className="mt-3 flex h-10 items-center justify-between border-b">
                  <button onClick={() => setTab(s.id)} className="flex items-center gap-2 text-[13px] font-medium text-ink-2 hover:text-ink">{s.label} <span className="rounded-md bg-hover px-1.5 text-[11.5px]">{s.count}</span></button>
                  <button onClick={s.add} aria-label={`Adicionar ${s.label.toLowerCase()}`} className="rounded p-1 text-ink-3 hover:bg-hover hover:text-ink"><Plus size={14} /></button>
                </div>
              ))}
            </div>
          )}
          {tab === "activity" && <div className="scroll-thin flex-1 overflow-y-auto px-4 py-3"><ActivityFeed activities={activities} /></div>}
          {tab === "notes" && <NotesGrid notes={notes} defaultRecordId={record.id} showRecord={false} />}
          {tab === "tasks" && <TaskList tasks={tasks} defaultRecordId={record.id} />}
          {related.map((g, i) => tab === `rel-${i}` && (
            <div key={i} className="scroll-thin flex-1 overflow-y-auto">
              <table className="w-full border-separate border-spacing-0 text-[13px]">
                <thead><tr><th className="h-9 border-b px-4 text-left font-medium text-ink-2">{g.object.singular}</th><th className="h-9 border-b px-4 text-left font-medium text-ink-2">Vínculo</th></tr></thead>
                <tbody>
                  {g.records.map((r) => (
                    <tr key={r.id} className="hover:bg-[#fafafa]">
                      <td className="h-9 border-b px-4"><Link href={`/objects/${g.object.slug}/${r.id}`} className="inline-flex items-center gap-2 font-medium hover:underline"><Avatar name={r.name} size={18} square={g.object.slug !== "people"} />{r.name}</Link></td>
                      <td className="h-9 border-b px-4 text-ink-2">{g.attrName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
      {noteOpen && <NoteModal note={null} defaultRecordId={record.id} onClose={() => { setNoteOpen(false); setTab("notes"); }} />}
      {addAttr && <AddAttributeModal objectSlug={object.slug} onClose={() => setAddAttr(false)} />}
    </>
  );
}
