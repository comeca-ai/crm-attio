"use client";
import { useState } from "react";
import Link from "next/link";
import { sameDayIn } from "@/lib/time";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowDownWideNarrow, AtSign, ChartColumn, CheckSquare, FileText, Inbox as InboxIcon, Lightbulb, ListFilter, Mail, Plus, Search, Send, SlidersHorizontal, SquarePen, Star, Video, Workflow, LayoutDashboard, Clock, Trash2 } from "lucide-react";
import { useI18n } from "@/i18n/client";
import type { MessageKey } from "@/i18n/dict";
import { fmtDateTime, relativeTime } from "@/lib/format";
import { TopBar, Crumb, AskAttioIcon } from "./topbar";
import { TopTabs } from "./top-tabs";
import { EmptyState, LearnMore } from "./empty-state";
import { Avatar, Button, ToolButton, Skeleton, api } from "./ui";
import { TaskList, type TaskLite } from "./tasks";
import { NotesGrid, type NoteLite } from "./notes";
import { useCrm } from "./crm-context";
import { RecordChip } from "./values";

function SortChip({ label }: { label: string }) {
  const { t } = useI18n();
  return <span className="flex h-7 items-center gap-1.5 rounded-lg border border-line-2 px-2 text-[13px]"><ArrowDownWideNarrow size={13} className="text-ink-2" /><span className="text-ink-2">{t("common.sortedBy")}</span><span className="font-medium">{label}</span></span>;
}
function FilterChip() {
  const { t } = useI18n();
  return <span className="flex h-7 items-center gap-1.5 rounded-lg border border-line-2 px-2 text-[13px] text-ink-2"><ListFilter size={13} />{t("common.filter")}</span>;
}
function Toolbar({ left, right }: { left?: React.ReactNode; right?: React.ReactNode }) {
  return <div className="flex h-[43px] shrink-0 items-center justify-between border-b border-line px-3"><div className="flex items-center gap-1.5">{left}</div><div className="flex items-center gap-1.5">{right}</div></div>;
}

export function TasksPage({ tasks }: { tasks: TaskLite[] }) {
  const { t } = useI18n();
  return (<><TopBar variant="helpAsk"><Crumb icon={<CheckSquare size={14} className="text-ink-2" />}>{t("tasks.title")}</Crumb></TopBar><TaskList tasks={tasks} filterable /></>);
}

export function NotesPage({ notes }: { notes: NoteLite[] }) {
  const { t } = useI18n();
  const [tab, setTab] = useState("notes");
  return (
    <>
      <TopBar variant="helpAsk"><TopTabs active={tab} onChange={setTab} tabs={[{ id: "notes", label: t("notes.title"), icon: <FileText size={13} />, count: notes.length }, { id: "templates", label: t("notes.templates"), icon: <FileText size={13} />, count: 0 }]} /></TopBar>
      {tab === "notes" ? <NotesGrid notes={notes} page /> : <EmptyState kind="note" title={t("notes.templates")} text={t("common.comingSoon")} />}
    </>
  );
}

export function EmailsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState("drafts");
  return (
    <>
      <TopBar variant="helpAsk"><TopTabs active={tab} onChange={setTab} tabs={[
        { id: "drafts", label: t("emails.drafts"), icon: <SquarePen size={13} />, count: 0 },
        { id: "outbox", label: t("emails.outbox"), icon: <InboxIcon size={13} />, count: 0 },
        { id: "templates", label: t("emails.templates"), icon: <FileText size={13} />, count: 0 },
      ]} /></TopBar>
      <Toolbar right={<Link href="/settings/email-calendar-accounts"><Button variant="primary" className="h-7 px-2"><Mail size={13} />{t("emails.compose")}</Button></Link>} />
      <EmptyState kind="mail" title={t("emails.emptyTitle")} text={t("emails.emptyText")} action={<Link href="/settings/email-calendar-accounts"><Button variant="primary" className="h-7">{t("emails.configure")}</Button></Link>} />
      <LearnMore label={t("common.learnMore")} title={t("learn.tasks")} />
    </>
  );
}

