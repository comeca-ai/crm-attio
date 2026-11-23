"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowDown, ArrowUp, CheckSquare, CornerDownLeft, FileText, Home, Plus, Search } from "lucide-react";
import { Avatar, ObjectIcon, api } from "./ui";
import { useCrm } from "./crm-context";
import { TaskModal } from "./tasks";
import { NoteModal } from "./notes";

type Hit = { id: string; name: string; subtitle: string; objectSlug: string; objectName: string; icon: string; color: string };
type Item = { key: string; label: string; sub?: string; icon: React.ReactNode; group: string; run: () => void };

export function CommandPalette() {
  const { objects, relIndex } = useCrm();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [hi, setHi] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ kind: "task" | "note"; recordId?: string } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (r.ok) setHits(await r.json());
      setHi(0);
      setLoading(false);
    }, 120);
    return () => clearTimeout(t);
  }, [q, open]);

  const close = useCallback(() => { setOpen(false); setQ(""); }, []);

  const m = pathname.match(/^\/objects\/[^/]+\/([^/]+)$/);
  const ctxId = m?.[1];
  const ctx = ctxId ? relIndex[ctxId] : undefined;

  const createRecord = async (slug: string) => {
    const name = q.trim();
    const r = await api<{ id: string }>(`/api/objects/${slug}/records`, "POST", { values: name ? { name } : {} });
    router.push(`/objects/${slug}/${r.id}`);
    router.refresh();
  };

  const match = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase());
  const ctxItems: Item[] = ctx && ctxId
    ? [
        { key: "ctx-note", label: "Criar nota", sub: ctx.name, icon: <FileText size={15} className="text-ink-2" />, group: ctx.name, run: () => setModal({ kind: "note", recordId: ctxId }) },
        { key: "ctx-task", label: "Criar tarefa", sub: ctx.name, icon: <CheckSquare size={15} className="text-ink-2" />, group: ctx.name, run: () => setModal({ kind: "task", recordId: ctxId }) },
      ].filter((i) => match(i.label))
    : [];
  const actions: Item[] = [
    { key: "a-task", label: "Criar tarefa", icon: <CheckSquare size={15} className="text-ink-2" />, group: "Ações rápidas", run: () => setModal({ kind: "task" }) },
    { key: "a-note", label: "Criar nota", icon: <FileText size={15} className="text-ink-2" />, group: "Ações rápidas", run: () => setModal({ kind: "note" }) },
    ...objects.map((o) => ({
      key: `a-new-${o.slug}`,
      label: `Adicionar ${o.singular.toLowerCase()}`,
      sub: q.trim() ? `“${q.trim()}”` : undefined,
      icon: <Plus size={15} className="text-ink-2" />,
      group: "Ações rápidas",
      run: () => { createRecord(o.slug); },
    })),
  ].filter((i) => !q || match(i.label) || i.key.startsWith("a-new"));
  const nav: Item[] = [
    { key: "n-home", label: "Ir para Início", icon: <Home size={15} className="text-ink-2" />, group: "Navegação", run: () => router.push("/home") },
    { key: "n-tasks", label: "Ir para Tarefas", icon: <CheckSquare size={15} className="text-ink-2" />, group: "Navegação", run: () => router.push("/tasks") },
    { key: "n-notes", label: "Ir para Notas", icon: <FileText size={15} className="text-ink-2" />, group: "Navegação", run: () => router.push("/notes") },
    ...objects.map((o) => ({ key: `n-${o.slug}`, label: `Ir para ${o.plural}`, icon: <ObjectIcon icon={o.icon} color={o.color} size={15} solid />, group: "Navegação", run: () => router.push(`/objects/${o.slug}`) })),
  ].filter((i) => match(i.label));
  const recs: Item[] = hits.map((h) => ({
    key: h.id,
    label: h.name,
    sub: h.subtitle || h.objectName,
    icon: <Avatar name={h.name} size={18} square={h.objectSlug !== "people"} />,
    group: "Registros",
    run: () => router.push(`/objects/${h.objectSlug}/${h.id}`),
  }));
  // Com busca digitada, registros vêm primeiro; sem busca, ações primeiro
  const items = q ? [...ctxItems, ...recs, ...actions, ...nav] : [...ctxItems, ...actions, ...recs.slice(0, 5), ...nav];
  const go = (i: Item | undefined) => {
    if (!i) return;
    i.run();
    close();
  };

  let lastGroup = "";
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/10 pt-[14vh]" onMouseDown={close}>
          <div data-testid="palette" className="w-[620px] overflow-hidden rounded-2xl border border-line-2 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.20)]" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b px-4">
              <Search size={16} className="text-ink-3" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") close();
                  if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, items.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
                  if (e.key === "Enter") go(items[hi]);
                }}
                placeholder="Buscar ações rápidas e registros…"
                className="h-12 w-full bg-transparent text-[14.5px] outline-none placeholder:text-ink-3"
              />
              <kbd className="font-sans text-[11px] text-ink-3">ESC</kbd>
            </div>
            <div className="scroll-thin max-h-[380px] overflow-y-auto p-1.5">
              {items.length === 0 && <div className="px-3 py-6 text-center text-[13px] text-ink-3">{loading ? "Buscando…" : `Nenhum resultado para “${q}”`}</div>}
              {items.map((it, i) => {
                const header = it.group !== lastGroup ? it.group : null;
                lastGroup = it.group;
                return (
                  <div key={it.key}>
                    {header && <div className="truncate px-2.5 pb-1 pt-2 text-[12px] font-medium text-ink-3">{header}</div>}
                    <button
                      onMouseEnter={() => setHi(i)}
                      onClick={() => go(it)}
                      className={clsx("flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13.5px]", i === hi && "bg-hover")}
                    >
                      {it.icon}
                      <span className="truncate font-medium">{it.label}</span>
                      {it.sub && <span className="truncate text-[12.5px] text-ink-3">{it.sub}</span>}
                      {i === hi && <CornerDownLeft size={13} className="ml-auto shrink-0 text-ink-3" />}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex h-10 items-center justify-between border-t px-3 text-[12px] text-ink-3">
              <span className="flex items-center gap-1"><ArrowUp size={12} /><ArrowDown size={12} /> Navegar</span>
              <span className="flex items-center gap-1">Abrir <CornerDownLeft size={12} /></span>
            </div>
          </div>
        </div>
      )}
      {modal?.kind === "task" && <TaskModal task={null} defaultRecordId={modal.recordId} onClose={() => setModal(null)} />}
      {modal?.kind === "note" && <NoteModal note={null} defaultRecordId={modal.recordId} onClose={() => setModal(null)} />}
    </>
  );
}
