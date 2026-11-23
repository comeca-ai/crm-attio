"use client";
import { useState } from "react";
import Link from "next/link";
import { CircleHelp, EllipsisVertical, MessageCircle, PanelLeft } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { useCrm } from "./crm-context";
import { Avatar } from "./ui";
import { useSidebarCollapsed } from "./sidebar";

export function AskAttioIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2.2c3.3 0 5.8 2.3 5.8 5.2S11.3 12.6 8 12.6c-.6 0-1.2-.1-1.8-.2L3 13.8l.9-2.6C2.8 10.2 2.2 8.9 2.2 7.4 2.2 4.5 4.7 2.2 8 2.2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

/** Barra superior de 42px: trilha à esquerda, ações do Attio à direita. */
export function TopBar({ children, right, variant = "full" }: { children: React.ReactNode; right?: React.ReactNode; variant?: "full" | "help" | "helpAsk" | "none" }) {
  const { t } = useI18n();
  const { me } = useCrm();
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const [copied, setCopied] = useState(false);
  const share = async () => {
    await navigator.clipboard?.writeText(location.href).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <header className="flex h-[42px] shrink-0 items-center justify-between gap-3 border-b border-line px-3" data-testid="topbar">
      <div className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium">
        {collapsed && <button onClick={() => setCollapsed(false)} title={t("nav.expand")} className="mr-1 rounded-md p-1 text-ink-2 hover:bg-hover"><PanelLeft size={16} strokeWidth={1.8} /></button>}
        {children}
      </div>
      <div className="flex shrink-0 items-center gap-1 text-[13px]">
        {right}
        {(variant === "help" || variant === "helpAsk") && (
          <Link href="/settings/support" className="flex h-7 items-center gap-1.5 rounded-md px-2 text-ink-2 hover:bg-hover"><CircleHelp size={14} />{t("top.help")}</Link>
        )}
        {variant === "helpAsk" && (
          <Link href="/chats" className="ml-1 flex h-7 items-center gap-1.5 rounded-lg px-2 font-medium hover:bg-hover"><AskAttioIcon />{t("top.askAttio")}</Link>
        )}
        {variant === "full" && (
          <>
            <button onClick={share} className="flex h-7 items-center gap-1.5 rounded-md px-2 text-ink-2 hover:bg-hover"><Avatar name={me.name} color={me.avatarColor} size={16} />{copied ? t("top.copied") : t("top.share")}</button>
            <button className="rounded-md p-1.5 text-ink-2 hover:bg-hover" aria-label={t("nav.chats")}><MessageCircle size={14} /></button>
            <Link href="/settings/support" className="rounded-md p-1.5 text-ink-2 hover:bg-hover" aria-label={t("top.help")}><CircleHelp size={14} /></Link>
            <button className="rounded-md p-1.5 text-ink-2 hover:bg-hover" aria-label="More"><EllipsisVertical size={14} /></button>
            <Link href="/chats" className="ml-1 flex h-7 items-center gap-1.5 rounded-lg px-2 font-medium hover:bg-hover"><AskAttioIcon />{t("top.askAttio")}</Link>
          </>
        )}
      </div>
    </header>
  );
}

export function Crumb({ icon, children, href }: { icon?: React.ReactNode; children: React.ReactNode; href?: string }) {
  const inner = <span className="flex min-w-0 items-center gap-1.5">{icon}<span className="truncate">{children}</span></span>;
  return href ? <Link href={href} className="min-w-0 rounded px-0.5 text-ink-2 hover:text-ink">{inner}</Link> : inner;
}

