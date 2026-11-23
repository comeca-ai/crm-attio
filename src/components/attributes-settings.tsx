"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ChevronLeft, Plus, Search, Trash2, ArrowRight } from "lucide-react";
import { ATTR_TYPE_LABELS, type Attr, type ObjectLite } from "@/lib/types";
import { AttrIcon } from "./attr-icon";
import { AddAttributeModal } from "./add-attribute";
import { Button, ObjectIcon, api } from "./ui";

export function AttributesSettings({ object, attrs, objects }: { object: ObjectLite; attrs: Attr[]; objects: ObjectLite[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [add, setAdd] = useState(false);
  const list = attrs.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));

  const remove = async (a: Attr) => {
    if (!confirm(`Excluir o atributo “${a.name}”? Os valores dele deixam de aparecer.`)) return;
    await api(`/api/attributes/${a.id}`, "DELETE");
    router.refresh();
  };

  return (
    <div className="scroll-thin flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[820px] px-6 py-8">
        <Link href={`/objects/${object.slug}`} className="inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink"><ChevronLeft size={14} /> Voltar</Link>
        <div className="mt-4 flex items-center gap-3">
          <ObjectIcon icon={object.icon} color={object.color} size={40} solid />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-semibold tracking-[-0.01em]">{object.plural}</h1>
              <span className="rounded-md bg-hover px-1.5 text-[11.5px] font-medium text-ink-2">Padrão</span>
            </div>
            <p className="text-[13px] text-ink-2">Gerencie os atributos deste objeto.</p>
          </div>
        </div>
        <nav className="mt-5 flex gap-4 border-b">
          {objects.map((o) => (
            <Link key={o.id} href={`/settings/objects/${o.slug}`} className={clsx("-mb-px border-b-2 pb-2 text-[13px] font-medium", o.slug === object.slug ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink-2")}>
              {o.plural}
            </Link>
          ))}
        </nav>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <h2 className="text-[14px] font-semibold">Atributos <span className="ml-1 rounded-md bg-hover px-1.5 text-[11.5px] font-medium text-ink-2">{attrs.length}</span></h2>
            <p className="text-[13px] text-ink-2">Edite e crie atributos para {object.plural.toLowerCase()}.</p>
          </div>
          <Button variant="primary" className="h-7" onClick={() => setAdd(true)}><Plus size={14} /> Criar atributo</Button>
        </div>
        <div className="mt-3 flex h-8 items-center gap-2 rounded-lg border border-line-2 px-2.5">
          <Search size={13} className="text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar atributos" className="w-full bg-transparent text-[13px] outline-none placeholder:text-ink-3" />
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-line-2">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[12.5px] text-ink-2">
                <th className="h-9 border-b px-3 font-medium">Nome</th>
                <th className="h-9 border-b px-3 font-medium">Tipo de dado</th>
                <th className="h-9 border-b px-3 font-medium">Restrições</th>
                <th className="h-9 border-b px-3 font-medium">Propriedades</th>
                <th className="h-9 w-10 border-b" />
              </tr>
            </thead>
            <tbody>
              {list.map((a) => {
                const target = a.relationObjectId ? objects.find((o) => o.id === a.relationObjectId) : null;
                return (
                  <tr key={a.id} className="group hover:bg-[#fafafa]">
                    <td className="h-10 border-b px-3">
                      <span className="inline-flex items-center gap-2 font-medium"><AttrIcon type={a.type} /> {a.name}
                        {target && <span className="inline-flex items-center gap-1 text-[12px] font-normal text-ink-3"><ArrowRight size={11} /> {target.plural}</span>}
                      </span>
                    </td>
                    <td className="border-b px-3 text-ink-2">{a.type === "relation" ? "Relação" : ATTR_TYPE_LABELS[a.type]}</td>
                    <td className="border-b px-3 text-ink-2">{a.isPrimary ? "Obrigatório" : ""}</td>
                    <td className="border-b px-3">
                      <span className={clsx("rounded-md px-1.5 py-[1px] text-[11.5px] font-medium", a.isSystem || a.isPrimary ? "bg-hover text-ink-2" : "bg-[#f1ebfd] text-[#6d28d9]")}>{a.isSystem || a.isPrimary ? "Sistema" : "Personalizado"}</span>
                    </td>
                    <td className="border-b px-2">
                      {!a.isSystem && !a.isPrimary && (
                        <button onClick={() => remove(a)} aria-label="Excluir atributo" className="rounded p-1 text-ink-3 opacity-0 hover:bg-hover hover:text-red-600 group-hover:opacity-100"><Trash2 size={14} /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {add && <AddAttributeModal objectSlug={object.slug} onClose={() => setAdd(false)} />}
    </div>
  );
}
