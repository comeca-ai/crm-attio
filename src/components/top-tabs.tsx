"use client";
import clsx from "clsx";

/** Abas compactas da barra superior (Notes · Templates, Drafts · Outbox · Templates…). */
export function TopTabs({ tabs, active, onChange }: { tabs: { id: string; label: string; icon: React.ReactNode; count?: number }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      {tabs.map((x) => (
        <button key={x.id} onClick={() => onChange(x.id)} className={clsx("flex h-[26px] items-center gap-1.5 rounded-md px-1.5 text-[13px]", active === x.id ? "bg-[#f1f1f3] font-medium text-ink" : "text-ink-2 hover:bg-hover")}>
          {x.icon}{x.label}{x.count !== undefined && <span className="rounded bg-[#e9e9ec] px-1 text-[10.5px] font-medium text-ink-2">{x.count}</span>}
        </button>
      ))}
    </div>
  );
}
