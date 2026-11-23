"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ATTR_TYPE_LABELS, type AttrType } from "@/lib/types";
import { COLOR_KEYS } from "@/lib/format";
import { useCrm } from "./crm-context";
import { Button, Field, Modal, api, inputCls } from "./ui";
import { AttrIcon } from "./attr-icon";

export function AddAttributeModal({ objectSlug, onClose }: { objectSlug: string; onClose: () => void }) {
  const { objects } = useCrm();
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<AttrType>("text");
  const [opts, setOpts] = useState("");
  const [rel, setRel] = useState(objects[0]?.id ?? "");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setErr("");
    setSaving(true);
    try {
      const options = opts.split("\n").map((l) => l.trim()).filter(Boolean).map((label, i) => ({ label, color: COLOR_KEYS[(i + 1) % COLOR_KEYS.length] }));
      if ((type === "select" || type === "multiselect" || type === "status") && options.length === 0) throw new Error("Adicione pelo menos uma opção.");
      await api(`/api/objects/${objectSlug}/attributes`, "POST", { name, type, options, relationObjectId: rel });
      router.refresh();
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Novo atributo" onClose={onClose} width={440}>
      <Field label="Nome">
        <input autoFocus className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Origem do lead" />
      </Field>
      <Field label="Tipo">
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(ATTR_TYPE_LABELS) as AttrType[]).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} className={`flex h-8 items-center gap-1.5 rounded-lg border px-2 text-[12.5px] ${type === t ? "border-[#9dbcf8] bg-[#f2f6fe] text-ink" : "border-line-2 text-ink-2 hover:bg-hover"}`}>
              <AttrIcon type={t} />
              {ATTR_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </Field>
      {(type === "select" || type === "multiselect" || type === "status") && (
        <Field label="Opções (uma por linha)">
          <textarea className={`${inputCls} h-24 py-2`} value={opts} onChange={(e) => setOpts(e.target.value)} placeholder={"Indicação\nSite\nEvento"} />
        </Field>
      )}
      {type === "relation" && (
        <Field label="Relaciona com">
          <select className={inputCls} value={rel} onChange={(e) => setRel(e.target.value)}>
            {objects.map((o) => <option key={o.id} value={o.id}>{o.plural}</option>)}
          </select>
        </Field>
      )}
      {err && <p className="mb-2 text-[12px] text-red-600">{err}</p>}
      <div className="flex justify-end gap-2">
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={save} disabled={saving}>{saving ? "Criando…" : "Criar atributo"}</Button>
      </div>
    </Modal>
  );
}
