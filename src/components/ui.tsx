"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Building2, CheckSquare, DollarSign, FileText, Target, User, List as ListIcon, X } from "lucide-react";
import { TAG_COLORS, domainColor, initials } from "@/lib/format";
import { useI18n } from "@/i18n/client";

export function ObjectIcon({ icon, color, size = 14, boxed = false, solid = false }: { icon: string; color?: string; size?: number; boxed?: boolean; solid?: boolean }) {
  const Icon = icon === "building" ? Building2 : icon === "user" ? User : icon === "target" ? (solid ? DollarSign : Target) : icon === "note" ? FileText : icon === "task" ? CheckSquare : ListIcon;
  if (solid) {
    return (
      <span className="inline-flex shrink-0 items-center justify-center rounded-[4px]" style={{ width: size, height: size, background: color }}>
        <Icon size={Math.round(size * 0.68)} strokeWidth={2.6} color="#fff" />
      </span>
    );
  }
  if (!boxed) return <Icon size={size} strokeWidth={2} style={{ color }} />;
  return (
    <span className="inline-flex items-center justify-center rounded-[5px]" style={{ width: size + 8, height: size + 8, background: color ? `${color}1f` : "#f1f2f4" }}>
      <Icon size={size} strokeWidth={2.2} style={{ color }} />
    </span>
  );
}

export function Avatar({ name, color, size = 20, square = false }: { name: string; color?: string; size?: number; square?: boolean }) {
  return (
    <span
      className={clsx("inline-flex shrink-0 items-center justify-center font-medium text-white", square ? "rounded-[5px]" : "rounded-full")}
      style={{ width: size, height: size, background: color ?? domainColor(name), fontSize: Math.max(9, size * 0.42) }}
    >
      {initials(name) || "?"}
    </span>
  );
}

export function Tag({ label, color = "gray", dot = false }: { label: string; color?: string; dot?: boolean }) {
  const c = TAG_COLORS[color] ?? TAG_COLORS.gray;
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 truncate rounded-[5px] px-1.5 py-[1px] text-[13px] font-medium" style={{ background: c.bg, color: c.fg }}>
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c.dot }} />}
      <span className="truncate">{label}</span>
    </span>
  );
}

export function Button({ children, variant = "secondary", className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button
      {...rest}
      className={clsx(
        "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors disabled:opacity-50 focus-ring",
        variant === "primary" && "bg-[#266df0] text-white shadow-sm hover:bg-[#1f5fd6]",
        variant === "secondary" && "border border-line-2 bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-hover",
        variant === "ghost" && "text-ink-2 hover:bg-hover",
        variant === "danger" && "border border-red-200 bg-white text-red-600 hover:bg-red-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOut: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOut();
    };
    const k = (e: KeyboardEvent) => e.key === "Escape" && onOut();
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [ref, onOut, active]);
}

/** Popover simples ancorado ao gatilho. */
export function Popover({ trigger, children, align = "left", width = 240, open: openProp, onOpenChange }: { trigger: (open: boolean, toggle: () => void) => ReactNode; children: (close: () => void) => ReactNode; align?: "left" | "right"; width?: number; open?: boolean; onOpenChange?: (o: boolean) => void }) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (o: boolean) => { if (openProp === undefined) setOpenState(o); onOpenChange?.(o); };
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  return (
    <div className="relative" ref={ref}>
      {trigger(open, () => setOpen(!open))}
      {open && (
        <div className={clsx("absolute top-full z-40 mt-1 rounded-xl border border-line-2 bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.10)]", align === "right" ? "right-0" : "left-0")} style={{ width }}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ children, onClick, active, danger }: { children: ReactNode; onClick?: () => void; active?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} className={clsx("flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-hover", active && "bg-hover", danger ? "text-red-600" : "text-ink")}>
      {children}
    </button>
  );
}

export function Modal({ title, onClose, children, width = 480 }: { title: string; onClose: () => void; children: ReactNode; width?: number }) {
  const { t } = useI18n();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-[12vh]" onMouseDown={onClose} data-modal-open>
      <div className="rounded-2xl border border-line-2 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.18)]" style={{ width }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-[14px] font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-ink-3 hover:bg-hover" aria-label={t("common.close")}><X size={16} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[12px] font-medium text-ink-2">{label}</span>
      {children}
    </label>
  );
}

export const inputCls = "h-8 w-full rounded-lg border border-line-2 bg-white px-2.5 text-[13px] outline-none focus:border-[#9dbcf8] focus:ring-2 focus:ring-[#e3ecfd]";

export function PageHeader({ icon, title, children, crumbs }: { icon?: ReactNode; title: string; children?: ReactNode; crumbs?: ReactNode }) {
  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b px-4">
      <div className="flex min-w-0 items-center gap-2 text-[13.5px] font-medium">
        {crumbs}
        {icon}
        <span className="truncate">{title}</span>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}

export async function api<T = unknown>(url: string, method = "GET", body?: unknown): Promise<T> {
  const r = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || (document.documentElement.lang === "pt-BR" ? "Algo deu errado. Tente de novo." : "Something went wrong. Try again."));
  return data as T;
}

/** Estado local que se ressincroniza quando a prop do servidor muda (após router.refresh). */
export function useSynced<T>(value: T) {
  const [state, setState] = useState(value);
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setState(value);
  }
  return [state, setState] as const;
}

/** Logo da empresa: favicon do domínio, com inicial como reserva (offline). */
export function CompanyLogo({ name, domain, size = 16 }: { name: string; domain?: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (!domain || failed) return <Avatar name={name} size={size} square />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`} alt="" width={size} height={size} onError={() => setFailed(true)} className="shrink-0 rounded-[4px] object-contain" style={{ width: size, height: size }} />
  );
}

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <span className={clsx("block animate-pulse rounded-full bg-[#f0f1f3]", className)} style={style} />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border border-line-2 bg-white px-1 font-sans text-[10.5px] font-medium text-ink-3">{children}</kbd>;
}

/** Botão com borda fina usado na barra de ferramentas (View settings, Import / Export…). */
export function ToolButton({ children, className, active, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button {...rest} className={clsx("inline-flex h-7 items-center gap-1.5 rounded-lg border border-line-2 bg-white px-2 text-[13px] font-medium text-ink shadow-[0_1px_1px_rgba(0,0,0,0.03)] hover:bg-hover", active && "bg-hover", className)}>
      {children}
    </button>
  );
}

/** Google "G" mark used on Sync with Google buttons. */
export function GoogleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
  );
}
