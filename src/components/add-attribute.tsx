"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ATTR_TYPES, typeKey, type Attr, type AttrType } from "@/lib/types";
import { COLOR_KEYS } from "@/lib/format";
import { useI18n } from "@/i18n/client";
import { useCrm } from "./crm-context";
import { Button, Field, Modal, api, inputCls } from "./ui";
import { AttrIcon } from "./attr-icon";

export function AddAttributeModal({ objectSlug, onClose, onCreated }: { objectSlug: string; onClose: () => void; onCreated?: (a: Attr) => void }) {
  const { t } = useI18n();
  const { objects } = useCrm();
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<AttrType>("text");
  const [opts, setOpts] = useState("");
  const [rel, setRel] = useState(objects[0]?.id ?? "");
  const [multiple, setMultiple] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "BRL">("USD");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const hasOptions = type === "select" || type === "multiselect" || type === "status";

  const save = async () => {
    setErr("");
    setSaving(true);
    try {
      const options = opts.split("\n").map((l) => l.trim()).filter(Boolean).map((label, i) => ({ label, color: COLOR_KEYS[(i + 1) % COLOR_KEYS.length] }));
      if (!name.trim()) throw new Error(t("attr.nameRequired"));
      if (hasOptions && options.length === 0) throw new Error(t("attr.optionsRequired"));
      const a = await api<Attr>(`/api/objects/${objectSlug}/attributes`, "POST", { name, type, options, relationObjectId: rel, multiple, currency });
      onCreated?.(a);
      router.refresh();
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t("attr.new")} onClose={onClose} width={480}>
      <Field label={t("attr.name")}>
        <input autoFocus className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("attr.namePh")} data-testid="attr-name" />
      </Field>
      <Field label={t("attr.type")}>
        <div className="grid grid-cols-3 gap-1.5">
          {ATTR_TYPES.map((ty) => (
            <button key={ty} type="button" onClick={() => setType(ty)} className={`flex h-8 items-center gap-1.5 rounded-lg border px-2 text-[12.5px] ${type === ty ? "border-[#9dbcf8] bg-[#f2f6fe] text-ink" : "border-line-2 text-ink-2 hover:bg-hover"}`}>
              <AttrIcon type={ty} />
              <span className="truncate">{t(typeKey(ty))}</span>
            </button>
          ))}
        </div>
      </Field>
      {hasOptions && (
        <Field label={t("attr.options")}>
          <textarea className={`${inputCls} h-24 py-2`} value={opts} onChange={(e) => setOpts(e.target.value)} placeholder={"Referral\nWebsite\nEvent"} />
        </Field>
      )}
      {type === "currency" && (
        <Field label={t("attr.currency")}>
          <select className={inputCls} value={currency} onChange={(e) => setCurrency(e.target.value as "USD" | "BRL")}>
            <option value="USD">USD — US Dollar ($)</option><option value="BRL">BRL — Real brasileiro (R$)</option>
          </select>
        </Field>
      )}
      {type === "relation" && (
        <>
          <Field label={t("attr.relatesTo")}>
            <select className={inputCls} value={rel} onChange={(e) => setRel(e.target.value)}>
              {objects.map((o) => <option key={o.id} value={o.id}>{o.plural}</option>)}
            </select>
          </Field>
          <label className="mb-3 flex items-center gap-2 text-[13px]"><input type="checkbox" checked={multiple} onChange={(e) => setMultiple(e.target.checked)} />{t("attr.multiple")}</label>
        </>
      )}
      {err && <p className="mb-2 text-[12px] text-red-600">{err}</p>}
      <div className="flex justify-end gap-2">
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button variant="primary" onClick={save} disabled={saving} data-testid="attr-create">{saving ? t("attr.creating") : t("attr.new")}</Button>
      </div>
    </Modal>
  );
}
