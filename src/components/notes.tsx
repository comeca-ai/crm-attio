"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { ArrowDownWideNarrow, FileText, LayoutGrid, List as ListIcon, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { relativeTime } from "@/lib/format";
import { useI18n } from "@/i18n/client";
import { EmptyState, LearnMore } from "./empty-state";
import { useCrm } from "./crm-context";
import { Avatar, Button, Field, Modal, ToolButton, api, inputCls, useSynced } from "./ui";
import { RecordChip } from "./values";

export type NoteLite = { id: string; recordId: string; title: string; content: string; authorId: string; createdAt: string; updatedAt: string };

export function NotesGrid({ notes: initial, defaultRecordId, showRecord = true, page = false }: { notes: NoteLite[]; defaultRecordId?: string; showRecord?: boolean; page?: boolean }) {
  const { t, locale } = useI18n();
  const { users } = useCrm();
  const [notes] = useSynced(initial);
  const [open, setOpen] = useState<NoteLite | "new" | null>(null);
  const [mode, setMode] = useState<"list" | "grid">("list");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-[43px] shrink-0 items-center justify-between border-b border-line px-3">
        <span className="flex h-7 items-center gap-1.5 rounded-lg border border-line-2 px-2 text-[13px]"><ArrowDownWideNarrow size={13} className="text-ink-2" /><span className="text-ink-2">{t("common.sortedBy")}</span><span className="font-medium">{t("common.creationDate")}</span></span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <button onClick={() => setMode("list")} aria-label={t("notes.list")} className={clsx("flex h-6 w-6 items-center justify-center rounded-md", mode === "list" ? "bg-hover text-ink" : "text-ink-3")}><ListIcon size={13} /></button>
            <button onClick={() => setMode("grid")} aria-label={t("notes.grid")} className={clsx("flex h-6 w-6 items-center justify-center rounded-md", mode === "grid" ? "bg-hover text-ink" : "text-ink-3")}><LayoutGrid size={13} /></button>
          </div>
          {page && <ToolButton><SlidersHorizontal size={13} className="text-ink-2" />{t("common.viewSettings")}</ToolButton>}
          <Button variant="primary" className="h-7 px-2" onClick={() => setOpen("new")} data-testid="new-note"><Plus size={14} />{t("notes.new")}</Button>
        </div>
      </div>
      <div className="scroll-thin flex flex-1 flex-col overflow-y-auto">
        {notes.length === 0 && (
          <>
            <EmptyState kind="note" title={t("notes.title")} text={t("notes.emptyText")} action={<Button variant="primary" className="h-7" onClick={() => setOpen("new")}><Plus size={14} />{t("notes.new")}</Button>} />
            {page && <LearnMore label={t("common.learnMore")} title={t("learn.tasks")} />}
          </>
        )}
        {mode === "list" ? (
          <div>
            {notes.map((n) => {
              const a = users.find((u) => u.id === n.authorId);
              return (
                <div key={n.id} role="button" onClick={() => setOpen(n)} className="flex h-11 w-full cursor-pointer items-center gap-3 border-b border-line px-4 text-left hover:bg-[#fafafb]" data-testid="note-row">
                  <FileText size={14} className="shrink-0 text-ink-3" />
                  <span className="w-[240px] shrink-0 truncate text-[13px] font-medium">{n.title}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink-3">{n.content.replace(/\n/g, " ")}</span>
                  {showRecord && <span className="max-w-[200px] shrink-0"><RecordChip id={n.recordId} /></span>}
                  {a && <Avatar name={a.name} color={a.avatarColor} size={18} />}
                  <span className="w-[90px] shrink-0 text-right text-[12px] text-ink-3" suppressHydrationWarning>{relativeTime(n.createdAt, locale)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 p-4">
            {notes.map((n) => {
              const a = users.find((u) => u.id === n.authorId);
              return (
                <div key={n.id} role="button" onClick={() => setOpen(n)} className="flex h-[168px] cursor-pointer flex-col rounded-xl border border-line-2 bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-[#d0d2d7]">
                  <div className="flex items-center gap-1.5 text-[13.5px] font-semibold"><FileText size={14} className="shrink-0 text-ink-3" /><span className="truncate">{n.title}</span></div>
                  <p className="mt-1.5 line-clamp-4 flex-1 whitespace-pre-line text-[13px] text-ink-2">{n.content || t("notes.noContent")}</p>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[12px] text-ink-3">
                    <span className="flex items-center gap-1.5 truncate" suppressHydrationWarning>{a && <Avatar name={a.name} color={a.avatarColor} size={16} />}{relativeTime(n.updatedAt, locale)}</span>
                    {showRecord && <span className="max-w-[140px]"><RecordChip id={n.recordId} /></span>}
                  </div>
                </div>
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
  const { t } = useI18n();
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
    } catch (e) { setErr((e as Error).message); }
  };
  const remove = async () => {
    if (!note || !confirm(t("notes.confirmDelete"))) return;
    await api(`/api/notes/${note.id}`, "DELETE");
    router.refresh();
    onClose();
  };
  const rec = note ? relIndex[note.recordId] : null;

  return (
    <Modal title={note ? t("notes.title") : t("notes.new")} onClose={onClose} width={620}>
      {!note && !defaultRecordId && (
        <Field label={t("notes.record")}>
          <select className={inputCls} value={recordId} onChange={(e) => setRecordId(e.target.value)} data-testid="note-record">
            <option value="">{t("notes.pickRecord")}</option>
            {objects.map((o) => <optgroup key={o.id} label={o.plural}>{(relOptions[o.id] ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</optgroup>)}
          </select>
        </Field>
      )}
      {rec && <Link href={`/objects/${rec.objectSlug}/${note!.recordId}`} onClick={onClose} className="mb-3 inline-flex"><RecordChip id={note!.recordId} link={false} /></Link>}
      <input autoFocus={!note} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("notes.titlePh")} className="mb-2 w-full text-[18px] font-semibold outline-none placeholder:text-ink-3" data-testid="note-title" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t("notes.bodyPh")} className="h-56 w-full resize-none text-[14px] leading-6 outline-none placeholder:text-ink-3" data-testid="note-content" />
      {err && <p className="mb-2 text-[12px] text-red-600">{err}</p>}
      <div className="flex items-center justify-between border-t pt-3">
        {note ? <Button variant="ghost" className="text-red-600" onClick={remove}><Trash2 size={14} />{t("common.delete")}</Button> : <span />}
        <div className="flex gap-2"><Button onClick={onClose}>{t("common.cancel")}</Button><Button variant="primary" onClick={save} data-testid="note-save">{note ? t("common.save") : t("notes.create")}</Button></div>
      </div>
    </Modal>
  );
}
