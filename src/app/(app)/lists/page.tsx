import Link from "next/link";
import { List as ListIcon } from "lucide-react";
import { prisma } from "@/lib/db";
import { ObjectIcon, PageHeader } from "@/components/ui";

export default async function ListsPage() {
  const lists = await prisma.list.findMany({ include: { object: true, _count: { select: { entries: true } } }, orderBy: { createdAt: "asc" } });
  return (
    <>
      <PageHeader title="Listas" icon={<ListIcon size={16} className="text-ink-2" />} />
      <div className="scroll-thin flex-1 overflow-y-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="text-left text-[13px] text-ink-2">
              <th className="h-9 border-b px-4 font-medium">Nome</th>
              <th className="h-9 border-b px-4 font-medium">Tipo de registro</th>
              <th className="h-9 border-b px-4 font-medium">Entradas</th>
            </tr>
          </thead>
          <tbody>
            {lists.map((l) => (
              <tr key={l.id} className="hover:bg-[#fafafa]">
                <td className="h-10 border-b px-4 font-medium"><Link href={`/lists/${l.id}`} className="hover:underline">{l.name}</Link></td>
                <td className="border-b px-4"><span className="inline-flex items-center gap-1.5"><ObjectIcon icon={l.object.icon} color={l.object.color} /> {l.object.plural}</span></td>
                <td className="border-b px-4 text-ink-2">{l._count.entries}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {lists.length === 0 && <p className="px-4 py-10 text-center text-[13px] text-ink-3">Nenhuma lista ainda. Use o “+” em Listas na barra lateral.</p>}
      </div>
    </>
  );
}
