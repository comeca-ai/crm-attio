"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { ArrowDownUp, Calendar, Check, Filter, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "./empty-state";
import { useCrm } from "./crm-context";
import { Avatar, Button, Field, MenuItem, Modal, Popover, api, inputCls, useSynced } from "./ui";

export type TaskLite = {
  id: string; content: string; dueDate: string | null; completed: boolean; completedAt: string | null;
  assigneeId: string | null; recordId: string | null; createdAt: string;
};

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const dayDiff = (iso: string) => Math.round((startOfDay(new Date(iso)).getTime() - startOfDay(new Date()).getTime()) / 86400000);

export function dueLabel(iso: string | null) {
  if (!iso) return "";
  const d = dayDiff(iso);
  if (d === 0) return "Hoje";
  if (d === 1) return "Amanhã";
  if (d === -1) return "Ontem";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

function groupOf(t: TaskLite) {
  if (t.completed) return "Concluídas";
  if (!t.dueDate) return "Sem data";
  const d = dayDiff(t.dueDate);
  if (d < 0) return "Atrasadas";
  if (d === 0) return "Hoje";
  if (d === 1) return "Amanhã";
  if (d <= 7) return "Próximos 7 dias";
  return "Mais tarde";
}
const ORDER = ["Atrasadas", "Hoje", "Amanhã", "Próximos 7 dias", "Mais tarde", "Sem data", "Concluídas"];

export function TaskList({ tasks: initial, defaultRecordId, filterable = false }: { tasks: TaskLite[]; defaultRecordId?: string; filterable?: boolean }) {
  const router = useRouter();
  const { me, users, relIndex } = useCrm();
  const [tasks, setTasks] = useSynced(initial);
  const [modal, setModal] = useState<TaskLite | "new" | null>(null);
  const [who, setWho] = useState<"me" | "all">(filterable ? "me" : "all");
  const [showDone, setShowDone] = useState(false);

  const visible = tasks.filter((t) => (who === "all" || t.assigneeId === me.id) && (showDone || !t.completed));
  const groups = useMemo(() => {
    const m = new Map<string, TaskLite[]>();
    for (const t of visible) {
      const g = groupOf(t);
      m.set(g, [...(m.get(g) ?? []), t]);
    }
    return ORDER.filter((g) => m.has(g)).map((g) => [g, m.get(g)!] as const);
  }, [visible]);

  const toggle = async (t: TaskLite) => {
    setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, completed: !x.completed } : x)));
    await api(`/api/tasks/${t.id}`, "PATCH", { completed: !t.completed });
    router.refresh();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between border-b px-3">
        <div className="flex items-center gap-1.5">
          <span className="flex h-7 items-center gap-1.5 rounded-lg border border-line-2 px-2 text-[13px] text-ink-2"><ArrowDownUp size={13} /> Ordenado por <b className="font-medium text-ink">data de vencimento</b></span>
          <Popover
            width={220}
            trigger={(_, toggle) => (
              <button onClick={toggle} className={clsx("flex h-7 items-center gap-1.5 rounded-md px-2 text-[13px] hover:bg-hover", who === "me" || showDone ? "bg-[#f2f6fe] text-[#1d4ed8]" : "text-ink-2")}>
                <Filter size={13} /> Filtro{who === "me" && filterable ? ": minhas tarefas" : ""}
              </button>
            )}
          >
            {() => (
              <div className="p-1">
                {filterable && (
                  <>
                    <MenuItem active={who === "me"} onClick={() => setWho("me")}>Minhas tarefas</MenuItem>
                    <MenuItem active={who === "all"} onClick={() => setWho("all")}>Todas as tarefas</MenuItem>
                    <div className="my-1 border-t" />
                  </>
                )}
                <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-hover">
                  <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="h-3.5 w-3.5 accent-[#266df0]" /> Mostrar concluídas
                </label>
              </div>
            )}
          </Popover>
        </div>
        <Button variant="primary" className="h-7" onClick={() => setModal("new")}><Plus size={14} /> Nova tarefa</Button>
      </div>
      <div className="scroll-thin flex flex-1 flex-col overflow-y-auto">
        {groups.length === 0 && (
          <EmptyState
            kind="task"
            title={tasks.length === 0 ? "Tarefas" : "Tudo em dia por aqui"}
            text={tasks.length === 0 ? "Nenhuma tarefa ainda. Crie a primeira para começar." : "Nenhuma tarefa pendente com esse filtro."}
            action={<Button variant="primary" onClick={() => setModal("new")}><Plus size={14} /> Nova tarefa</Button>}
          />
        )}
        {groups.map(([g, list]) => (
          <section key={g}>
            <div className={clsx("sticky top-0 z-10 flex items-center gap-2 border-b bg-panel px-4 py-1.5 text-[12.5px] font-medium", g === "Atrasadas" ? "text-red-600" : "text-ink-2")}>
              {g} <span className="font-normal text-ink-3">{list.length}</span>
            </div>
            {list.map((t) => {
              const u = users.find((x) => x.id === t.assigneeId);
              const rec = t.recordId ? relIndex[t.recordId] : null;
              const overdue = !t.completed && t.dueDate && dayDiff(t.dueDate) < 0;
              return (
                <div key={t.id} className="group flex h-11 items-center gap-3 border-b px-4 hover:bg-[#fafafa]">
                  <button
                    onClick={() => toggle(t)}
                    aria-label={t.completed ? "Reabrir tarefa" : "Concluir tarefa"}
                    className={clsx("flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px]", t.completed ? "border-[#266df0] bg-[#266df0] text-white" : "border-[#c4c6cc] hover:border-[#266df0]")}
                  >
                    {t.completed && <Check size={11} strokeWidth={3} />}
                  </button>
                  <button onClick={() => setModal(t)} className={clsx("min-w-0 flex-1 truncate text-left text-[13.5px]", t.completed && "text-ink-3 line-through")}>{t.content}</button>
                  {rec && (
                    <Link href={`/objects/${rec.objectSlug}/${t.recordId}`} className="hidden max-w-[220px] items-center gap-1.5 truncate rounded-md border border-line-2 px-1.5 py-[1px] text-[12.5px] hover:bg-hover md:inline-flex">
                      <Avatar name={rec.name} size={14} square={rec.objectSlug !== "people"} />
                      <span className="truncate">{rec.name}</span>
                    </Link>
                  )}
                  {t.dueDate && (
                    <span className={clsx("inline-flex w-[84px] items-center gap-1 text-[12.5px]", overdue ? "text-red-600" : "text-ink-2")}>
                      <Calendar size={12} /> {dueLabel(t.dueDate)}
                    </span>
                  )}
                  {u ? <span title={u.name}><Avatar name={u.name} color={u.avatarColor} size={20} /></span> : <span className="w-5" />}
                </div>
              );
            })}
          </section>
        ))}
      </div>
      {modal && <TaskModal task={modal === "new" ? null : modal} defaultRecordId={defaultRecordId} onClose={() => setModal(null)} />}
    </div>
  );
}

