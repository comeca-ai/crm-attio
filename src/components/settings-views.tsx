"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Box, ChevronLeft, CircleCheck, Info, List as ListIcon, Plus, Search, SlidersHorizontal, Trash2, UserRound, Users, Palette, Settings2, Shield, LayoutList, Pencil, Check } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { LOCALES, LOCALE_LABEL, type Locale } from "@/i18n/dict";
import { typeKey, type Attr, type ObjectLite } from "@/lib/types";
import { useCrm } from "./crm-context";
import { Avatar, Button, Field, Modal, ObjectIcon, api, inputCls } from "./ui";
import { TopBar, Crumb } from "./topbar";
import { AttrIcon } from "./attr-icon";
import { AddAttributeModal } from "./add-attribute";
import { switchLocale } from "./sidebar";
import { EmptyState } from "./empty-state";

export function SettingsFrame({ crumb, title, desc, children, back }: { crumb: React.ReactNode; title?: React.ReactNode; desc?: string; children: React.ReactNode; back?: string }) {
  const { t } = useI18n();
  return (
    <>
      <TopBar variant="help">{crumb}</TopBar>
      <div className="scroll-thin flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[715px] px-5 pb-20 pt-[60px]">
          {back && <Link href={back} className="mb-4 inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink"><ChevronLeft size={14} />{t("common.back")}</Link>}
          {title && <h1 className="text-[20px] font-semibold tracking-[-0.01em]">{title}</h1>}
          {desc && <p className="mt-1 text-[13px] text-ink-2">{desc}</p>}
          {children}
        </div>
      </div>
    </>
  );
}

const sectionTitle = "text-[14px] font-semibold";
const sectionDesc = "mt-0.5 text-[13px] text-ink-2";

