import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col" data-testid="skeleton">
      <div className="flex h-[42px] items-center border-b border-line px-3"><Skeleton className="h-3 w-40" /></div>
      <div className="flex flex-1">
        <div className="w-[36%] max-w-[434px] space-y-3 border-r border-line p-4">
          <Skeleton className="h-5 w-40" /><div className="flex gap-2"><Skeleton className="h-6 w-24 rounded-md" /><Skeleton className="h-6 w-20 rounded-md" /><Skeleton className="h-6 w-20 rounded-md" /></div>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="flex gap-6"><Skeleton className="h-2.5 w-20" /><Skeleton className="h-2.5 w-40" /></div>)}
        </div>
        <div className="flex-1 p-4"><div className="grid grid-cols-3 gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[70px] rounded-lg" />)}</div></div>
      </div>
    </div>
  );
}
