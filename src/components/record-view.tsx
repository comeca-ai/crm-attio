"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import {
  Activity, CheckSquare, ChevronDown, Ellipsis, FileText, LayoutGrid, Link2, ListPlus, Mail, Paperclip, Pencil, Plus, Star, Trash2,
  Upload, Video, Workflow, Download, Users, Building2, CircleDot,
} from "lucide-react";
import type { Attr, ObjectLite, RecordLite } from "@/lib/types";
import { asArray, fmtDateTime, recordName, relativeTime } from "@/lib/format";
import { useI18n } from "@/i18n/client";
import { useCrm } from "./crm-context";
import { Button, MenuItem, ObjectIcon, Popover, api, useSynced } from "./ui";
import { ValueDisplay, ValueEditor } from "./values";
import { AttrIcon } from "./attr-icon";
import { TaskList, TaskModal, TaskRow, type TaskLite } from "./tasks";
import { NotesGrid, NoteModal, type NoteLite } from "./notes";
import { AddAttributeModal } from "./add-attribute";
import { EmptyState } from "./empty-state";
import { TopBar, Crumb } from "./topbar";
import { RecordIcon } from "./views/table";

export type ActivityLite = { id: string; kind: string; data: Record<string, unknown>; actorId: string | null; createdAt: string };
export type FileLite = { id: string; name: string; size: number; mime: string; uploaderId: string; createdAt: string };
export type RelationTab = { attr: Attr; object: ObjectLite; attrs: Attr[]; records: RecordLite[] };

const HIGHLIGHTS: Record<string, string[]> = {
  companies: ["connection_strength", "foundation_date", "team", "estimated_arr", "funding_raised", "employee_range"],
  people: ["connection_strength", "email_addresses", "company", "job_title", "phone_numbers", "primary_location"],
  deals: ["stage", "value", "owner", "associated_company", "associated_people", "close_date"],
};

export function ActivityItem({ a, object, attrs }: { a: ActivityLite; object: ObjectLite; attrs: Attr[] }) {
  const { t, locale } = useI18n();
  const { users } = useCrm();
  const u = users.find((x) => x.id === a.actorId);
  const actor = u ? u.name : t("common.system.actor");
  const attr = attrs.find((x) => x.slug === a.data.attr);
  let body: React.ReactNode;
  switch (a.kind) {
    case "created": body = t("act.created", { object: object.singular }); break;
    case "updated":
      body = attr ? (a.data.value === null || a.data.value === "" ? t("act.cleared", { attr: attr.name }) : <>{t("act.changed", { attr: attr.name })} <span className="inline-flex max-w-[260px] align-middle"><ValueDisplay attr={attr} value={a.data.value} /></span></>) : t("act.changed", { attr: String(a.data.attr ?? "") });
      break;
    case "note": body = <>{t("act.note")} <b className="font-medium">{String(a.data.title ?? "")}</b></>; break;
    case "task_created": body = <>{t("act.taskCreated")} <b className="font-medium">{String(a.data.content ?? "")}</b></>; break;
    case "task_completed": body = <>{t("act.taskCompleted")} <b className="font-medium">{String(a.data.content ?? "")}</b></>; break;
    case "task_reopened": body = <>{t("act.taskReopened")} <b className="font-medium">{String(a.data.content ?? "")}</b></>; break;
    case "file": body = <>{t("act.file")} <b className="font-medium">{String(a.data.name ?? "")}</b></>; break;
    default: body = a.kind;
  }
  const Icon = a.kind === "note" ? FileText : a.kind.startsWith("task") ? CheckSquare : a.kind === "file" ? Paperclip : a.kind === "created" ? CircleDot : Activity;
  return (
    <li className="flex items-center gap-2 px-3 py-1.5 text-[13px]" data-testid="activity-item">
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#f1f1f3] text-ink-3"><Icon size={10} /></span>
      <p className="min-w-0 flex-1 truncate"><b className="font-medium">{actor}</b> <span className="text-ink-2">{body}</span></p>
      <span className="shrink-0 text-[12px] text-ink-3" title={fmtDateTime(a.createdAt, locale)} suppressHydrationWarning>{relativeTime(a.createdAt, locale)}</span>
    </li>
  );
}

