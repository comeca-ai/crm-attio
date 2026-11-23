import type { ReactNode } from "react";
import { GraduationCap } from "lucide-react";

type Kind = "doc" | "note" | "task" | "chart" | "mail" | "send" | "flow" | "chat" | "inbox" | "call";

/** Ilustração de linha (cartão com marcas de corte nos cantos), como nos estados vazios do Attio. */
export function EmptyIllustration({ kind = "doc" }: { kind?: Kind }) {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden>
      <g stroke="#d9dadd" strokeWidth="1">
        <path d="M14 8v10M9 13h10M82 8v10M77 13h10M14 78v10M9 83h10M82 78v10M77 83h10" strokeDasharray="2 2" />
        <path d="M14 22v52M82 22v52M22 13h52M22 83h52" strokeDasharray="2 3" />
      </g>
      <rect x="22" y="22" width="52" height="52" rx="9" fill="#fff" stroke="#c9cacf" strokeWidth="1.5" />
      <rect x="25" y="25" width="46" height="46" rx="7" fill="#fafafb" stroke="#e6e7ea" />
      <g stroke="#9a9ca2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {kind === "doc" && (<><rect x="33" y="33" width="9" height="9" rx="2" /><path d="M47 37h14M33 50h28M33 57h18" /></>)}
        {kind === "note" && (<><path d="M36 33h18l6 6v24H36z" /><path d="M54 33v6h6M41 46h14M41 52h10" /></>)}
        {kind === "task" && (<><rect x="35" y="35" width="10" height="10" rx="2" /><path d="M37.5 40l2 2 3.5-4M50 40h12M35 54h27" /></>)}
        {kind === "chart" && <path d="M36 62V52M45 62V40M54 62V46M63 62V34" />}
        {kind === "mail" && (<><rect x="34" y="37" width="28" height="22" rx="3" /><path d="M34 40l14 10 14-10" /></>)}
        {kind === "send" && <path d="M35 47l27-11-9 27-5-11-13-5zM48 52l6-6" />}
        {kind === "flow" && (<><rect x="34" y="34" width="11" height="11" rx="2" /><rect x="51" y="51" width="11" height="11" rx="2" /><path d="M40 45v6a4 4 0 004 4h7" /></>)}
        {kind === "chat" && <path d="M48 35c8 0 14 5 14 12s-6 12-14 12c-2 0-3.5-.3-5-.8L36 61l2-6c-2.5-2.2-4-5-4-8 0-7 6-12 14-12z" />}
        {kind === "inbox" && (<><path d="M34 50l5-14h18l5 14v10H34z" /><path d="M34 50h8l2 4h8l2-4h8" /></>)}
        {kind === "call" && (<><rect x="34" y="38" width="20" height="20" rx="3" /><path d="M54 44l8-4v16l-8-4" /></>)}
      </g>
    </svg>
  );
}

export function EmptyState({ title, text, action, kind, className }: { title: string; text: string; action?: ReactNode; kind?: Kind; className?: string }) {
  return (
    <div className={className ?? "flex flex-1 flex-col items-center justify-center px-6 py-16 text-center"} data-testid="empty-state">
      <EmptyIllustration kind={kind} />
      <p className="mt-3 text-[15px] font-semibold">{title}</p>
      <p className="mt-1 max-w-[280px] text-[13px] leading-5 text-ink-2">{text}</p>
      {action && <div className="mt-4 flex items-center justify-center gap-2">{action}</div>}
    </div>
  );
}

/** Cartão "Learn more" do rodapé dos estados vazios. */
export function LearnMore({ label, title, href = "https://attio.com/help" }: { label: string; title: string; href?: string }) {
  return (
    <div className="mx-auto w-[290px] pb-6">
      <p className="mb-1.5 text-[11.5px] font-medium text-ink-3">{label}</p>
      <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-line bg-white p-1.5 pr-3 hover:bg-hover">
        <span className="flex h-12 w-14 items-center justify-center rounded-lg bg-[#f4f4f6] text-ink-2"><GraduationCap size={18} strokeWidth={1.5} /></span>
        <span className="text-[13px] font-medium">{title}</span>
      </a>
    </div>
  );
}
