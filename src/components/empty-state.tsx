import type { ReactNode } from "react";

/** Ilustração de linha simples, no estilo do Attio. */
export function EmptyIllustration({ kind = "doc" }: { kind?: "doc" | "note" | "task" | "chart" }) {
  return (
    <svg width="120" height="88" viewBox="0 0 120 88" fill="none" aria-hidden>
      <g stroke="#eceef1">
        {[0, 22, 44, 66, 88].map((y) => <line key={y} x1="0" x2="120" y1={y} y2={y} />)}
        {[10, 40, 70, 100].map((x) => <line key={x} x1={x} x2={x} y1="0" y2="88" />)}
      </g>
      <g stroke="#9a9ca2" strokeWidth="1.4" fill="#fff" strokeLinejoin="round">
        {kind === "note" && (<><path d="M38 30 L76 22 L84 56 L46 64 Z" /><path d="M76 22 l-3 9 l11 -2" fill="none" /><circle cx="73" cy="20" r="3" fill="#e5e7eb" /></>)}
        {kind === "task" && (<><rect x="44" y="16" width="32" height="48" rx="3" transform="rotate(8 60 40)" /><path d="M52 30 h16 M52 38 h16 M52 46 h12" transform="rotate(8 60 40)" /></>)}
        {kind === "doc" && (<><rect x="40" y="18" width="40" height="46" rx="5" /><rect x="47" y="26" width="9" height="9" rx="2" /><path d="M60 29 h13 M47 42 h26 M47 49 h20" /></>)}
        {kind === "chart" && (<><rect x="38" y="20" width="44" height="44" rx="5" /><path d="M48 54 V44 M57 54 V34 M66 54 V40 M75 54 V30" /></>)}
      </g>
    </svg>
  );
}

export function EmptyState({ title, text, action, kind }: { title: string; text: string; action?: ReactNode; kind?: "doc" | "note" | "task" | "chart" }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <EmptyIllustration kind={kind} />
      <p className="mt-4 text-[15px] font-semibold">{title}</p>
      <p className="mt-1 max-w-[260px] text-[13px] leading-5 text-ink-2">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
