import Link from "next/link";
export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2">
      <p className="text-[15px] font-semibold">Página não encontrada</p>
      <Link href="/tasks" className="text-[13px] text-[#266df0] hover:underline">Voltar para Tarefas</Link>
    </div>
  );
}
