"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowDown, ArrowUp, Calendar, CheckSquare, CornerDownLeft, FileText, House, Inbox, Languages, ListPlus, Mail, Plus, Search, Settings, Star, ChartColumn } from "lucide-react";
import { useI18n } from "@/i18n/client";
import type { MessageKey } from "@/i18n/dict";
import { Avatar, CompanyLogo, Kbd, ObjectIcon, api } from "./ui";
import { useCrm } from "./crm-context";
import { TaskModal } from "./tasks";
import { NoteModal } from "./notes";
import { AskAttioIcon } from "./topbar";
import { switchLocale } from "./sidebar";

type Hit = { id: string; name: string; subtitle: string; objectSlug: string; objectName: string; icon: string; color: string };
type Item = { key: string; label: string; sub?: string; icon: React.ReactNode; group: string; hint?: string[]; verb: "open" | "create"; run: () => void };

const isTyping = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
};

/** Paleta (Ctrl/Cmd+K) e atalhos globais: G + letra navega, N nova nota, T nova tarefa, / busca. */
export function CommandPalette() {
  const { t, locale } = useI18n();
  const { objects, relIndex, favorites, lists } = useCrm();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [hi, setHi] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ kind: "task" | "note"; recordId?: string } | null>(null);
  const gPressed = useRef<number>(0);

  const m = pathname.match(/^\/objects\/[^/]+\/([^/]+)$/);
  const ctxId = m?.[1];
  const ctx = ctxId ? relIndex[ctxId] : undefined;

  useEffect(() => {
    const go = (k: string) => {
      const map: Record<string, string> = { h: "/home", t: "/tasks", n: "/notes", e: "/emails", r: "/reports", i: "/inbox", s: "/settings/profile", c: "/objects/companies", p: "/objects/people", d: "/objects/deals" };
      if (map[k]) router.push(map[k]);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); return; }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e) || document.querySelector("[data-modal-open]")) return;
      const k = e.key.toLowerCase();
      if (Date.now() - gPressed.current < 1200) { gPressed.current = 0; go(k); e.preventDefault(); return; }
      if (k === "g") { gPressed.current = Date.now(); return; }
      if (k === "/") { e.preventDefault(); setOpen(true); return; }
      if (k === "n") { e.preventDefault(); setModal({ kind: "note", recordId: ctxId }); return; }
      if (k === "t") { e.preventDefault(); setModal({ kind: "task", recordId: ctxId }); return; }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-palette", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("open-palette", onOpen); };
  }, [router, ctxId]);

  useEffect(() => {
    if (!open) return;
    const tm = setTimeout(async () => {
      setLoading(true);
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (r.ok) setHits(await r.json());
      setHi(0);
      setLoading(false);
    }, 120);
    return () => clearTimeout(tm);
  }, [q, open]);

  const close = useCallback(() => { setOpen(false); setQ(""); }, []);
  const ic = (n: React.ReactNode) => <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border border-line-2 text-ink-2">{n}</span>;
  const match = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase());

  const createRecord = async (slug: string) => {
    const name = q.trim();
    const primary = slug === "people" ? { name: { first_name: name.split(" ")[0] ?? "", last_name: name.split(" ").slice(1).join(" ") } } : { name };
    const r = await api<{ id: string }>(`/api/objects/${slug}/records`, "POST", { values: name ? primary : {} });
    router.push(`/objects/${slug}/${r.id}`);
    router.refresh();
  };
  const isFav = ctxId ? favorites.some((f) => f.recordId === ctxId) : false;

  const ctxItems: Item[] = ctx && ctxId ? [
    { key: "c-note", label: t("cmd.createNote"), sub: ctx.name, icon: ic(<FileText size={11} />), group: ctx.name, hint: ["N"], verb: "create" as const, run: () => setModal({ kind: "note", recordId: ctxId }) },
    { key: "c-task", label: t("cmd.createTask"), sub: ctx.name, icon: ic(<CheckSquare size={11} />), group: ctx.name, hint: ["T"], verb: "create" as const, run: () => setModal({ kind: "task", recordId: ctxId }) },
    { key: "c-ask", label: t("cmd.ask"), sub: ctx.name, icon: ic(<AskAttioIcon size={11} />), group: ctx.name, hint: ["CTRL", "J"], verb: "open" as const, run: () => router.push("/chats") },
    ...lists.filter((l) => objects.find((o) => o.id === l.objectId)?.slug === ctx.objectSlug).slice(0, 1).map((l) => ({ key: "c-list", label: t("cmd.addToList"), sub: l.name, icon: ic(<ListPlus size={11} />), group: ctx.name, hint: ["E"], verb: "create" as const, run: () => { api(`/api/lists/${l.id}/entries`, "POST", { recordId: ctxId }).then(() => router.refresh()); } })),
    { key: "c-mail", label: t("cmd.compose"), sub: ctx.name, icon: ic(<Mail size={11} />), group: ctx.name, hint: ["C"], verb: "open" as const, run: () => router.push("/emails") },
    { key: "c-fav", label: isFav ? t("cmd.removeFavorite") : t("cmd.addFavorite"), sub: ctx.name, icon: ic(<Star size={11} />), group: ctx.name, verb: "create" as const, run: () => { api("/api/favorites", "POST", { recordId: ctxId }).then(() => router.refresh()); } },
  ].filter((i) => match(i.label)) : [];

  const quick = t("cmd.quick");
  const actions: Item[] = [
    { key: "q-search", label: t("cmd.searchRecords"), icon: ic(<Search size={11} />), group: quick, hint: ["/"], verb: "open" as const, run: () => { setTimeout(() => setOpen(true), 0); } },
    { key: "q-meet", label: t("cmd.upcoming"), icon: ic(<Calendar size={11} />), group: quick, verb: "open" as const, run: () => router.push("/home") },
    ...(!ctx ? [
      { key: "q-task", label: t("cmd.createTask"), icon: ic(<CheckSquare size={11} />), group: quick, hint: ["T"], verb: "create" as const, run: () => setModal({ kind: "task" }) },
      { key: "q-note", label: t("cmd.createNote"), icon: ic(<FileText size={11} />), group: quick, hint: ["N"], verb: "create" as const, run: () => setModal({ kind: "note" }) },
    ] : []),
    ...objects.map((o) => ({ key: `q-new-${o.slug}`, label: t("cmd.create", { singular: locale === "en" ? o.singular : o.singular.toLowerCase() }), sub: q.trim() ? `“${q.trim()}”` : undefined, icon: ic(<Plus size={11} />), group: quick, verb: "create" as const, run: () => { createRecord(o.slug); } })),
    { key: "q-lang", label: t("cmd.switchLanguage"), icon: ic(<Languages size={11} />), group: quick, verb: "open" as const, run: () => { switchLocale(locale === "en" ? "pt-BR" : "en", () => router.refresh()); } },
  ].filter((i) => !q || match(i.label) || i.key.startsWith("q-new"));

  const navDefs: { k: MessageKey; href: string; icon: React.ReactNode; hint: string }[] = [
    { k: "nav.home", href: "/home", icon: <House size={11} />, hint: "H" },
    { k: "nav.tasks", href: "/tasks", icon: <CheckSquare size={11} />, hint: "T" },
    { k: "nav.notes", href: "/notes", icon: <FileText size={11} />, hint: "N" },
    { k: "nav.emails", href: "/emails", icon: <Mail size={11} />, hint: "E" },
    { k: "nav.reports", href: "/reports", icon: <ChartColumn size={11} />, hint: "R" },
    { k: "nav.inbox", href: "/inbox", icon: <Inbox size={11} />, hint: "I" },
    { k: "nav.settings", href: "/settings/profile", icon: <Settings size={11} />, hint: "S" },
  ];
  const navGroup = t("cmd.navigation");
  const nav: Item[] = [
    ...navDefs.map((n) => ({ key: `n-${n.href}`, label: t("cmd.goTo", { page: t(n.k) }), icon: ic(n.icon), group: navGroup, hint: ["G", n.hint], verb: "open" as const, run: () => router.push(n.href) })),
    ...objects.map((o) => ({ key: `n-${o.slug}`, label: t("cmd.goTo", { page: o.plural }), icon: <ObjectIcon icon={o.icon} color={o.color} size={18} solid />, group: navGroup, hint: ["G", o.slug[0].toUpperCase()], verb: "open" as const, run: () => router.push(`/objects/${o.slug}`) })),
  ].filter((i) => match(i.label));
  const recs: Item[] = hits.map((h) => ({
    key: h.id, label: h.name, sub: h.subtitle || h.objectName,
    icon: h.objectSlug === "companies" ? <CompanyLogo name={h.name} domain={h.subtitle || undefined} size={18} /> : h.objectSlug === "people" ? <Avatar name={h.name} size={18} /> : <ObjectIcon icon={h.icon} color={h.color} size={18} solid />,
    group: t("cmd.records"), verb: "open" as const, run: () => router.push(`/objects/${h.objectSlug}/${h.id}`),
  }));
  const items = q ? [...ctxItems, ...recs, ...actions, ...nav] : [...ctxItems, ...actions, ...recs.slice(0, 5), ...nav];
  const go = (i: Item | undefined) => { if (!i) return; close(); i.run(); };

  let lastGroup = "";
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/[0.06] pt-[13vh]" onMouseDown={close} data-modal-open>
          <div data-testid="palette" className="w-[640px] overflow-hidden rounded-[14px] border border-line-2 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)]" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-line px-4">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") close();
                  if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, items.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
                  if (e.key === "Enter") go(items[hi]);
                  if (e.key === "Tab") { e.preventDefault(); close(); router.push("/chats"); }
                }}
                placeholder={t("cmd.placeholder")} className="h-[50px] w-full bg-transparent text-[14.5px] outline-none placeholder:text-ink-3" />
              <span className="flex shrink-0 items-center gap-1.5 text-[12.5px] text-ink-2">{t("cmd.ask")}<Kbd>{t("cmd.tab")}</Kbd></span>
            </div>
            <div className="scroll-thin max-h-[400px] overflow-y-auto p-1.5">
              {items.length === 0 && <div className="px-3 py-6 text-center text-[13px] text-ink-3">{loading ? t("common.searching") : t("common.noResultsFor", { q })}</div>}
              {items.map((it, i) => {
                const header = it.group !== lastGroup ? it.group : null;
                lastGroup = it.group;
                return (
                  <div key={it.key}>
                    {header && <div className="truncate px-2.5 pb-1 pt-2 text-[12px] font-medium text-ink-3">{header}</div>}
                    <button onMouseEnter={() => setHi(i)} onClick={() => go(it)} data-testid="palette-item"
                      className={clsx("flex h-[34px] w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13.5px]", i === hi && "bg-[#f4f4f6]")}>
                      {it.icon}
                      <span className="truncate font-medium">{it.label}</span>
                      {it.sub && <span className="truncate text-[12.5px] text-ink-3">{it.sub}</span>}
                      {it.hint && <span className="ml-auto flex shrink-0 gap-0.5">{it.hint.map((h) => <Kbd key={h}>{h}</Kbd>)}</span>}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex h-11 items-center justify-between border-t border-line px-3 text-[12px] text-ink-3">
              <span className="flex items-center gap-1.5"><Kbd><ArrowUp size={10} /></Kbd><Kbd><ArrowDown size={10} /></Kbd>{t("cmd.navigate")}</span>
              <button onClick={() => go(items[hi])} className="flex h-7 items-center gap-1.5 rounded-lg bg-[#266df0] px-2.5 text-[12.5px] font-medium text-white">
                {items[hi]?.verb === "create" ? t("common.create") : t("cmd.open")}<CornerDownLeft size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
      {modal?.kind === "task" && <TaskModal task={null} defaultRecordId={modal.recordId} onClose={() => setModal(null)} />}
      {modal?.kind === "note" && <NoteModal note={null} defaultRecordId={modal.recordId} onClose={() => setModal(null)} />}
    </>
  );
}
