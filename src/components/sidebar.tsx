"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ChartColumn, Check, ChevronDown, ChevronRight, CircleArrowUp, Ellipsis, FileText, House, Inbox, Languages, Link2, LogOut, Mail,
  Minimize2, PanelLeft, Plus, Puzzle, Search, Send, Settings, SquareCheckBig, UserPlus, Video, Workflow, List as ListIcon,
} from "lucide-react";
import { useCrm } from "./crm-context";
import { CompanyLogo, Avatar, Button, Field, Kbd, MenuItem, Modal, ObjectIcon, Popover, api, inputCls } from "./ui";
import { useI18n } from "@/i18n/client";
import { LOCALES, LOCALE_LABEL, type Locale, type MessageKey } from "@/i18n/dict";

/** Preferências locais simples (sidebar recolhida, card de primeiros passos). */
function useLocalFlag(key: string) {
  const value = useSyncExternalStore(
    (cb) => { window.addEventListener("storage", cb); window.addEventListener("local-flag", cb); return () => { window.removeEventListener("storage", cb); window.removeEventListener("local-flag", cb); }; },
    () => localStorage.getItem(key) === "1",
    () => false,
  );
  const set = (v: boolean) => { localStorage.setItem(key, v ? "1" : "0"); window.dispatchEvent(new Event("local-flag")); };
  return [value, set] as const;
}
export const useSidebarCollapsed = () => useLocalFlag("crm.sidebarCollapsed");

export async function switchLocale(locale: Locale, refresh: () => void) {
  await api("/api/me", "PATCH", { locale });
  document.documentElement.lang = locale;
  refresh();
}

function NavItem({ href, icon, label, badge, exact }: { href: string; icon: React.ReactNode; label: React.ReactNode; badge?: number; exact?: boolean }) {
  const path = usePathname();
  const active = exact ? path === href : path === href || path.startsWith(href + "/");
  return (
    <Link href={href} className={clsx("flex h-[25px] items-center gap-2 rounded-[6px] px-1.5 text-[13px]", active ? "bg-[#efeff1] font-medium text-ink" : "text-ink hover:bg-[#f2f2f4]")}>
      <span className="flex w-4 shrink-0 justify-center text-[#5c5e63]">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {!!badge && <span className="rounded-full bg-[#266df0] px-1.5 text-[11px] font-medium leading-4 text-white">{badge}</span>}
    </Link>
  );
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id: string }) {
  const [closed, setClosed] = useLocalFlag(`crm.section.${id}`);
  return (
    <div className="mt-2.5">
      <button onClick={() => setClosed(!closed)} className="flex h-[22px] items-center gap-1.5 px-1.5 text-[12px] text-ink-3 hover:text-ink-2">
        <ChevronDown size={11} strokeWidth={2} className={clsx("transition-transform", closed && "-rotate-90")} />
        {title}
      </button>
      {!closed && <div className="space-y-[1px]">{children}</div>}
    </div>
  );
}

function DashedButton({ children, onClick, href }: { children: React.ReactNode; onClick?: () => void; href?: string }) {
  const cls = "mt-0.5 flex h-[26px] w-full items-center justify-center gap-1.5 rounded-[6px] border border-dashed border-[#e3e4e8] bg-[#f6f6f7] text-[12.5px] text-ink-3 hover:bg-[#efeff1] hover:text-ink-2";
  return href ? <Link href={href} className={cls}>{children}</Link> : <button onClick={onClick} className={cls}>{children}</button>;
}

const GS: { key: MessageKey; icon: React.ReactNode; href: string }[] = [
  { key: "gs.sync", icon: <Mail size={13} />, href: "/emails" },
  { key: "gs.extension", icon: <Puzzle size={13} />, href: "/home" },
  { key: "gs.report", icon: <ChartColumn size={13} />, href: "/reports" },
  { key: "gs.workflow", icon: <Workflow size={13} />, href: "/workflows" },
  { key: "gs.sequence", icon: <Send size={13} />, href: "/sequences" },
  { key: "gs.apps", icon: <Link2 size={13} />, href: "/settings/apps" },
];

