import { AlignLeft, Hash, DollarSign, Calendar, ChevronDownCircle, CircleDot, User, Link2, AtSign, Globe, CheckSquare, Tags } from "lucide-react";
import type { AttrType } from "@/lib/types";

export function AttrIcon({ type, size = 13 }: { type: AttrType; size?: number }) {
  const p = { size, className: "shrink-0 text-ink-3", strokeWidth: 2 };
  switch (type) {
    case "number": return <Hash {...p} />;
    case "currency": return <DollarSign {...p} />;
    case "date": return <Calendar {...p} />;
    case "select": return <ChevronDownCircle {...p} />;
    case "status": return <CircleDot {...p} />;
    case "multiselect": return <Tags {...p} />;
    case "user": return <User {...p} />;
    case "relation": return <Link2 {...p} />;
    case "email": return <AtSign {...p} />;
    case "url": return <Globe {...p} />;
    case "checkbox": return <CheckSquare {...p} />;
    default: return <AlignLeft {...p} />;
  }
}