export function CallsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState("calls");
  return (
    <>
      <TopBar variant="helpAsk"><TopTabs active={tab} onChange={setTab} tabs={[{ id: "calls", label: t("calls.title"), icon: <Video size={13} />, count: 0 }, { id: "insights", label: t("calls.insights"), icon: <Lightbulb size={13} />, count: 0 }]} /></TopBar>
      <Toolbar left={<><SortChip label={t("common.date")} /><span className="mx-0.5 h-4 w-px bg-line-2" /><FilterChip /></>} right={<><button className="rounded-md p-1.5 text-ink-2 hover:bg-hover"><Search size={14} /></button><ToolButton><SlidersHorizontal size={13} className="text-ink-2" />{t("common.viewSettings")}</ToolButton></>} />
      <EmptyState kind="call" title={t("calls.emptyTitle")} text={t("calls.emptyText")} />
    </>
  );
}

function SimpleEmpty({ icon, title, newLabel, text, kind, learn }: { icon: React.ReactNode; title: string; newLabel: string; text: string; kind: "send" | "flow"; learn: MessageKey }) {
  const { t } = useI18n();
  return (
    <>
      <TopBar variant="helpAsk"><Crumb icon={icon}>{title}</Crumb></TopBar>
      <Toolbar left={<><SortChip label={t("common.creationDate")} /><span className="mx-0.5 h-4 w-px bg-line-2" /><FilterChip /></>}
        right={<><button className="rounded-md p-1.5 text-ink-2 hover:bg-hover"><Search size={14} /></button><ToolButton><SlidersHorizontal size={13} className="text-ink-2" />{t("common.viewSettings")}</ToolButton><Button variant="primary" className="h-7 px-2" onClick={() => alert(t("common.comingSoon"))}><Plus size={14} />{newLabel}</Button></>} />
      <EmptyState kind={kind} title={title} text={text} action={<Button variant="primary" className="h-7" onClick={() => alert(t("common.comingSoon"))}><Plus size={14} />{newLabel}</Button>} />
      <LearnMore label={t("common.learnMore")} title={t(learn)} />
    </>
  );
}
export function SequencesPage() {
  const { t } = useI18n();
  return <SimpleEmpty icon={<Send size={14} className="text-ink-2" />} title={t("sequences.title")} newLabel={t("sequences.new")} text={t("sequences.emptyText")} kind="send" learn="learn.records" />;
}
export function WorkflowsPage() {
  const { t } = useI18n();
  return <SimpleEmpty icon={<Workflow size={14} className="text-ink-2" />} title={t("workflows.title")} newLabel={t("workflows.new")} text={t("workflows.emptyText")} kind="flow" learn="learn.workflows" />;
}

export function ChatsPage({ q }: { q?: string }) {
  const { t } = useI18n();
  return (
    <>
      <TopBar variant="help"><Crumb icon={<AskAttioIcon />}>{t("chats.title")}</Crumb></TopBar>
      {q && <div className="mx-auto mt-10 max-w-[560px] rounded-xl border border-line bg-[#fafafb] px-4 py-3 text-[13.5px]">{q}</div>}
      <EmptyState kind="chat" title={t("chats.title")} text={t("chats.emptyText")} />
    </>
  );
}