function GettingStarted() {
  const { t } = useI18n();
  const [hidden, setHidden] = useLocalFlag("crm.gsHidden");
  const [min, setMin] = useLocalFlag("crm.gsMin");
  if (hidden) return null;
  return (
    <div className="mx-1 mb-1.5 rounded-xl border border-line bg-white px-2.5 pb-1.5 pt-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]" data-testid="getting-started">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[13px] font-semibold">{t("gs.title")}</div>
          <div className="mt-0.5 truncate whitespace-nowrap text-[11px] text-ink-3">{t("gs.progress", { n: 0 })} <span className="mx-0.5 text-line-2">|</span> {t("gs.letsGo")}</div>
        </div>
        <div className="flex items-center gap-0.5 text-ink-3">
          <Popover width={140} align="right" trigger={(_o, toggle) => <button onClick={toggle} className="rounded p-0.5 hover:bg-hover"><Ellipsis size={14} /></button>}>
            {(close) => <MenuItem onClick={() => { setHidden(true); close(); }}>{t("gs.hide")}</MenuItem>}
          </Popover>
          <button onClick={() => setMin(!min)} title={t("gs.minimize")} className="rounded p-0.5 hover:bg-hover"><Minimize2 size={12} /></button>
        </div>
      </div>
      <div className="mt-2 flex gap-1">{GS.map((g) => <span key={g.key} className="h-[3px] flex-1 rounded-full bg-[#ececef]" />)}</div>
      {!min && (
        <div className="mt-1.5">
          {GS.map((g) => (
            <Link key={g.key} href={g.href} className="flex h-[26px] items-center gap-2 rounded-md px-0.5 text-[12.5px] text-ink hover:bg-hover">
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border border-line-2 text-ink-2">{g.icon}</span>
              {t(g.key)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function NewListModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { objects } = useCrm();
  const router = useRouter();
  const [name, setName] = useState("");
  const [obj, setObj] = useState(objects[0]?.id ?? "");
  const [err, setErr] = useState("");
  const create = async () => {
    try {
      const l = await api<{ id: string }>("/api/lists", "POST", { name, objectId: obj });
      onClose();
      router.push(`/lists/${l.id}`);
      router.refresh();
    } catch (e) { setErr((e as Error).message); }
  };
  return (
    <Modal title={t("list.new")} onClose={onClose} width={420}>
      <Field label={t("list.name")}><input autoFocus className={inputCls} value={name} placeholder={t("list.namePh")} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} /></Field>
      <Field label={t("list.object")}>
        <select className={inputCls} value={obj} onChange={(e) => setObj(e.target.value)}>
          {objects.map((o) => <option key={o.id} value={o.id}>{o.plural}</option>)}
        </select>
      </Field>
      {err && <p className="mb-2 text-[12px] text-red-600">{err}</p>}
      <div className="flex justify-end gap-2"><Button onClick={onClose}>{t("common.cancel")}</Button><Button variant="primary" onClick={create}>{t("list.create")}</Button></div>
    </Modal>
  );
}

export function WorkspaceLogo({ name, size = 20 }: { name: string; size?: number }) {
  return <span className="inline-flex shrink-0 items-center justify-center rounded-[5px] bg-[#15b0f0] font-medium text-white" style={{ width: size, height: size, fontSize: size * 0.6 }}>{name.slice(0, 1).toUpperCase()}</span>;
}

export function Sidebar() {
  const { t, locale } = useI18n();
  const { workspaceName, objects, lists, favorites, unread, me } = useCrm();
  const router = useRouter();
  const [newList, setNewList] = useState(false);
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => { document.documentElement.dataset.sidebar = collapsed ? "collapsed" : "open"; }, [collapsed]);

  const logout = async () => {
    await api("/api/auth/logout", "POST");
    router.push("/login");
    router.refresh();
  };
  const openPalette = () => window.dispatchEvent(new Event("open-palette"));

  if (collapsed) return null;
  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-line bg-[#fbfbfb]" data-testid="sidebar">
      <div className="flex h-[42px] items-center justify-between px-2.5">
        <Popover width={264} onOpenChange={(o) => !o && setLangOpen(false)} trigger={(_o, toggle) => (
          <button onClick={toggle} className="flex min-w-0 items-center gap-2 rounded-md px-1 py-1 hover:bg-[#f0f0f2]" data-testid="workspace-menu">
            <WorkspaceLogo name={workspaceName} />
            <span className="truncate text-[14px] font-semibold">{workspaceName}</span>
            <ChevronDown size={13} className="text-ink-3" />
          </button>
        )}>
          {(close) => (
            <div>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Avatar name={me.name} color={me.avatarColor} size={22} />
                <div className="min-w-0"><div className="truncate text-[13px] font-medium">{me.name}</div><div className="truncate text-[11.5px] text-ink-3">{me.email}</div></div>
              </div>
              <div className="my-1 border-t" />
              <MenuItem onClick={() => { close(); router.push("/settings/general"); }}><Settings size={14} className="text-ink-2" />{t("ws.menu.settings")}</MenuItem>
              <MenuItem onClick={() => { close(); router.push("/settings/members"); }}><UserPlus size={14} className="text-ink-2" />{t("ws.menu.invite")}</MenuItem>
              <MenuItem onClick={() => setLangOpen(!langOpen)}>
                <Languages size={14} className="text-ink-2" /><span className="flex-1">{t("ws.menu.language")}</span>
                <span className="text-[12px] text-ink-3">{LOCALE_LABEL[locale].split(" ")[0]}</span><ChevronRight size={13} className="text-ink-3" />
              </MenuItem>
              {langOpen && (
                <div className="ml-6 border-l pl-1" data-testid="language-menu">
                  {LOCALES.map((l) => (
                    <MenuItem key={l} onClick={async () => { close(); await switchLocale(l, () => router.refresh()); }}>
                      <span className="flex-1">{LOCALE_LABEL[l]}</span>{l === locale && <Check size={13} className="text-[#266df0]" />}
                    </MenuItem>
                  ))}
                </div>
              )}
              <div className="my-1 border-t" />
              <MenuItem onClick={logout}><LogOut size={14} className="text-ink-2" />{t("ws.menu.logout")}</MenuItem>
            </div>
          )}
        </Popover>
        <button onClick={() => setCollapsed(true)} title={t("nav.collapse")} className="rounded-md p-1 text-ink-2 hover:bg-[#f0f0f2]"><PanelLeft size={16} strokeWidth={1.8} /></button>
      </div>

      <div className="flex items-center gap-1.5 px-2 pb-2 pt-1">
        <button onClick={openPalette} className="flex h-[26px] flex-1 items-center gap-1.5 rounded-[7px] border border-line-2 bg-white px-1.5 text-[13px] text-ink shadow-[0_1px_1px_rgba(0,0,0,0.03)] hover:bg-hover" data-testid="sidebar-search">
          <Search size={13} className="text-ink-2" />
          <span className="flex-1 text-left">{t("nav.search")}</span>
          <span className="flex gap-0.5"><Kbd>CTRL</Kbd><Kbd>K</Kbd></span>
        </button>
        <Link href="/inbox" title={t("nav.inbox")} className="relative flex h-[26px] w-[26px] items-center justify-center rounded-[7px] border border-line-2 bg-white text-ink-2 hover:bg-hover" data-testid="inbox-button">
          <Inbox size={13} />
          {unread > 0 && <span className="absolute -right-1 -top-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#266df0] px-0.5 text-[9px] font-semibold text-white">{unread}</span>}
        </Link>
      </div>

      <nav className="scroll-thin flex-1 overflow-y-auto px-2 pb-2">
        <div className="space-y-[1px]">
          <NavItem href="/home" icon={<House size={14} />} label={t("nav.home")} />
          <NavItem href="/tasks" icon={<SquareCheckBig size={14} />} label={t("nav.tasks")} />
          <NavItem href="/notes" icon={<FileText size={14} />} label={t("nav.notes")} />
          <NavItem href="/emails" icon={<Mail size={14} />} label={t("nav.emails")} />
          <NavItem href="/calls" icon={<Video size={14} />} label={t("nav.calls")} />
          <NavItem href="/reports" icon={<ChartColumn size={14} />} label={t("nav.reports")} />
          <NavItem href="/sequences" icon={<Send size={14} />} label={t("nav.sequences")} />
          <NavItem href="/workflows" icon={<Workflow size={14} />} label={t("nav.workflows")} />
        </div>

        {favorites.length > 0 && (
          <Section title={t("nav.favorites")} id="favorites">
            {favorites.map((f) => (
              <NavItem key={f.recordId} href={`/objects/${f.objectSlug}/${f.recordId}`} label={f.name}
                icon={f.objectSlug === "people" ? <Avatar name={f.name} size={14} /> : <CompanyLogo name={f.name} domain={f.domain} size={14} />} />
            ))}
          </Section>
        )}

        <Section title={t("nav.records")} id="records">
          {objects.map((o) => <NavItem key={o.id} href={`/objects/${o.slug}`} icon={<ObjectIcon icon={o.icon} color={o.color} size={14} solid />} label={o.plural} />)}
        </Section>

        <Section title={t("nav.lists")} id="lists">
          {lists.map((l) => <NavItem key={l.id} href={`/lists/${l.id}`} icon={<ListIcon size={14} />} label={l.name} />)}
          <DashedButton onClick={() => setNewList(true)}><Plus size={13} />{t("nav.newList")}</DashedButton>
        </Section>

        <Section title={t("nav.chats")} id="chats">
          <DashedButton href="/chats"><Plus size={13} />{t("nav.newChat")}</DashedButton>
        </Section>
      </nav>

      <GettingStarted />
      <div className="border-t border-line px-2 py-1">
        <Link href="/settings/members" className="flex h-[28px] items-center gap-2 rounded-md px-1.5 text-[13px] hover:bg-[#f0f0f2]"><UserPlus size={14} className="text-ink-2" />{t("gs.invite")}</Link>
      </div>
      <div className="flex items-center justify-between border-t border-line px-2 py-1.5">
        <span className="flex min-w-0 items-center gap-2 whitespace-nowrap px-1 text-[13px]"><span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-line-2"><CircleArrowUp size={13} className="text-ink-2" /></span><span className="truncate">{t("gs.trial")}</span></span>
        <Link href="/settings/plans" className="shrink-0 whitespace-nowrap rounded-md border border-line-2 bg-white px-1.5 py-0.5 text-[11.5px] font-medium hover:bg-hover">{t("gs.keepPro")}</Link>
      </div>
      {newList && <NewListModal onClose={() => setNewList(false)} />}
    </aside>
  );
}
