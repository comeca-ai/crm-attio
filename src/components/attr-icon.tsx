import {
  AtSign, Building2, Calendar, CalendarClock, ChevronsUpDown, CircleDot, DollarSign, Globe, Hash, IdCard, Link as LinkIcon, MapPin,
  Phone, SquareCheck, Tags, Type, UserRound, ArrowUpRight, Users,
} from "lucide-react";
import type { AttrType } from "@/lib/types";

/** Ícone fino de cada tipo de atributo, como nos cabeçalhos do Attio. */
export function AttrIcon({ type, size = 14, slug }: { type: AttrType; size?: number; slug?: string }) {
  const p = { size, strokeWidth: 1.7, className: "shrink-0 text-ink-3" };
  if (slug === "team" || slug === "associated_people") return <Users {...p} />;
  if (slug === "company" || slug === "associated_company") return <Building2 {...p} />;
  switch (type) {
    case "number": return <Hash {...p} />;
    case "currency": return <DollarSign {...p} />;
    case "date": return <Calendar {...p} />;
    case "timestamp": return <CalendarClock {...p} />;
    case "select": return <ChevronsUpDown {...p} />;
    case "multiselect": return <Tags {...p} />;
    case "status": return <CircleDot {...p} />;
    case "user": return <UserRound {...p} />;
    case "relation": return <ArrowUpRight {...p} />;
    case "email": return <AtSign {...p} />;
    case "url": return <LinkIcon {...p} />;
    case "domain": return <Globe {...p} />;
    case "phone": return <Phone {...p} />;
    case "location": return <MapPin {...p} />;
    case "personal-name": return <IdCard {...p} />;
    case "checkbox": return <SquareCheck {...p} />;
    default: return <Type {...p} />;
  }
}
