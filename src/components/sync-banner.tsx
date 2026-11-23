"use client";
import { useSyncExternalStore } from "react";
import { ArrowLeftRight, X } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { GoogleIcon } from "./ui";

const KEY = "crm.syncBanner.dismissed";
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };
const dismissed = () => localStorage.getItem(KEY) === "1";

/** Attio's "Sync your inbox" card under record tables; dismissible per browser. */
export function SyncInboxBanner() {
  const { t } = useI18n();
  const hidden = useSyncExternalStore(subscribe, dismissed, () => false);
  if (hidden) return null;
  const close = () => { localStorage.setItem(KEY, "1"); listeners.forEach((l) => l()); };
  return (
    <div className="sticky left-0 mx-3 my-3 flex h-[42px] w-[calc(100vw-280px)] max-w-[1400px] items-center gap-2 rounded-xl border border-line px-3 text-[12.5px]" data-testid="sync-banner">
      <ArrowLeftRight size={13} className="text-ink-2" />
      <span className="font-medium">{t("banner.syncInbox")}</span>
      <span className="truncate text-ink-3">{t("banner.syncInboxText")}</span>
      <button className="ml-auto flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-line-2 px-2 text-[12.5px] font-medium hover:bg-hover"><GoogleIcon />{t("banner.syncGoogle")}</button>
      <button onClick={close} className="rounded p-1 text-ink-3 hover:bg-hover" aria-label={t("common.close")}><X size={13} /></button>
    </div>
  );
}