type Notif = { id: string; href: string; kind: string; actorId: string | null; read: boolean; createdAt: string; data: { content?: string; title?: string; recordId?: string | null } };
export function InboxPage({ items }: { items: Notif[] }) {
  const { t, locale } = useI18n();
  const { users } = useCrm();
  const router = useRouter();
  const [tab, setTab] = useState("all");
  const list = items.filter((n) => tab === "all" || !n.read);
  const markAll = async () => { await api("/api/notifications", "PATCH", { all: true }); router.refresh(); };
  const open = async (n: Notif) => {
    if (!n.read) await api("/api/notifications", "PATCH", { ids: [n.id] });
    router.push(n.href);
    router.refresh();
  };
  return (
    <>
      <TopBar variant="help"><TopTabs active={tab} onChange={setTab} tabs={[{ id: "all", label: t("inbox.all"), icon: <InboxIcon size={13} /> }, { id: "unread", label: t("inbox.unread"), icon: <Clock size={13} />, count: items.filter((n) => !n.read).length }]} /></TopBar>
      <Toolbar left={<span className="text-[13px] font-medium">{t("inbox.title")}</span>} right={<Button className="h-7" onClick={markAll} data-testid="mark-all-read">{t("inbox.markAll")}</Button>} />
      {list.length === 0 ? <EmptyState kind="inbox" title={t("inbox.empty")} text={t("inbox.emptyText")} /> : (
        <div className="scroll-thin flex-1 overflow-y-auto">
          {list.map((n) => {
            const u = users.find((x) => x.id === n.actorId);
            return (
              <button key={n.id} onClick={() => open(n)} className="flex w-full items-center gap-3 border-b border-line px-4 py-2.5 text-left hover:bg-[#fafafb]" data-testid="inbox-item">
                <span className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-[#266df0]")} />
                {u ? <Avatar name={u.name} color={u.avatarColor} size={22} /> : <span className="h-[22px] w-[22px]" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px]"><b className="font-medium">{u?.name ?? t("common.system.actor")}</b> <span className="text-ink-2">{n.kind === "mention" ? t("inbox.mention") : t("inbox.taskAssigned")}</span></p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px] text-ink-2">{n.kind === "mention" ? <AtSign size={12} /> : <CheckSquare size={12} />}{n.data.content ?? n.data.title}{n.data.recordId && <RecordChip id={n.data.recordId} link={false} />}</p>
                </div>
                <span className="shrink-0 text-[12px] text-ink-3" title={fmtDateTime(n.createdAt, locale)} suppressHydrationWarning>{relativeTime(n.createdAt, locale)}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

type Dash = { id: string; name: string; favorite: boolean; createdAt: string; reports: number };
export function ReportsPage({ dashboards }: { dashboards: Dash[] }) {
  const { t, locale } = useI18n();
  const { me } = useCrm();
  const router = useRouter();
  const create = async () => { await api("/api/dashboards", "POST", { name: t("reports.untitled") }); router.refresh(); };
  const fav = async (d: Dash) => { await api(`/api/dashboards/${d.id}`, "PATCH", { favorite: !d.favorite }); router.refresh(); };
  const del = async (d: Dash) => { if (!confirm(t("common.confirmDelete", { name: d.name }))) return; await api(`/api/dashboards/${d.id}`, "DELETE"); router.refresh(); };
  const favs = dashboards.filter((d) => d.favorite);
  const today = dashboards.filter((d) => sameDayIn(new Date(d.createdAt), new Date(), me.timezone));
  const earlier = dashboards.filter((d) => !today.includes(d));
  const Row = ({ d }: { d: Dash }) => (
    <div className="group grid h-9 grid-cols-[1.2fr_1.6fr_1fr_60px] items-center border-b border-line px-3 text-[13px] hover:bg-[#fafafb]" data-testid="dashboard-row">
      <Link href={`/reports/${d.id}`} className="flex items-center gap-2 truncate font-medium hover:underline"><LayoutDashboard size={13} className="text-ink-3" />{d.name}</Link>
      <span className="text-ink-2">{t("reports.reportsCount", { n: d.reports })}</span>
      <span className="text-ink-2" suppressHydrationWarning>{relativeTime(d.createdAt, locale)}</span>
      <span className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100">
        <button onClick={() => fav(d)} className="rounded p-1 text-ink-3 hover:bg-hover" title={d.favorite ? t("reports.unfavorite") : t("reports.favorite")}><Star size={13} fill={d.favorite ? "#f5a524" : "none"} color={d.favorite ? "#f5a524" : "currentColor"} /></button>
        <button onClick={() => del(d)} className="rounded p-1 text-ink-3 hover:bg-hover"><Trash2 size={13} /></button>
      </span>
    </div>
  );
  return (
    <>
      <TopBar variant="helpAsk"><Crumb icon={<ChartColumn size={14} className="text-ink-2" />}>{t("reports.title")}</Crumb></TopBar>
      <Toolbar left={<SortChip label={t("common.creationDate")} />} right={<><button className="rounded-md p-1.5 text-ink-2 hover:bg-hover"><Search size={14} /></button><ToolButton><SlidersHorizontal size={13} className="text-ink-2" />{t("common.viewSettings")}</ToolButton><Button variant="primary" className="h-7 px-2" onClick={create} data-testid="new-dashboard"><Plus size={14} />{t("reports.new")}</Button></>} />
      <div className="scroll-thin flex-1 overflow-y-auto">
        <div className="px-3 pt-2.5">
          <p className="text-[12px] font-medium text-ink-2">{t("reports.favorites")}</p>
          {favs.length === 0 ? (
            <div className="mt-2 flex h-[148px] flex-col items-center justify-center rounded-lg border border-dashed border-[#d9dadf] text-center">
              <p className="text-[14px] font-semibold text-ink-2">{t("reports.favorites")}</p><p className="mt-1 text-[12.5px] text-ink-3">{t("reports.favoritesText")}</p>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">{favs.map((d) => <div key={d.id} className="flex items-center gap-2 rounded-xl border border-line p-3 text-[13px] font-medium"><LayoutDashboard size={14} className="text-ink-3" />{d.name}</div>)}</div>
          )}
        </div>
        <div className="mt-1.5 grid h-[30px] grid-cols-[1.2fr_1.6fr_1fr_60px] items-center border-y border-line px-3 text-[12.5px] text-ink-2">
          <span>{t("reports.col.dashboard")}</span><span className="flex items-center gap-1.5"><ChartColumn size={12} />{t("reports.col.reports")}</span><span className="flex items-center gap-1.5"><Clock size={12} />{t("reports.col.created")}</span><span />
        </div>
        {today.length > 0 && (<><div className="flex h-8 items-center gap-1.5 border-b border-line px-3 text-[12.5px] text-ink-2">{t("common.createdToday")}<span className="rounded bg-[#efeff1] px-1 text-[11px]">{today.length}</span></div>{today.map((d) => <Row key={d.id} d={d} />)}</>)}
        {earlier.length > 0 && (<><div className="flex h-8 items-center gap-1.5 border-b border-line px-3 text-[12.5px] text-ink-2">{t("common.createdEarlier")}<span className="rounded bg-[#efeff1] px-1 text-[11px]">{earlier.length}</span></div>{earlier.map((d) => <Row key={d.id} d={d} />)}</>)}
      </div>
    </>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex flex-1 flex-col" data-testid="skeleton">
      <div className="flex h-[42px] items-center border-b border-line px-3"><Skeleton className="h-3 w-28" /></div>
      <div className="flex h-[43px] items-center gap-2 border-b border-line px-3"><Skeleton className="h-5 w-28 rounded-md" /><Skeleton className="h-5 w-24 rounded-md" /></div>
      <div className="flex h-[43px] items-center gap-2 border-b border-line px-3"><Skeleton className="h-5 w-36 rounded-md" /><Skeleton className="h-5 w-16 rounded-md" /></div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex h-8 items-center gap-6 border-b border-line px-3">
          <Skeleton className="h-2.5 w-40" /><Skeleton className="h-2.5 w-56" /><Skeleton className="h-2.5 w-32" /><Skeleton className="h-2.5 w-24" />
        </div>
      ))}
    </div>
  );
}

export function DashboardPage({ name, stats }: { name: string; stats: { label: MessageKey; value: string }[] }) {
  const { t } = useI18n();
  return (
    <>
      <TopBar variant="helpAsk"><Crumb icon={<ChartColumn size={14} className="text-ink-2" />} href="/reports">{t("reports.title")}</Crumb><span className="text-ink-3">/</span><span className="font-medium">{name}</span></TopBar>
      <div className="scroll-thin flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" data-testid="report-stats">
          {stats.map((s) => <div key={s.label} className="rounded-xl border border-line p-3"><p className="text-[12px] text-ink-2">{t(s.label)}</p><p className="mt-1.5 text-[17px] font-semibold tabular-nums">{s.value}</p></div>)}
        </div>
      </div>
    </>
  );
}
