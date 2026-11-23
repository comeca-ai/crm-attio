"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import {
  ArrowRightLeft, Bell, Box, ChevronLeft, CircleHelp, Code, CreditCard, FlaskConical, Gift, HardDrive, History, KeyRound, LayoutDashboard,
  LayoutGrid, Link2, List, Mail, Mic, Palette, PhoneCall, Search, Shield, SlidersHorizontal, Sparkles, UserRound, Users, Activity, Plug, Gem,
} from "lucide-react";
import { useI18n } from "@/i18n/client";
import { SETTINGS_SECTIONS } from "@/lib/settings-nav";
import { Sidebar } from "./sidebar";

const ICONS: Record<string, React.ElementType> = {
  profile: UserRound, appearance: Palette, "email-calendar-accounts": Mail, "call-intelligence": PhoneCall, storage: HardDrive, refer: Gift,
  notifications: Bell, "ask-attio": Sparkles, "app-connections": Link2, general: SlidersHorizontal, members: Users, "workspace-ask-attio": Sparkles,
  "call-recorder": Mic, plans: Gem, billing: CreditCard, developers: Code, support: CircleHelp, migrate: ArrowRightLeft, labs: FlaskConical,
  apps: LayoutGrid, security: Shield, "email-calendar": Mail, "expert-access": KeyRound, objects: Box, lists: List, activities: Activity,
  "data-connectors": Plug, "import-history": History, dashboards: LayoutDashboard,
};
const Icon = ({ href }: { href: string }) => { const C = ICONS[href] ?? Box; return <C size={14} strokeWidth={1.8} />; };

function SettingsSidebar() {
  const { t } = useI18n();
  const path = usePathname();
  const [q, setQ] = useState("");
  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-line bg-[#fbfbfb]" data-testid="settings-sidebar">
      <div className="flex h-[42px] items-center gap-1.5 px-2.5">
        <Link href="/home" className="rounded-md p-1 text-ink-3 hover:bg-[#f0f0f2]" aria-label={t("common.back")}><ChevronLeft size={15} /></Link>
        <span className="text-[14px] font-semibold">{t("set.title")}</span>
      </div>
      <div className="px-2 pb-3 pt-2">
        <label className="flex h-[26px] items-center gap-1.5 rounded-[7px] border border-line-2 bg-white px-1.5 text-[13px]">
          <Search size={13} className="text-ink-2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("set.search")} className="w-full bg-transparent outline-none placeholder:text-ink-2" />
        </label>
      </div>
      <nav className="scroll-thin flex-1 overflow-y-auto px-2 pb-3">
        {SETTINGS_SECTIONS.map((s, si) => {
          const items = s.items.filter((it) => t(it.key).toLowerCase().includes(q.toLowerCase()));
          if (items.length === 0) return null;
          return (
            <div key={si} className={clsx(si > 0 && "mt-3")}>
              {s.title && <div className="px-1.5 pb-1.5 text-[11.5px] font-medium text-ink-3">{t(s.title)}</div>}
              {items.map((it) => {
                const active = path === `/settings/${it.href}` || path.startsWith(`/settings/${it.href}/`);
                return (
                  <Link key={it.href} href={`/settings/${it.href}`} className={clsx("flex h-[25.5px] items-center gap-2 rounded-[6px] px-1.5 text-[13px]", active ? "bg-[#efeff1]" : "hover:bg-[#f2f2f4]")}>
                    <span className="text-[#5c5e63]"><Icon href={it.href} /></span><span className="flex-1 truncate">{t(it.key)}</span>
                    {it.beta && <span className="rounded bg-[#e2eeff] px-1 text-[10.5px] font-medium text-[#1557d6]">{t("common.beta")}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const settings = path.startsWith("/settings");
  return (
    <div className="flex h-screen overflow-hidden">
      {settings ? <SettingsSidebar /> : <Sidebar />}
      <main className="relative flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}

