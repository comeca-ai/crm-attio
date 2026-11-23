"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore, useState } from "react";
import clsx from "clsx";
import { Calendar, Check, Search } from "lucide-react";
import { greeting } from "@/lib/labels";
import { relativeTime } from "@/lib/format";
import { useCrm } from "./crm-context";
import { Avatar, api } from "./ui";
import { dueLabel, TaskModal, type TaskLite } from "./tasks";

const noop = () => () => {};

export function HomeView({ name, tasks, activities }: { name: string; tasks: TaskLite[]; activities: { id: string; kind: string; message: string; actorId: string | null; createdAt: string; recordId: string }[] }) {
  const router = useRouter();
  const { users, relIndex } = useCrm();
  // Saudação pelo relógio de quem está usando (evita fuso do servidor)
  const hello = useSyncExternalStore(noop, () => greeting(), () => "Olá");
  const [newTask, setNewTask] = useState(false);
  const [done, setDone] = useState<Set<string>>(new Set());

  const complete = async (t: TaskLite) => {
    setDone(new Set(done).add(t.id));
    await api(`/api/tasks/${t.id}`, "PATCH", { completed: true });
    router.refresh();
  };

  return (
    <div className="scroll-thin flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[640px] px-6 py-10">
        <h1 className="text-[20px] font-semibold tracking-[-0.01em]">{hello}, {name}.</h1>
        <button onClick={() => window.dispatchEvent(new Event("open-palette"))} className="mt-4 flex h-11 w-full items-center gap-2 rounded-xl border border-line-2 px-3.5 text-left text-[14px] text-ink-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[#d0d2d7]">
          <Search size={15} /> Buscar registros ou criar algo novo…
          <kbd className="ml-auto font-sans text-[11px] tracking-wide">CTRL K</kbd>
        </button>

        <section className="mt-10">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[13px] font-medium text-ink-2">Minhas tarefas</h2>
            <div className="flex gap-3 text-[12.5px]">
              <button onClick={() => setNewTask(true)} className="text-ink-2 hover:text-ink">Nova tarefa</button>
              <Link href="/tasks" className="text-ink-2 hover:text-ink">Ver todas</Link>
            </div>
          </div>
          {tasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line-2 px-4 py-6 text-center text-[13px] text-ink-3">Nenhuma tarefa pendente. Bom trabalho!</p>
          ) : (
            <div className="divide-y divide-line rounded-xl border border-line-2">
              {tasks.map((t) => {
                const rec = t.recordId ? relIndex[t.recordId] : null;
                const isDone = done.has(t.id);
                const overdue = t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
                return (
                  <div key={t.id} className="flex h-10 items-center gap-3 px-3">
                    <button onClick={() => complete(t)} aria-label="Concluir tarefa" className={clsx("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px]", isDone ? "border-[#266df0] bg-[#266df0] text-white" : "border-[#c4c6cc] hover:border-[#266df0]")}>
                      {isDone && <Check size={10} strokeWidth={3} />}
                    </button>
                    <span className={clsx("min-w-0 flex-1 truncate text-[13.5px]", isDone && "text-ink-3 line-through")}>{t.content}</span>
                    {rec && <Link href={`/objects/${rec.objectSlug}/${t.recordId}`} className="max-w-[160px] truncate rounded-md border border-line-2 px-1.5 text-[12px] text-ink-2 hover:bg-hover">{rec.name}</Link>}
                    {t.dueDate && <span className={clsx("flex items-center gap-1 text-[12px]", overdue ? "text-red-600" : "text-ink-3")}><Calendar size={11} />{dueLabel(t.dueDate)}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-2 text-[13px] font-medium text-ink-2">Atividade recente</h2>
          <div className="space-y-2.5">
            {activities.map((a) => {
              const u = users.find((x) => x.id === a.actorId);
              const rec = relIndex[a.recordId];
              return (
                <div key={a.id} className="flex items-center gap-2 text-[13px]">
                  {u && <Avatar name={u.name} color={u.avatarColor} size={18} />}
                  <span className="min-w-0 flex-1 truncate">
                    <b className="font-medium">{u?.name ?? "Sistema"}</b> <span className="text-ink-2">{a.message}</span>
                    {rec && <> <span className="text-ink-3">em</span> <Link href={`/objects/${rec.objectSlug}/${a.recordId}`} className="font-medium hover:underline">{rec.name}</Link></>}
                  </span>
                  <span className="shrink-0 text-[12px] text-ink-3">{relativeTime(a.createdAt)}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      {newTask && <TaskModal task={null} onClose={() => setNewTask(false)} />}
    </div>
  );
}