export function TaskModal({ task, defaultRecordId, onClose }: { task: TaskLite | null; defaultRecordId?: string; onClose: () => void }) {
  const router = useRouter();
  const { me, users, relOptions, objects } = useCrm();
  const [content, setContent] = useState(task?.content ?? "");
  const [due, setDue] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : "");
  const [assignee, setAssignee] = useState(task ? task.assigneeId ?? "" : me.id);
  const [recordId, setRecordId] = useState(task?.recordId ?? defaultRecordId ?? "");
  const [err, setErr] = useState("");

  const save = async () => {
    try {
      const body = { content, dueDate: due ? `${due}T12:00:00` : null, assigneeId: assignee || null, recordId: recordId || null };
      if (task) await api(`/api/tasks/${task.id}`, "PATCH", body);
      else await api("/api/tasks", "POST", body);
      router.refresh();
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const remove = async () => {
    if (!task || !confirm("Excluir esta tarefa?")) return;
    await api(`/api/tasks/${task.id}`, "DELETE");
    router.refresh();
    onClose();
  };

  return (
    <Modal title={task ? "Editar tarefa" : "Nova tarefa"} onClose={onClose}>
      <Field label="Tarefa">
        <input autoFocus className={inputCls} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Ex.: Enviar proposta revisada" onKeyDown={(e) => e.key === "Enter" && save()} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prazo">
          <input type="date" className={inputCls} value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <Field label="Responsável">
          <select className={inputCls} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Ninguém</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Registro vinculado">
        <select className={inputCls} value={recordId} onChange={(e) => setRecordId(e.target.value)}>
          <option value="">Nenhum</option>
          {objects.map((o) => (
            <optgroup key={o.id} label={o.plural}>
              {(relOptions[o.id] ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </optgroup>
          ))}
        </select>
      </Field>
      {err && <p className="mb-2 text-[12px] text-red-600">{err}</p>}
      <div className="flex items-center justify-between">
        {task ? <Button variant="ghost" className="text-red-600" onClick={remove}><Trash2 size={14} /> Excluir</Button> : <span />}
        <div className="flex gap-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={save}>{task ? "Salvar" : "Criar tarefa"}</Button>
        </div>
      </div>
    </Modal>
  );
}
