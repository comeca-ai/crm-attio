"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowDownWideNarrow, Calendar, Check, ListFilter, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { useI18n } from "@/i18n/client";
import type { Locale, MessageKey } from "@/i18n/dict";
import { EmptyState, LearnMore } from "./empty-state";
import { useCrm } from "./crm-context";
import { Avatar, Button, Field, MenuItem, Modal, Popover, ToolButton, api, inputCls, useSynced } from "./ui";
import { RecordChip } from "./values";
import { dueDayDiff, dueFromInput } from "@/lib/time";

export type TaskLite = {
  id: string; content: string; dueDate: string | null; completed: boolean; completedAt: string | null;
  assigneeId: string | null; recordId: string | null; createdAt: string;
};


export function dueLabel(iso: string | null, locale: Locale, t: (k: MessageKey) => string, tz?: string) {
  if (!iso) return "";
  const d = dueDayDiff(iso, tz);
  if (d === 0) return t("common.today");
  if (d === 1) return t("common.tomorrow");
  if (d === -1) return t("common.yesterday");
  return new Date(iso).toLocaleDateString(locale === "pt-BR" ? "pt-BR" : "en-US", { day: "numeric", month: "short", timeZone: "UTC" }).replace(".", "");
}

type Group = "overdue" | "today" | "tomorrow" | "week" | "later" | "noDate" | "done";
function groupOf(t: TaskLite, tz?: string): Group {
  if (t.completed) return "done";
  if (!t.dueDate) return "noDate";
  const d = dueDayDiff(t.dueDate, tz);
  if (d < 0) return "overdue";
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d <= 7) return "week";
  return "later";
}
const ORDER: Group[] = ["overdue", "today", "tomorrow", "week", "later", "noDate", "done"];

export function TaskRow({ task, onToggle, onOpen, showRecord = true }: { task: TaskLite; onToggle: () => void; onOpen: () => void; showRecord?: boolean }) {
  const { t, locale } = useI18n();
  const { users, me } = useCrm();
  const u = users.find((x) => x.id === task.assigneeId);
  const overdue = !task.completed && task.dueDate && dueDayDiff(task.dueDate, me.timezone) < 0;
  return (
    <div className="group flex h-10 items-center gap-3 border-b border-line px-4 hover:bg-[#fafafb]" data-testid="task-row">
      <button onClick={onToggle} aria-label={task.completed ? t("tasks.reopen") : t("tasks.complete")}
        className={clsx("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px]", task.completed ? "border-[#266df0] bg-[#266df0] text-white" : "border-[#c4c6cc] hover:border-[#266df0]")}>
        {task.completed && <Check size={10} strokeWidth={3} />}
      </button>
      <button onClick={onOpen} className={clsx("min-w-0 flex-1 truncate text-left text-[13px]", task.completed && "text-ink-3 line-through")}>{task.content}</button>
      {showRecord && task.recordId && <span className="hidden max-w-[220px] md:inline-flex"><RecordChip id={task.recordId} /></span>}
      {task.dueDate && (
        <span className={clsx("inline-flex w-[84px] items-center gap-1 text-[12.5px]", overdue ? "text-red-600" : "text-ink-2")}><Calendar size={12} />{dueLabel(task.dueDate, locale, t, me.timezone)}</span>
      )}
      {u ? <span title={u.name}><Avatar name={u.name} color={u.avatarColor} size={18} /></span> : <span className="w-[18px]" />}
    </div>
  );
}

