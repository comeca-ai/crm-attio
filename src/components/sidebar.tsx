"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useState } from "react";
import { CheckSquare, ChevronDown, FileText, Home, Inbox, LogOut, Mail, Phone, BarChart3, Plus, Search, Settings, List as ListIcon } from "lucide-react";
import { useCrm } from "./crm-context";
import { Avatar, Button, Field, MenuItem, Modal, ObjectIcon, Popover, api, inputCls } from "./ui";

function NavItem({ href, icon, label, count }: { href: string; icon: React.ReactNode; label: string; count?: number }) {
  const path = usePathname();
  const active = path === href || path.startsWith(href + "/");
  return (
    <Link href={href} className={clsx("flex h-[30px] items-center gap-2 rounded-md px-2 text-[13.5px]", active ? "bg-[#eceef1] font-medium text-ink" : "text-[#3d3f44] hover:bg-[#f1f2f4]")}>
      <span className="flex w-4 justify-center text-ink-2">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && count > 0 && <span className="text-[12px] text-ink-3">{count}</span>}
    </Link>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mt-4">
      <div className="group flex items-center justify-between px-2 pb-1">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-[12px] font-medium text-ink-3 hover:text-ink-2">
          {title}
          <ChevronDown size={12} className={clsx("transition-transform", !open && "-rotate-90")} />
        </button>
        {action}
      </div>
      {open && <div className="space-y-[1px]">{children}</div>}
    </div>
  );
}

export function Sidebar({ openTasks }: { openTasks: number }) {
  const { me, objects, lists } = useCrm();
  const router = useRouter();
  const [newList, setNewList] = useState(false);
  const [listName, setListName] = useState("");
  const [listObj, setListObj] = useState(objects[0]?.id ?? "");
  const [err, setErr] = useState("");

  const logout = async () => {
    await api("/api/auth/logout", "POST");
    router.push("/login");
    router.refresh();
  };
  const createList = async () => {
    try {
      const l = await api<{ id: string }>("/api/lists", "POST", { name: listName, objectId: listObj });
      setNewList(false);
      setListName("");
      router.push(`/lists/${l.id}`);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r bg-[#fafafa]">
      <div className="px-2 pt-2">
        <Popover
          width={224}
          trigger={(_, toggle) => (
            <div className="flex items-center gap-1">
              <button onClick={toggle} className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 hover:bg-[#f1f2f4]">
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-[#266df0] text-[12px] font-semibold text-white">{me.name[0]}</span>
                <span className="truncate text-left text-[14px] font-semibold">{me.name.split(" ")[0]}</span>
                <ChevronDown size={14} className="shrink-0 text-ink-3" />
              </button>
              <Link href="/tasks" title="Caixa de entrada" className="flex h-7 w-7 items-center justify-center rounded-md border border-line-2 bg-white text-ink-2 hover:bg-hover"><Inbox size={14} /></Link>
            </div>
          )}
        >
          {(close) => (
            <div>
              <div className="px-2 py-1.5 text-[12px] text-ink-3">{me.email}</div>
              <MenuItem active>
                <span className="flex h-5 w-5 items-center justify-center rounded bg-[#1c1d1f] text-[11px] font-semibold text-white">{me.name[0]}</span>
                Workspace de {me.name.split(" ")[0]}
              </MenuItem>
              <div className="my-1 border-t" />
              <MenuItem onClick={() => { close(); router.push("/settings/objects/companies"); }}><Settings size={14} className="text-ink-3" /> Configurações</MenuItem>
              <MenuItem onClick={logout}><LogOut size={14} className="text-ink-3" /> Sair</MenuItem>
            </div>
          )}
        </Popover>
        <button
          onClick={() => window.dispatchEvent(new Event("open-palette"))}
          className="mt-1.5 flex h-[30px] w-full items-center gap-2 rounded-lg border border-line-2 bg-white px-2 text-[13px] text-ink-2 shadow-[0_1px_1px_rgba(0,0,0,0.03)] hover:bg-hover"
        >
          <Search size={14} />
          <span className="flex-1 text-left">Buscar</span>
          <kbd className="font-sans text-[10.5px] tracking-wide text-ink-3">CTRL K</kbd>
        </button>
      </div>

      <nav className="scroll-thin flex-1 overflow-y-auto px-2 pb-4">
        <div className="mt-2 space-y-[1px]">
          <NavItem href="/home" icon={<Home size={15} />} label="Início" />
          <NavItem href="/tasks" icon={<CheckSquare size={15} />} label="Tarefas" count={openTasks} />
          <NavItem href="/notes" icon={<FileText size={15} />} label="Notas" />
          <NavItem href="/emails" icon={<Mail size={15} />} label="E-mails" />
          <NavItem href="/calls" icon={<Phone size={15} />} label="Ligações" />
          <NavItem href="/reports" icon={<BarChart3 size={15} />} label="Relatórios" />
        </div>
        <Section title="Registros">
          {objects.map((o) => (
            <NavItem key={o.id} href={`/objects/${o.slug}`} icon={<ObjectIcon icon={o.icon} color={o.color} size={15} solid />} label={o.plural} />
          ))}
        </Section>
        <Section
          title="Listas"
          action={<Link href="/lists" className="rounded p-0.5 text-ink-3 hover:bg-[#e8e9ec] hover:text-ink" title="Todas as listas" aria-label="Todas as listas"><ListIcon size={13} /></Link>}
        >
          {lists.map((l) => {
            const o = objects.find((x) => x.id === l.objectId);
            return <NavItem key={l.id} href={`/lists/${l.id}`} icon={<span className="h-2.5 w-2.5 rounded-sm" style={{ background: o?.color }} />} label={l.name} />;
          })}
          <button onClick={() => setNewList(true)} className="mt-0.5 flex h-[30px] w-full items-center justify-center gap-1.5 rounded-md bg-[#f1f2f4] text-[13px] text-ink-2 hover:bg-[#e8e9ec] hover:text-ink">
            <Plus size={13} /> Nova lista
          </button>
        </Section>
      </nav>

      <div className="flex items-center gap-2 border-t px-3 py-2.5">
        <Avatar name={me.name} color={me.avatarColor} size={22} />
        <span className="truncate text-[13px] font-medium">{me.name}</span>
      </div>

      {newList && (
        <Modal title="Nova lista" onClose={() => setNewList(false)} width={400}>
          <Field label="Nome">
            <input autoFocus className={inputCls} value={listName} onChange={(e) => setListName(e.target.value)} placeholder="Ex.: Pipeline de parcerias" onKeyDown={(e) => e.key === "Enter" && createList()} />
          </Field>
          <Field label="Tipo de registro">
            <select className={inputCls} value={listObj} onChange={(e) => setListObj(e.target.value)}>
              {objects.map((o) => <option key={o.id} value={o.id}>{o.plural}</option>)}
            </select>
          </Field>
          {err && <p className="mb-2 text-[12px] text-red-600">{err}</p>}
          <div className="flex justify-end gap-2">
            <Button onClick={() => setNewList(false)}>Cancelar</Button>
            <Button variant="primary" onClick={createList}>Criar lista</Button>
          </div>
        </Modal>
      )}
    </aside>
  );
}
