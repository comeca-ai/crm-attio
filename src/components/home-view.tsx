"use client";
import { useState } from "react";
import { hourIn, safeTz } from "@/lib/time";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, EllipsisVertical, Mic, ArrowUp } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { useCrm } from "./crm-context";
import { Button, api } from "./ui";
import { TaskRow, TaskModal, type TaskLite } from "./tasks";
import { TopBar, Crumb } from "./topbar";
import { House } from "lucide-react";
import { GoogleIcon } from "./ui";


export function HomeView({ tasks }: { tasks: TaskLite[] }) {
  const { t, locale } = useI18n();
  const { me } = useCrm();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<TaskLite | null>(null);
  const h = hourIn(me.timezone);
  const greet = h < 12 ? "home.greeting.morning" : h < 18 ? "home.greeting.afternoon" : "home.greeting.evening";
  const today = new Date().toLocaleDateString(locale === "pt-BR" ? "pt-BR" : "en-US", { month: "short", day: "numeric", timeZone: safeTz(me.timezone) });
  const mine = tasks.filter((x) => !x.completed && x.assigneeId === me.id).slice(0, 6);
  return (
    <>
      <TopBar variant="help"><Crumb icon={<House size={14} className="text-ink-2" />}>{t("nav.home")}</Crumb></TopBar>
      <div className="scroll-thin flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[640px] px-4 pb-16 pt-[44px]">
          <h1 className="px-1 text-[19px] font-semibold tracking-[-0.01em]" data-testid="greeting">{t(greet, { name: me.name })}</h1>
          <form onSubmit={(e) => { e.preventDefault(); router.push(`/chats?q=${encodeURIComponent(q)}`); }} className="mt-4 rounded-xl border border-[#dfe8fb] bg-white p-2.5 shadow-[0_0_0_3px_#f4f7fe]">
            <textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("home.ask")} rows={2} className="w-full resize-none bg-transparent px-1 text-[13.5px] outline-none placeholder:text-ink-3" />
            <div className="flex items-center justify-end gap-2">
              <span className="text-[12.5px] text-ink-2">{t("home.auto")}</span>
              <span className="h-5 w-6 rounded-md bg-[#f1f1f3]" />
              <button type="submit" className="flex h-6 w-6 items-center justify-center rounded-md bg-[#266df0] text-white" aria-label={t("home.ask")}>{q ? <ArrowUp size={13} /> : <Mic size={13} />}</button>
            </div>
          </form>

          <section className="mt-9">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[13px] font-medium text-ink-2">{t("home.meetings")}</h2>
              <div className="flex items-center gap-1 text-[12px] text-ink-2"><span>{t("common.today")}, {today}</span><ChevronLeft size={13} /><ChevronRight size={13} /><EllipsisVertical size={13} /></div>
            </div>
            <div className="py-6 text-center">
              <p className="text-[13.5px] font-medium">{t("home.meetings.title")}</p>
              <p className="mt-0.5 text-[12.5px] text-ink-2">{t("home.meetings.text")}</p>
              <Link href="/settings/email-calendar-accounts"><Button className="mt-2.5 h-7 px-2"><GoogleIcon />{t("home.meetings.sync")}</Button></Link>
            </div>
          </section>

          <section className="mt-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[13px] font-medium text-ink-2">{t("home.tasks")}</h2>
              <Link href="/tasks" className="text-[12px] text-ink-2 hover:text-ink">{t("common.viewAll")}</Link>
            </div>
            <div className="mt-1.5 [&>div]:border-b-0 [&>div]:px-1" data-testid="home-tasks">
              {mine.length === 0 && <p className="px-1 py-4 text-[13px] text-ink-3">{t("home.tasks.empty")}</p>}
              {mine.map((x) => <TaskRow key={x.id} task={x} onOpen={() => setOpen(x)} onToggle={async () => { await api(`/api/tasks/${x.id}`, "PATCH", { completed: true }); router.refresh(); }} />)}
            </div>
          </section>
        </div>
      </div>
      {open && <TaskModal task={open} onClose={() => setOpen(null)} />}
    </>
  );
}