function SectionHead({ title, count, onAdd, right }: { title: string; count?: number; onAdd?: () => void; right?: React.ReactNode }) {
  return (
    <div className="flex h-9 items-center justify-between">
      <span className="flex items-center gap-1.5 text-[13px] font-medium">{title}{count !== undefined && <span className="rounded bg-[#efeff1] px-1 text-[11px] font-medium text-ink-2">{count}</span>}</span>
      {right ?? (onAdd && <button onClick={onAdd} className="rounded p-1 text-ink-3 hover:bg-hover hover:text-ink" aria-label="Add"><Plus size={14} /></button>)}
    </div>
  );
}

export function RecordView({ object, attrs, record: initial, notes, tasks, activities, files, relationTabs, memberLists, favorite }: {
  object: ObjectLite; attrs: Attr[]; record: RecordLite; notes: NoteLite[]; tasks: TaskLite[]; activities: ActivityLite[]; files: FileLite[];
  relationTabs: RelationTab[]; memberLists: { id: string; name: string }[]; favorite: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { lists, users } = useCrm();
  const [record, setRecord] = useSynced(initial);
  const [tab, setTab] = useState<string>("overview");
  const [editing, setEditing] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "note" | "task" | "attr">(null);
  const [showAll, setShowAll] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [listsOpen, setListsOpen] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const name = recordName(record.values, attrs, t("common.noName"));
  const primary = attrs.find((a) => a.isPrimary)!;
  const objLists = lists.filter((l) => l.objectId === object.id);
  const emails = asArray(record.values.email_addresses);
  const detailAttrs = (showAll ? attrs : attrs.filter((a) => !a.config.readOnly).slice(0, 6));
  const highlights = (HIGHLIGHTS[object.slug] ?? attrs.filter((a) => !a.isPrimary).slice(0, 6).map((a) => a.slug)).map((s) => attrs.find((a) => a.slug === s)).filter(Boolean) as Attr[];
  const openTasks = tasks.filter((x) => !x.completed);

  const save = async (slug: string, v: unknown) => {
    setEditing(null);
    setRecord((r) => ({ ...r, values: { ...r.values, [slug]: v } }));
    await api(`/api/records/${record.id}`, "PATCH", { values: { [slug]: v } });
    router.refresh();
  };
  const toggleFav = async () => { await api("/api/favorites", "POST", { recordId: record.id }); router.refresh(); };
  const addToList = async (listId: string) => { await api(`/api/lists/${listId}/entries`, "POST", { recordId: record.id }); router.refresh(); };
  const remove = async () => {
    if (!confirm(t("rec.confirmDelete", { name }))) return;
    await api(`/api/records/${record.id}`, "DELETE");
    router.push(`/objects/${object.slug}`);
    router.refresh();
  };
  const upload = async (f: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", f);
    const r = await fetch(`/api/records/${record.id}/files`, { method: "POST", body: fd });
    setUploading(false);
    if (!r.ok) alert((await r.json().catch(() => ({}))).error ?? t("common.error"));
    router.refresh();
  };

  const tabs: { id: string; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "overview", label: t("rec.tab.overview"), icon: <LayoutGrid size={13} /> },
    { id: "activity", label: t("rec.tab.activity"), icon: <Activity size={13} /> },
    { id: "emails", label: t("rec.tab.emails"), icon: <Mail size={13} />, count: 0 },
    { id: "calls", label: t("rec.tab.calls"), icon: <Video size={13} />, count: 0 },
    ...relationTabs.map((r) => ({ id: `rel-${r.attr.slug}`, label: r.attr.name, icon: r.object.slug === "people" ? <Users size={13} /> : r.object.slug === "companies" ? <Building2 size={13} /> : <ObjectIcon icon={r.object.icon} size={13} />, count: r.records.length })),
    { id: "notes", label: t("rec.tab.notes"), icon: <FileText size={13} />, count: notes.length },
    { id: "tasks", label: t("rec.tab.tasks"), icon: <CheckSquare size={13} />, count: openTasks.length },
    { id: "files", label: t("rec.tab.files"), icon: <Paperclip size={13} />, count: files.length || undefined },
  ];
  // Mantém as abas de relação depois de Tasks/Files como no Attio (Team logo após Calls, Associated deals por último)
  const ordered = [...tabs.filter((x) => !x.id.startsWith("rel-") || x.id === "rel-team"), ...tabs.filter((x) => x.id.startsWith("rel-") && x.id !== "rel-team")];
  const finalTabs = ordered.filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i);
  if (relationTabs.some((r) => r.attr.slug === "team")) {
    const ti = finalTabs.findIndex((x) => x.id === "rel-team");
    const [team] = finalTabs.splice(ti, 1);
    finalTabs.splice(finalTabs.findIndex((x) => x.id === "calls") + 1, 0, team);
  }

  return (
    <>
      <TopBar>
        <Crumb href={`/objects/${object.slug}`} icon={<ObjectIcon icon={object.icon} color={object.color} size={16} solid />}>{object.plural}</Crumb>
        <span className="text-ink-3">/</span>
        <span className="truncate">{name}</span>
      </TopBar>
      <div className="flex min-h-0 flex-1">
        <aside className="scroll-thin w-[36%] min-w-[340px] max-w-[434px] shrink-0 overflow-y-auto border-r border-line" data-testid="record-left">
          <div className="px-4 pb-3 pt-3.5">
            <div className="flex items-center gap-2.5">
              <RecordIcon object={object} name={name} values={record.values} size={22} />
              <h1 className="min-w-0 flex-1 truncate text-[17px] font-semibold" data-testid="record-name">{name}</h1>
              <button onClick={() => setEditing(primary.slug)} className="rounded p-1 text-ink-3 hover:bg-hover hover:text-ink" aria-label={t("common.edit")}><Pencil size={14} /></button>
              <button onClick={toggleFav} className={clsx("rounded p-1 hover:bg-hover", favorite ? "text-[#f5a524]" : "text-ink-3 hover:text-ink")} aria-label={favorite ? t("rec.unfavorite") : t("rec.favorite")} data-testid="favorite-toggle">
                <Star size={14} fill={favorite ? "currentColor" : "none"} />
              </button>
              <Popover width={190} align="right" trigger={(_o, toggle) => <button onClick={toggle} className="rounded p-1 text-ink-3 hover:bg-hover"><Ellipsis size={14} /></button>}>
                {(close) => (<>
                  <MenuItem onClick={() => { navigator.clipboard?.writeText(location.href); close(); }}><Link2 size={14} className="text-ink-3" />{t("rec.copyLink")}</MenuItem>
                  <MenuItem danger onClick={() => { close(); remove(); }}><Trash2 size={14} />{t("rec.delete")}</MenuItem>
                </>)}
              </Popover>
            </div>
            {editing === primary.slug && (
              <div className="relative mt-2 h-8"><ValueEditor attr={primary} value={record.values[primary.slug]} onCancel={() => setEditing(null)} onDone={(v) => save(primary.slug, v)} /></div>
            )}
            <div className="mt-3 flex items-center gap-1.5 whitespace-nowrap">
              {emails[0] ? <a href={`mailto:${emails[0]}`}><Button className="h-[26px] gap-1 px-1.5 text-[12.5px]"><Mail size={13} />{t("rec.compose")}</Button></a> : <Button className="h-[26px] gap-1 px-1.5 text-[12.5px]" title={t("rec.noEmail")}><Mail size={13} />{t("rec.compose")}</Button>}
              <Popover width={220} trigger={(_o, toggle) => <Button className="h-[26px] gap-1 px-1.5 text-[12.5px]" onClick={toggle}><ListPlus size={13} />{t("rec.addToList")}</Button>}>
                {(close) => objLists.length === 0 ? <p className="px-2 py-1.5 text-[13px] text-ink-3">{t("rec.noLists", { object: object.plural })}</p> : (
                  <>{objLists.map((l) => <MenuItem key={l.id} onClick={() => { addToList(l.id); close(); }}>{l.name}</MenuItem>)}</>
                )}
              </Popover>
              <Button className="h-[26px] gap-1 px-1.5 text-[12.5px]" onClick={() => setModal("note")}><FileText size={13} />{t("notes.new")}</Button>
              <Button className="h-[26px] w-[26px] justify-center px-0" title={t("nav.workflows")}><Workflow size={13} /></Button>
              <Button className="h-[26px] w-[26px] justify-center px-0" title={t("tasks.new")} onClick={() => setModal("task")}><CheckSquare size={13} /></Button>
            </div>
          </div>

          <div className="border-t border-line px-4 py-2.5">
            <button onClick={() => setDetailsOpen(!detailsOpen)} className="flex items-center gap-1 text-[12.5px] font-medium text-ink-2">{t("rec.details")}<ChevronDown size={12} className={clsx(!detailsOpen && "-rotate-90")} /></button>
            {detailsOpen && (
              <div className="mt-1.5">
                {detailAttrs.map((a) => (
                  <div key={a.id} className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-2" data-testid={`detail-${a.slug}`}>
                    <span className="flex items-center gap-1.5 truncate text-[13px] text-ink-2"><AttrIcon type={a.type} slug={a.slug} size={13} /><span className="truncate">{a.name}</span></span>
                    <div className="relative min-w-0">
                      <button onClick={() => !a.config.readOnly && setEditing(a.slug)} title={a.config.readOnly ? t("attr.readOnly") : undefined} className="flex h-[30px] w-full min-w-0 items-center overflow-hidden rounded-md px-1.5 text-left text-[13px] hover:bg-hover">
                        {record.values[a.slug] === null || record.values[a.slug] === undefined || record.values[a.slug] === "" || (Array.isArray(record.values[a.slug]) && (record.values[a.slug] as unknown[]).length === 0)
                          ? <span className="text-ink-3">{t("common.set", { field: a.name.toLowerCase() })}</span>
                          : <ValueDisplay attr={a} value={record.values[a.slug]} />}
                      </button>
                      {editing === a.slug && <ValueEditor attr={a} value={record.values[a.slug]} onCancel={() => setEditing(null)} onDone={(v) => save(a.slug, v)} />}
                    </div>
                  </div>
                ))}
                <div className="mt-1 flex items-center gap-3">
                  <button onClick={() => setShowAll(!showAll)} className="text-[12.5px] text-ink-2 hover:text-ink" data-testid="view-all-values">{showAll ? t("attr.showLess") : t("attr.viewAll")}</button>
                  {showAll && <button onClick={() => setModal("attr")} className="flex items-center gap-1 text-[12.5px] text-ink-2 hover:text-ink"><Plus size={12} />{t("attr.add")}</button>}
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-line px-4 py-2.5">
            <div className="flex items-center justify-between">
              <button onClick={() => setListsOpen(!listsOpen)} className="flex items-center gap-1 text-[12.5px] font-medium text-ink-2">{t("rec.lists")}<ChevronDown size={12} className={clsx(!listsOpen && "-rotate-90")} /></button>
              <Popover width={220} align="right" trigger={(_o, toggle) => <button onClick={toggle} className="text-[12.5px] text-ink-2 hover:text-ink">{t("rec.addToList")}</button>}>
                {(close) => objLists.length === 0 ? <p className="px-2 py-1.5 text-[13px] text-ink-3">{t("rec.noLists", { object: object.plural })}</p> : <>{objLists.map((l) => <MenuItem key={l.id} onClick={() => { addToList(l.id); close(); }}>{l.name}</MenuItem>)}</>}
              </Popover>
            </div>
            {listsOpen && (memberLists.length === 0 ? <p className="mt-1.5 text-[13px] text-ink-2">{t("rec.notInLists")}</p> : (
              <div className="mt-1.5 flex flex-wrap gap-1.5">{memberLists.map((l) => <Link key={l.id} href={`/lists/${l.id}`} className="rounded-md border border-line-2 px-1.5 py-[1px] text-[13px] hover:bg-hover">{l.name}</Link>)}</div>
            ))}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <nav className="scroll-thin flex h-[42px] shrink-0 items-end gap-0.5 overflow-x-auto border-b border-line px-2" data-testid="record-tabs">
            {finalTabs.map((x) => (
              <button key={x.id} onClick={() => setTab(x.id)} data-testid={`tab-${x.id}`}
                className={clsx("-mb-px flex h-[38px] shrink-0 items-center gap-1.5 border-b-2 px-2 text-[13px]", tab === x.id ? "border-ink font-medium text-ink" : "border-transparent text-ink-2 hover:text-ink")}>
                {x.icon}{x.label}{x.count !== undefined && <span className="rounded bg-[#efeff1] px-1 text-[11px] font-medium text-ink-2">{x.count}</span>}
              </button>
            ))}
          </nav>

          {tab === "overview" && (
            <div className="scroll-thin flex-1 overflow-y-auto px-4 py-2">
              <SectionHead title={t("rec.highlights")} />
              <div className="grid grid-cols-3 gap-2" data-testid="highlights">
                {highlights.map((a) => (
                  <div key={a.id} className="relative rounded-lg border border-line p-2.5">
                    <div className="flex items-center justify-between text-[12.5px] text-ink-2"><span className="truncate">{a.name}</span><AttrIcon type={a.type} slug={a.slug} size={13} /></div>
                    <button onClick={() => !a.config.readOnly && setEditing(`hl-${a.slug}`)} className="mt-2.5 flex min-h-[22px] w-full min-w-0 items-center text-left text-[13px] font-medium">
                      {record.values[a.slug] === null || record.values[a.slug] === undefined || record.values[a.slug] === "" || (Array.isArray(record.values[a.slug]) && (record.values[a.slug] as unknown[]).length === 0)
                        ? <span className="font-normal text-ink-3">{t("common.set", { field: a.name.toLowerCase() })}</span> : <ValueDisplay attr={a} value={record.values[a.slug]} />}
                    </button>
                    {editing === `hl-${a.slug}` && <div className="absolute left-2 top-9"><div className="relative"><ValueEditor attr={a} value={record.values[a.slug]} onCancel={() => setEditing(null)} onDone={(v) => save(a.slug, v)} /></div></div>}
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <SectionHead title={t("rec.activity")} right={<button onClick={() => setTab("activity")} className="text-[12.5px] text-ink-2 hover:text-ink">{t("common.viewAll")}</button>} />
                <ol className="rounded-lg border border-line py-1">
                  {activities.length === 0 && <li className="px-3 py-1.5 text-[13px] text-ink-3">{t("rec.noActivity")}</li>}
                  {activities.slice(0, 4).map((a) => <ActivityItem key={a.id} a={a} object={object} attrs={attrs} />)}
                </ol>
              </div>
              <div className="mt-2 border-b border-line"><SectionHead title={t("rec.tab.emails")} count={0} onAdd={() => setTab("emails")} /></div>
              <div className="border-b border-line">
                <SectionHead title={t("rec.tab.notes")} count={notes.length} onAdd={() => setModal("note")} />
                {notes.slice(0, 3).map((n) => <button key={n.id} onClick={() => setTab("notes")} className="flex w-full items-center gap-2 py-1.5 text-left text-[13px] hover:bg-[#fafafb]"><FileText size={13} className="text-ink-3" /><span className="font-medium">{n.title}</span><span className="truncate text-ink-3">{n.content.replace(/\n/g, " ")}</span></button>)}
              </div>
              <div className="border-b border-line">
                <SectionHead title={t("rec.tab.tasks")} count={openTasks.length} onAdd={() => setModal("task")} />
                {openTasks.slice(0, 3).map((x) => <div key={x.id} className="-mx-4"><TaskRow task={x} showRecord={false} onOpen={() => setTab("tasks")} onToggle={async () => { await api(`/api/tasks/${x.id}`, "PATCH", { completed: true }); router.refresh(); }} /></div>)}
              </div>
            </div>
          )}
          {tab === "activity" && <ol className="scroll-thin flex-1 overflow-y-auto py-2">{activities.length === 0 ? <li className="px-4 text-[13px] text-ink-3">{t("rec.noActivity")}</li> : activities.map((a) => <ActivityItem key={a.id} a={a} object={object} attrs={attrs} />)}</ol>}
          {tab === "emails" && <EmptyState kind="mail" title={t("rec.noEmails")} text={t("rec.noEmailsText")} />}
          {tab === "calls" && <EmptyState kind="call" title={t("rec.noCalls")} text={t("rec.noCallsText")} />}
          {tab === "notes" && <NotesGrid notes={notes} defaultRecordId={record.id} showRecord={false} />}
          {tab === "tasks" && <TaskList tasks={tasks} defaultRecordId={record.id} />}
          {tab === "files" && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex h-[43px] shrink-0 items-center justify-end border-b border-line px-3">
                <Button variant="primary" className="h-7 px-2" disabled={uploading} onClick={() => fileRef.current?.click()} data-testid="upload-file"><Upload size={13} />{uploading ? t("rec.files.uploading") : t("rec.files.upload")}</Button>
                <input ref={fileRef} type="file" className="hidden" data-testid="file-input" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
              </div>
              {files.length === 0 ? <EmptyState kind="doc" title={t("rec.files.empty")} text={t("rec.files.emptyText")} /> : (
                <div className="scroll-thin flex-1 overflow-y-auto">
                  {files.map((f) => {
                    const u = users.find((x) => x.id === f.uploaderId);
                    return (
                      <div key={f.id} className="flex h-11 items-center gap-3 border-b border-line px-4 text-[13px] hover:bg-[#fafafb]" data-testid="file-row">
                        <Paperclip size={14} className="text-ink-3" />
                        <a href={`/api/files/${f.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">{f.name}</a>
                        <span className="w-20 text-right text-ink-3">{f.size < 1024 * 1024 ? `${Math.max(1, Math.round(f.size / 1024))} KB` : `${(f.size / 1048576).toFixed(1)} MB`}</span>
                        <span className="w-32 truncate text-ink-2">{u?.name}</span>
                        <span className="w-28 text-right text-[12px] text-ink-3" suppressHydrationWarning>{relativeTime(f.createdAt, locale)}</span>
                        <a href={`/api/files/${f.id}`} className="rounded p-1 text-ink-3 hover:bg-hover" aria-label="Download"><Download size={13} /></a>
                        <button onClick={async () => { if (!confirm(t("rec.files.confirmDelete"))) return; await api(`/api/files/${f.id}`, "DELETE"); router.refresh(); }} className="rounded p-1 text-ink-3 hover:bg-hover" aria-label={t("common.delete")}><Trash2 size={13} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {relationTabs.map((r) => tab === `rel-${r.attr.slug}` && (
            <div key={r.attr.id} className="scroll-thin flex-1 overflow-y-auto" data-testid="relation-tab">
              {r.records.length === 0 ? <EmptyState kind="doc" title={t("rec.related.none", { object: r.attr.name })} text="" /> : (
                <table className="w-full border-separate border-spacing-0 text-[13px]">
                  <thead><tr>{[r.object.singular, ...r.attrs.filter((a) => !a.isPrimary).slice(0, 3).map((a) => a.name)].map((h) => <th key={h} className="h-9 border-b border-line px-4 text-left font-medium">{h}</th>)}</tr></thead>
                  <tbody>
                    {r.records.map((x) => {
                      const nm = recordName(x.values, r.attrs, t("common.noName"));
                      return (
                        <tr key={x.id} className="hover:bg-[#fafafb]">
                          <td className="h-9 border-b border-line px-4"><Link href={`/objects/${r.object.slug}/${x.id}`} className="inline-flex items-center gap-2 font-medium hover:underline"><RecordIcon object={r.object} name={nm} values={x.values} />{nm}</Link></td>
                          {r.attrs.filter((a) => !a.isPrimary).slice(0, 3).map((a) => <td key={a.id} className="h-9 max-w-[240px] border-b border-line px-4"><div className="flex min-w-0 overflow-hidden"><ValueDisplay attr={a} value={x.values[a.slug]} /></div></td>)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </section>
      </div>
      {modal === "note" && <NoteModal note={null} defaultRecordId={record.id} onClose={() => { setModal(null); }} />}
      {modal === "task" && <TaskModal task={null} defaultRecordId={record.id} onClose={() => setModal(null)} />}
      {modal === "attr" && <AddAttributeModal objectSlug={object.slug} onClose={() => setModal(null)} />}
    </>
  );
}