export function TaskList({ tasks: initial, defaultRecordId, filterable = false }: { tasks: TaskLite[]; defaultRecordId?: string; filterable?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const { me } = useCrm();
  const [tasks, setTasks] = useSynced(initial);
  const [modal, setModal] = useState<TaskLite | "new" | null>(null);
  const [who, setWho] = useState<"me" | "all">("all");
  const [showDone, setShowDone] = useState(false);

  const visible = tasks.filter((x) => (who === "all" || x.assigneeId === me.id) && (showDone || !x.completed));
  const groups = useMemo(() => {
    const m = new Map<Group, TaskLite[]>();
    for (const x of visible) m.set(groupOf(x, me.timezone), [...(m.get(groupOf(x, me.timezone)) ?? []), x]);
    return ORDER.filter((g) => m.has(g)).map((g) => [g, m.get(g)!] as const);
  }, [visible, me.timezone]);

  const toggle = async (x: TaskLite) => {
    setTasks((ts) => ts.map((y) => (y.id === x.id ? { ...y, completed: !y.completed } : y)));
    await api(`/api/tasks/${x.id}`, "PATCH", { completed: !x.completed });
    router.refresh();
  };
  const filtered = who === "me" || showDone;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-[43px] shrink-0 items-center justify-between border-b border-line px-3">
        <div className="flex items-center gap-1.5">
          <span className="flex h-7 items-center gap-1.5 rounded-lg border border-line-2 px-2 text-[13px]"><ArrowDownWideNarrow size={13} className="text-ink-2" /><span className="text-ink-2">{t("common.sortedBy")}</span><span className="font-medium">{t("common.dueDate")}</span></span>
          <Popover width={220} trigger={(_, toggleP) => (
            <button onClick={toggleP} className={clsx("flex h-7 items-center gap-1.5 rounded-lg px-2 text-[13px]", filtered ? "border border-[#c9dafc] bg-[#eef4ff] text-[#1d5bd8]" : "border border-line-2 text-ink-2 hover:bg-hover")} data-testid="tasks-filter">
              <ListFilter size={13} />{t("common.filter")}
            </button>
          )}>
            {() => (
              <div className="p-1">
                {filterable && (<><MenuItem active={who === "me"} onClick={() => setWho("me")}>{t("tasks.mine")}</MenuItem><MenuItem active={who === "all"} onClick={() => setWho("all")}>{t("tasks.all")}</MenuItem><div className="my-1 border-t" /></>)}
                <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-hover">
                  <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="h-3.5 w-3.5 accent-[#266df0]" />{t("tasks.showCompleted")}
                </label>
              </div>
            )}
          </Popover>
        </div>
        <div className="flex items-center gap-1.5">
          {filterable && <ToolButton><SlidersHorizontal size={13} className="text-ink-2" />{t("common.viewSettings")}</ToolButton>}
          <Button variant="primary" className="h-7 px-2" onClick={() => setModal("new")} data-testid="new-task"><Plus size={14} />{t("tasks.new")}</Button>
        </div>
      </div>
      <div className="scroll-thin flex flex-1 flex-col overflow-y-auto">
        {groups.length === 0 && (
          <>
            <EmptyState kind="task" title={tasks.length === 0 ? t("tasks.emptyTitle") : t("tasks.allDone")} text={tasks.length === 0 ? t("tasks.emptyText") : t("tasks.allDoneText")}
              action={<Button variant="primary" className="h-7" onClick={() => setModal("new")}><Plus size={14} />{t("tasks.new")}</Button>} />
            {filterable && tasks.length === 0 && <LearnMore label={t("common.learnMore")} title={t("learn.introTasks")} />}
          </>
        )}
        {groups.map(([g, list]) => (
          <section key={g}>
            <div className={clsx("sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-[#fbfbfb] px-4 py-1.5 text-[12.5px] font-medium", g === "overdue" ? "text-red-600" : "text-ink-2")}>
              {t(`tasks.group.${g}` as MessageKey)} <span className="font-normal text-ink-3">{list.length}</span>
            </div>
            {list.map((x) => <TaskRow key={x.id} task={x} onToggle={() => toggle(x)} onOpen={() => setModal(x)} showRecord={!defaultRecordId} />)}
          </section>
        ))}
      </div>
      {modal && <TaskModal task={modal === "new" ? null : modal} defaultRecordId={defaultRecordId} onClose={() => setModal(null)} />}
    </div>
  );
}

export function TaskModal({ task, defaultRecordId, onClose }: { task: TaskLite | null; defaultRecordId?: string; onClose: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const { me, users, relOptions, objects } = useCrm();
  const [content, setContent] = useState(task?.content ?? "");
  const [due, setDue] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : "");
  const [assignee, setAssignee] = useState(task ? task.assigneeId ?? "" : me.id);
  const [recordId, setRecordId] = useState(task?.recordId ?? defaultRecordId ?? "");
  const [err, setErr] = useState("");

  const save = async () => {
    try {
      const body = { content, dueDate: due ? dueFromInput(due) : null, assigneeId: assignee || null, recordId: recordId || null };
      if (task) await api(`/api/tasks/${task.id}`, "PATCH", body);
      else await api("/api/tasks", "POST", body);
      router.refresh();
      onClose();
    } catch (e) { setErr((e as Error).message); }
  };
  const remove = async () => {
    if (!task || !confirm(t("tasks.confirmDelete"))) return;
    await api(`/api/tasks/${task.id}`, "DELETE");
    router.refresh();
    onClose();
  };

  return (
    <Modal title={task ? t("tasks.edit") : t("tasks.new")} onClose={onClose}>
      <Field label={t("tasks.field.content")}>
        <input autoFocus className={inputCls} value={content} onChange={(e) => setContent(e.target.value)} placeholder={t("tasks.field.placeholder")} onKeyDown={(e) => e.key === "Enter" && save()} data-testid="task-content" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("tasks.field.due")}><input type="date" className={inputCls} value={due} onChange={(e) => setDue(e.target.value)} /></Field>
        <Field label={t("tasks.field.assignee")}>
          <select className={inputCls} value={assignee} onChange={(e) => setAssignee(e.target.value)} data-testid="task-assignee">
            <option value="">{t("tasks.field.noAssignee")}</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
      </div>
      <Field label={t("tasks.field.record")}>
        <select className={inputCls} value={recordId} onChange={(e) => setRecordId(e.target.value)}>
          <option value="">{t("tasks.field.noRecord")}</option>
          {objects.map((o) => <optgroup key={o.id} label={o.plural}>{(relOptions[o.id] ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</optgroup>)}
        </select>
      </Field>
      {err && <p className="mb-2 text-[12px] text-red-600">{err}</p>}
      <div className="flex items-center justify-between">
        {task ? <Button variant="ghost" className="text-red-600" onClick={remove}><Trash2 size={14} />{t("common.delete")}</Button> : <span />}
        <div className="flex gap-2"><Button onClick={onClose}>{t("common.cancel")}</Button><Button variant="primary" onClick={save} data-testid="task-save">{task ? t("common.save") : t("tasks.create")}</Button></div>
      </div>
    </Modal>
  );
}