export function LanguagePicker({ testid = "language-select" }: { testid?: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  return (
    <div>
      <p className={sectionTitle}>{t("set.lang")}</p>
      <p className={sectionDesc}>{t("set.langDesc")}</p>
      <div className="mt-3 grid grid-cols-2 gap-2" data-testid={testid}>
        {LOCALES.map((l) => (
          <button key={l} onClick={() => l !== locale && switchLocale(l as Locale, () => router.refresh())} data-testid={`lang-${l}`}
            className={clsx("flex h-10 items-center justify-between rounded-lg border px-3 text-[13px]", l === locale ? "border-[#9dbcf8] bg-[#f2f6fe] font-medium" : "border-line-2 hover:bg-hover")}>
            {LOCALE_LABEL[l]}{l === locale && <Check size={14} className="text-[#266df0]" />}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProfileSettings({ profile }: { profile: { firstName: string; lastName: string; email: string; timezone: string; weekStart: string; avatarColor: string } }) {
  const { t } = useI18n();
  const router = useRouter();
  const [f, setF] = useState(profile);
  const [saved, setSaved] = useState(false);
  const save = async (patch: Partial<typeof f>) => {
    const next = { ...f, ...patch };
    setF(next);
    await api("/api/me", "PATCH", next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    router.refresh();
  };
  const zones = ["America/Fortaleza", "America/Sao_Paulo", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Lisbon", "UTC"];
  return (
    <SettingsFrame crumb={<Crumb icon={<UserRound size={14} className="text-ink-2" />}>{t("set.profile")}</Crumb>} title={t("set.profile")} desc={t("set.profile.desc")}>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-[#fafafb] px-3 py-2.5 text-[13px] text-ink-2"><Info size={14} />{t("set.profile.notice")}</div>
      <div className="mt-7 flex items-center gap-4">
        <Avatar name={`${f.firstName} ${f.lastName}`} color={f.avatarColor} size={60} />
        <div><p className="text-[13px] font-medium">{t("set.profile.picture")}</p><p className="text-[12px] text-ink-2">{t("set.profile.pictureHint")}</p></div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label={t("set.profile.first")}><input className={inputCls} value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} onBlur={() => save({})} data-testid="profile-first" /></Field>
        <Field label={t("set.profile.last")}><input className={inputCls} value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} onBlur={() => save({})} /></Field>
      </div>
      <Field label={t("set.profile.email")}><input className={clsx(inputCls, "bg-[#fafafb]")} value={f.email} readOnly /></Field>
      <div className="mt-8"><LanguagePicker /></div>
      <div className="mt-8">
        <p className={sectionTitle}>{t("set.profile.time")}</p><p className={sectionDesc}>{t("set.profile.timeDesc")}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label={t("set.profile.tz")}><select className={inputCls} value={f.timezone} onChange={(e) => save({ timezone: e.target.value })}>{zones.map((z) => <option key={z}>{z}</option>)}</select></Field>
          <Field label={t("set.profile.week")}><select className={inputCls} value={f.weekStart} onChange={(e) => save({ weekStart: e.target.value })}><option value="monday">{t("set.profile.monday")}</option><option value="sunday">{t("set.profile.sunday")}</option></select></Field>
        </div>
      </div>
      {saved && <p className="fixed bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[12.5px] text-white"><CircleCheck size={13} />{t("set.profile.saved")}</p>}
    </SettingsFrame>
  );
}

export function AppearanceSettings() {
  const { t } = useI18n();
  return (
    <SettingsFrame crumb={<Crumb icon={<Palette size={14} className="text-ink-2" />}>{t("set.appearance")}</Crumb>} title={t("set.appearance")} desc={t("set.appearance.desc")}>
      <div className="mt-8"><LanguagePicker testid="appearance-language" /></div>
      <div className="mt-8">
        <p className={sectionTitle}>{t("set.theme")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="flex h-10 items-center justify-between rounded-lg border border-[#9dbcf8] bg-[#f2f6fe] px-3 text-[13px] font-medium">{t("set.theme.light")}<Check size={14} className="text-[#266df0]" /></div>
          <div className="flex h-10 items-center rounded-lg border border-line-2 px-3 text-[13px] text-ink-3">{t("set.theme.dark")}</div>
        </div>
      </div>
    </SettingsFrame>
  );
}

export function GeneralSettings({ name }: { name: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [v, setV] = useState(name);
  return (
    <SettingsFrame crumb={<Crumb icon={<Settings2 size={14} className="text-ink-2" />}>{t("set.general")}</Crumb>} title={t("set.general")} desc={t("set.general.desc")}>
      <div className="mt-6 flex items-end gap-2">
        <div className="flex-1"><Field label={t("set.general.name")}><input className={inputCls} value={v} onChange={(e) => setV(e.target.value)} data-testid="workspace-name" /></Field></div>
        <Button variant="primary" className="mb-3" onClick={async () => { await api("/api/workspace", "PATCH", { name: v }); router.refresh(); }}>{t("common.save")}</Button>
      </div>
    </SettingsFrame>
  );
}

export function MembersSettings({ members }: { members: { id: string; name: string; email: string; avatarColor: string }[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const invite = async () => {
    try { await api("/api/members", "POST", f); setOk(true); setOpen(false); setF({ name: "", email: "", password: "" }); router.refresh(); }
    catch (e) { setErr((e as Error).message); }
  };
  return (
    <SettingsFrame crumb={<Crumb icon={<Users size={14} className="text-ink-2" />}>{t("set.members")}</Crumb>} title={t("set.members")} desc={t("set.members.desc")}>
      <div className="mt-6 flex justify-end"><Button variant="primary" onClick={() => setOpen(true)} data-testid="invite-member"><Plus size={14} />{t("set.members.invite")}</Button></div>
      {ok && <p className="mt-3 rounded-lg border border-[#bfe6cd] bg-[#eefaf2] px-3 py-2 text-[13px] text-[#11823b]">{t("set.members.invited")}</p>}
      <div className="mt-3 overflow-hidden rounded-xl border border-line">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0" data-testid="member-row">
            <Avatar name={m.name} color={m.avatarColor} size={26} />
            <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{m.name}</p><p className="truncate text-[12px] text-ink-2">{m.email}</p></div>
            <span className="rounded-md bg-[#f1f1f3] px-1.5 py-0.5 text-[12px] text-ink-2">{t("set.members.admin")}</span>
          </div>
        ))}
      </div>
      {open && (
        <Modal title={t("set.members.invite")} onClose={() => setOpen(false)} width={420}>
          <Field label={t("set.members.name")}><input autoFocus className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label={t("set.members.email")}><input className={inputCls} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label={t("set.members.password")}><input className={inputCls} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
          {err && <p className="mb-2 text-[12px] text-red-600">{err}</p>}
          <div className="flex justify-end gap-2"><Button onClick={() => setOpen(false)}>{t("common.cancel")}</Button><Button variant="primary" onClick={invite}>{t("set.members.invite")}</Button></div>
        </Modal>
      )}
    </SettingsFrame>
  );
}

export function ObjectsSettings({ objects }: { objects: (ObjectLite & { records: number; attributes: number })[] }) {
  const { t } = useI18n();
  return (
    <SettingsFrame crumb={<Crumb icon={<Box size={14} className="text-ink-2" />}>{t("set.objects")}</Crumb>} title={t("set.objects")} desc={t("set.objects.desc")}>
      <div className="mt-6 overflow-hidden rounded-xl border border-line">
        {objects.map((o) => (
          <Link key={o.id} href={`/settings/objects/${o.slug}`} className="flex items-center gap-3 border-b border-line px-3 py-3 last:border-0 hover:bg-[#fafafb]" data-testid="object-row">
            <ObjectIcon icon={o.icon} color={o.color} size={26} solid />
            <span className="flex-1 text-[13.5px] font-medium">{o.plural}</span>
            <span className="rounded bg-[#f1f1f3] px-1.5 text-[11.5px] text-ink-2">{t("common.standard")}</span>
            <span className="w-24 text-right text-[12.5px] text-ink-2">{t("set.objects.records", { n: o.records })}</span>
            <span className="w-24 text-right text-[12.5px] text-ink-2">{t("set.objects.attributesCount", { n: o.attributes })}</span>
          </Link>
        ))}
      </div>
    </SettingsFrame>
  );
}

export function ObjectSettings({ object, slug, raw, attrs, tab, counts }: { object: ObjectLite; slug: string; raw: { singular: string; plural: string }; attrs: Attr[]; tab: "configuration" | "attributes"; counts: Record<string, number> }) {
  const { t } = useI18n();
  const router = useRouter();
  const { objects } = useCrm();
  const [plural, setPlural] = useState(object.plural);
  const [singular, setSingular] = useState(object.singular);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState<Attr | null>(null);
  const [newName, setNewName] = useState("");
  const saveNames = async () => {
    if (plural === object.plural && singular === object.singular) return;
    await api(`/api/objects/${slug}`, "PATCH", { plural, singular });
    router.refresh();
  };
  const tabs = [
    { id: "configuration", label: t("set.tab.configuration"), icon: <SlidersHorizontal size={13} />, href: `/settings/objects/${slug}` },
    { id: "permissions", label: t("set.security"), icon: <Shield size={13} />, href: null },
    { id: "attributes", label: t("set.tab.attributes"), icon: <LayoutList size={13} />, href: `/settings/objects/${slug}/attributes`, count: attrs.length },
  ];
  const list = attrs.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()));
  void raw;
  return (
    <SettingsFrame back="/settings/objects" crumb={<><Crumb href="/settings/objects" icon={<Box size={14} />}>{t("set.objects")}</Crumb><span className="text-ink-3">/</span><Crumb icon={<ObjectIcon icon={object.icon} color={object.color} size={16} solid />}>{object.plural}</Crumb></>}>
      <div className="flex items-center gap-3">
        <ObjectIcon icon={object.icon} color={object.color} size={36} solid />
        <div>
          <h1 className="flex items-center gap-2 text-[20px] font-semibold">{object.plural}<span className="rounded bg-[#f1f1f3] px-1.5 text-[11px] font-medium text-ink-2">{t("common.standard")}</span></h1>
          <p className="text-[13px] text-ink-2">{t("set.objects.manage")}</p>
        </div>
      </div>
      <nav className="mt-5 flex gap-1 border-b border-line">
        {tabs.map((x) => x.href ? (
          <Link key={x.id} href={x.href} className={clsx("-mb-px flex h-9 items-center gap-1.5 border-b-2 px-2 text-[13px]", tab === x.id ? "border-ink font-medium" : "border-transparent text-ink-2 hover:text-ink")} data-testid={`settings-tab-${x.id}`}>
            {x.icon}{x.label}{x.count !== undefined && <span className="rounded bg-[#efeff1] px-1 text-[11px]">{x.count}</span>}
          </Link>
        ) : <span key={x.id} className="flex h-9 items-center gap-1.5 px-2 text-[13px] text-ink-3">{x.icon}{x.label}</span>)}
      </nav>

      {tab === "configuration" ? (
        <div className="mt-7">
          <p className={sectionTitle}>{t("set.config.general")}</p><p className={sectionDesc}>{t("set.config.generalDesc")}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label={t("set.config.plural")}><input className={inputCls} value={plural} onChange={(e) => setPlural(e.target.value)} onBlur={saveNames} data-testid="object-plural" /></Field>
            <Field label={t("set.config.singular")}><input className={inputCls} value={singular} onChange={(e) => setSingular(e.target.value)} onBlur={saveNames} /></Field>
          </div>
          <Field label={t("set.config.slug")}><div className={clsx(inputCls, "flex items-center gap-2 bg-[#fafafb]")}><span className="text-ink-3">/</span>{slug}</div></Field>
          <p className="-mt-2 text-[12px] text-ink-3">{t("set.config.slugHint")}</p>
        </div>
      ) : (
        <div className="mt-7">
          <div className="flex items-end justify-between">
            <div><p className={sectionTitle}>{t("set.tab.attributes")}</p><p className={sectionDesc}>{t("set.attrs.desc")}</p></div>
            <Button variant="primary" onClick={() => setAdding(true)} data-testid="create-attribute"><Plus size={14} />{t("attr.new")}</Button>
          </div>
          <label className="mt-3 flex h-8 items-center gap-1.5 rounded-lg border border-line-2 px-2 text-[13px]"><Search size={13} className="text-ink-3" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("set.attrs.search")} className="w-full outline-none placeholder:text-ink-3" /></label>
          <div className="mt-3 overflow-hidden rounded-xl border border-line">
            <div className="grid h-9 grid-cols-[1.4fr_1fr_0.8fr_1fr_60px] items-center border-b border-line px-3 text-[12.5px] text-ink-2">
              <span>{t("set.attrs.col.name")}</span><span>{t("set.attrs.col.type")}</span><span>{t("set.attrs.col.constraints")}</span><span>{t("set.attrs.col.properties")}</span><span />
            </div>
            {list.map((a) => {
              const rel = objects.find((o) => o.id === a.relationObjectId);
              return (
                <div key={a.id} className="group grid h-10 grid-cols-[1.4fr_1fr_0.8fr_1fr_60px] items-center border-b border-line px-3 text-[13px] last:border-0 hover:bg-[#fafafb]" data-testid="attribute-row">
                  <span className="flex min-w-0 items-center gap-2"><AttrIcon type={a.type} slug={a.slug} size={13} /><span className="truncate">{a.name}</span>{rel && <span className="flex items-center gap-1 text-[12px] text-ink-2"><ObjectIcon icon={rel.icon} color={rel.color} size={12} solid />{rel.plural}</span>}</span>
                  <span>{t(typeKey(a.type))}</span>
                  <span className="text-ink-2">{a.config.multiple ? t("constraint.multiple") : a.isPrimary ? t("constraint.required") : ""}</span>
                  <span className="flex gap-1">{a.isSystem ? <span className="rounded bg-[#f1f1f3] px-1.5 text-[11.5px] text-ink-2">{t("common.system")}</span> : <span className="rounded bg-[#efe5ff] px-1.5 text-[11.5px] text-[#6c33d6]">{t("common.custom")}</span>}</span>
                  <span className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100">
                    <button onClick={() => { setRenaming(a); setNewName(a.name); }} className="rounded p-1 text-ink-3 hover:bg-hover" aria-label={t("common.rename")}><Pencil size={13} /></button>
                    {!a.isSystem && <button onClick={async () => { if (!confirm(t("attr.confirmDelete", { name: a.name }))) return; await api(`/api/attributes/${a.id}`, "DELETE"); router.refresh(); }} className="rounded p-1 text-ink-3 hover:bg-hover" aria-label={t("common.delete")}><Trash2 size={13} /></button>}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[12px] text-ink-3">{t("set.objects.records", { n: counts.records ?? 0 })}</p>
        </div>
      )}
      {adding && <AddAttributeModal objectSlug={slug} onClose={() => setAdding(false)} />}
      {renaming && (
        <Modal title={t("common.rename")} onClose={() => setRenaming(null)} width={380}>
          <input autoFocus className={inputCls} value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={async (e) => { if (e.key === "Enter") { await api(`/api/attributes/${renaming.id}`, "PATCH", { name: newName }); setRenaming(null); router.refresh(); } }} />
          <div className="mt-3 flex justify-end gap-2"><Button onClick={() => setRenaming(null)}>{t("common.cancel")}</Button><Button variant="primary" onClick={async () => { await api(`/api/attributes/${renaming.id}`, "PATCH", { name: newName }); setRenaming(null); router.refresh(); }}>{t("common.save")}</Button></div>
        </Modal>
      )}
    </SettingsFrame>
  );
}

export function ListsSettings({ lists }: { lists: { id: string; name: string; object: string; entries: number }[] }) {
  const { t } = useI18n();
  return (
    <SettingsFrame crumb={<Crumb icon={<ListIcon size={14} className="text-ink-2" />}>{t("set.lists")}</Crumb>} title={t("set.lists")} desc={t("set.lists.desc")}>
      {lists.length === 0 ? <p className="mt-6 text-[13px] text-ink-2">{t("set.lists.empty")}</p> : (
        <div className="mt-6 overflow-hidden rounded-xl border border-line">
          <div className="grid h-9 grid-cols-[1.5fr_1fr_100px] items-center border-b border-line px-3 text-[12.5px] text-ink-2"><span>{t("set.lists.col.name")}</span><span>{t("set.lists.col.object")}</span><span className="text-right">{t("set.lists.col.entries")}</span></div>
          {lists.map((l) => (
            <Link key={l.id} href={`/lists/${l.id}`} className="grid h-10 grid-cols-[1.5fr_1fr_100px] items-center border-b border-line px-3 text-[13px] last:border-0 hover:bg-[#fafafb]">
              <span className="flex items-center gap-2 font-medium"><ListIcon size={13} className="text-ink-3" />{l.name}</span><span className="text-ink-2">{l.object}</span><span className="text-right tabular-nums text-ink-2">{l.entries}</span>
            </Link>
          ))}
        </div>
      )}
    </SettingsFrame>
  );
}

export function ComingSoonSettings({ title }: { title: string }) {
  const { t } = useI18n();
  return (
    <SettingsFrame crumb={<Crumb>{title}</Crumb>} title={title}>
      <EmptyState kind="doc" title={title} text={t("set.comingSoon")} />
    </SettingsFrame>
  );
}
