"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Building2, CheckSquare, FileText, Target, User, List as ListIcon, X } from "lucide-react";
import { TAG_COLORS, domainColor, initials } from "@/lib/format";

export function ObjectIcon({ icon, color, size = 14, boxed = false, solid = false }: { icon: string; color?: string; size?: number; boxed?: boolean; solid?: boolean }) {
  const Icon = icon === "building" ? Building2 : icon === "user" ? User : icon === "target" ? Target : icon === "note" ? FileText : icon === "task" ? CheckSquare : ListIcon;
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
  const setOpen = (o: boolean) => (onOpenChange ? onOpenChange(o) : setOpenState(o));
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
    <button onClick={onClick} className={clsx("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-hover", active && "bg-hover", danger ? "text-red-600" : "text-ink")}>
      {children}
    </button>
  );
}

export function Modal({ title, onClose, children, width = 480 }: { title: string; onClose: () => void; children: ReactNode; width?: number }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-[12vh]" onMouseDown={onClose}>
      <div className="rounded-2xl border border-line-2 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.18)]" style={{ width }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-[14px] font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-ink-3 hover:bg-hover" aria-label="Fechar"><X size={16} /></button>
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
  if (!r.ok) throw new Error(data.error || "Algo deu errado. Tente de novo.");
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
