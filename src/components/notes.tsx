"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { ArrowDownUp, FileText, LayoutGrid, List as ListIcon, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "./empty-state";
import { useCrm } from "./crm-context";
import { Avatar, Button, Field, Modal, api, inputCls , useSynced } from "./ui";
import { relativeTime } from "@/lib/format";

export type NoteLite = { id: string; recordId: string; title: string; content: string; authorId: string; createdAt: string; updatedAt: string };

export function NotesGrid({ notes: initial, defaultRecordId, showRecord = true }: { notes: NoteLite[]; defaultRecordId?: string; showRecord?: boolean }) {
  const { users, relIndex } = useCrm();
  const [notes] = useSynced(initial);
  const [open, setOpen] = useState<NoteLite | "new" | null>(null);
  const [mode, setMode] = useState<"list" | "grid">("list");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between border-b px-3">
        <span className="flex h-7 items-center gap-1.5 rounded-lg border border-line-2 px-2 text-[13px] text-ink-2"><ArrowDownUp size={13} /> Ordenado por <b className="font-medium text-ink">data de criação</b></span>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-line-2 p-0.5">
            <button onClick={() => setMode("list")} aria-label="Lista" className={clsx("flex h-6 w-6 items-center justify-center rounded-md", mode === "list" ? "bg-hover text-ink" : "text-ink-3")}><ListIcon size={13} /></button>
            <button onClick={() => setMode("grid")} aria-label="Grade" className={clsx("flex h-6 w-6 items-center justify-center rounded-md", mode === "grid" ? "bg-hover text-ink" : "text-ink-3")}><LayoutGrid size={13} /></button>
          </div>
          <Button variant="primary" className="h-7" onClick={() => setOpen("new")}><Plus size={14} /> Nova nota</Button>
        </div>
      </div>
      <div className="scroll-thin flex flex-1 flex-col overflow-y-auto">
        {notes.length === 0 && (
          <EmptyState kind="note" title="Notas" text="Nenhuma nota ainda. Registre o contexto de reuniões e conversas." action={<Button variant="primary" onClick={() => setOpen("new")}><Plus size={14} /> Nova nota</Button>} />
        )}
        {mode === "list" ? (
          <div>
            {notes.map((n) => {
              const a = users.find((u) => u.id === n.authorId);
              const rec = relIndex[n.recordId];
              return (
                <button key={n.id} onClick={() => setOpen(n)} className="flex h-12 w-full items-center gap-3 border-b px-4 text-left hover:bg-[#fafafa]">
                  <FileText size={15} className="shrink-0 text-ink-3" />
                  <span className="w-[260px] shrink-0 truncate text-[13.5px] font-medium">{n.title}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink-3">{n.content.replace(/\n/g, " ")}</span>
                  {showRecord && rec && <span className="inline-flex max-w-[200px] shrink-0 items-center gap-1.5 truncate rounded-md border border-line-2 px-1.5 text-[12.5px]"><Avatar name={rec.name} size={14} square={rec.objectSlug !== "people"} />{rec.name}</span>}
                  {a && <Avatar name={a.name} color={a.avatarColor} size={18} />}
                  <span className="w-[80px] shrink-0 text-right text-[12px] text-ink-3">{relativeTime(n.createdAt)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 p-4">
            {notes.map((n) => {
              const a = users.find((u) => u.id === n.authorId);
              const rec = relIndex[n.recordId];
              return (
                <button key={n.id} onClick={() => setOpen(n)} className="flex h-[168px] flex-col rounded-xl border border-line-2 bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#d0d2d7]">
                  <div className="flex items-center gap-1.5 text-[13.5px] font-semibold"><FileText size={14} className="shrink-0 text-ink-3" /><span className="truncate">{n.title}</span></div>
                  <p className="mt-1.5 line-clamp-4 flex-1 whitespace-pre-line text-[13px] text-ink-2">{n.content || "Sem conteúdo"}</p>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[12px] text-ink-3">
                    <span className="flex items-center gap-1.5 truncate">{a && <Avatar name={a.name} color={a.avatarColor} size={16} />}{relativeTime(n.updatedAt)}</span>
                    {showRecord && rec && <span className="truncate rounded-md border border-line-2 px-1.5">{rec.name}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {open && <NoteModal note={open === "new" ? null : open} defaultRecordId={defaultRecordId} onClose={() => setOpen(null)} />}
    </div>
  );
}

export function NoteModal({ note, defaultRecordId, onClose }: { note: NoteLite | null; defaultRecordId?: string; onClose: () => void }) {
  const router = useRouter();
  const { objects, relOptions, relIndex } = useCrm();
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [recordId, setRecordId] = useState(note?.recordId ?? defaultRecordId ?? "");
  const [err, setErr] = useState("");

  const save = async () => {
    try {
      if (note) await api(`/api/notes/${note.id}`, "PATCH", { title, content });
      else await api("/api/notes", "POST", { title, content, recordId });
      router.refresh();
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const remove = async () => {
    if (!note || !confirm("Excluir esta nota?")) return;
    await api(`/api/notes/${note.id}`, "DELETE");
    router.refresh();
    onClose();
  };
  const rec = note ? relIndex[note.recordId] : null;

  return (
    <Modal title={note ? "Nota" : "Nova nota"} onClose={onClose} width={620}>
      {!note && !defaultRecordId && (
        <Field label="Registro">
          <select className={inputCls} value={recordId} onChange={(e) => setRecordId(e.target.value)}>
            <option value="">Escolha a empresa, pessoa ou negócio…</option>
            {objects.map((o) => (
              <optgroup key={o.id} label={o.plural}>
                {(relOptions[o.id] ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
      )}
      {rec && (
        <Link href={`/objects/${rec.objectSlug}/${note!.recordId}`} onClick={onClose} className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-line-2 px-1.5 py-[1px] text-[12.5px] hover:bg-hover">
          <Avatar name={rec.name} size={14} square /> {rec.name}
        </Link>
      )}
      <input autoFocus={!note} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="mb-2 w-full text-[18px] font-semibold outline-none placeholder:text-ink-3" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Escreva aqui…" className="h-56 w-full resize-none text-[14px] leading-6 outline-none placeholder:text-ink-3" />
      {err && <p className="mb-2 text-[12px] text-red-600">{err}</p>}
      <div className="flex items-center justify-between border-t pt-3">
        {note ? <Button variant="ghost" className="text-red-600" onClick={remove}><Trash2 size={14} /> Excluir</Button> : <span />}
        <div className="flex gap-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={save}>{note ? "Salvar" : "Criar nota"}</Button>
        </div>
      </div>
    </Modal>
  );
}
