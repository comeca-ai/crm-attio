import { prisma } from "./db";
import { asArray } from "./format";
import type { AttrConfig } from "./types";

type A = { id: string; slug: string; config: unknown };
const cfg = (a: A) => (a.config ?? {}) as AttrConfig;

async function setRef(recordId: string, attr: A, otherId: string, add: boolean, depth: number) {
  const rec = await prisma.record.findUnique({ where: { id: recordId } });
  if (!rec) return;
  const values = { ...(rec.values as Record<string, unknown>) };
  const multiple = !!cfg(attr).multiple;
  const cur = asArray(values[attr.slug]);
  if (add) {
    if (cur.includes(otherId)) return;
    if (multiple) values[attr.slug] = [...cur, otherId];
    else {
      // Relação simples: o registro deixa de apontar para o anterior; o anterior perde a referência inversa
      const prev = cur[0];
      values[attr.slug] = otherId;
      if (prev && prev !== otherId && depth < 2) {
        const inverse = await inverseOf(attr);
        if (inverse) await setRef(prev, inverse, recordId, false, depth + 1);
      }
    }
  } else {
    if (!cur.includes(otherId)) return;
    values[attr.slug] = multiple ? cur.filter((x) => x !== otherId) : null;
  }
  await prisma.record.update({ where: { id: recordId }, data: { values: values as object } });
}

async function inverseOf(attr: A) {
  const id = cfg(attr).inverseAttrId;
  return id ? prisma.attribute.findUnique({ where: { id } }) : null;
}

/** Mantém os dois lados de uma relação em sincronia (ex.: Empresa.Equipe ↔ Pessoa.Empresa). */
export async function syncInverse(recordId: string, attr: A, oldValue: unknown, newValue: unknown) {
  const inverse = await inverseOf(attr);
  if (!inverse) return;
  const before = new Set(asArray(oldValue));
  const after = new Set(asArray(newValue));
  for (const id of before) if (!after.has(id)) await setRef(id, inverse, recordId, false, 0);
  for (const id of after) if (!before.has(id)) await setRef(id, inverse, recordId, true, 0);
}

/** Antes de excluir um registro, remove as referências a ele nos registros relacionados. */
export async function detachRecord(recordId: string) {
  const rec = await prisma.record.findUnique({ where: { id: recordId }, include: { object: { include: { attributes: true } } } });
  if (!rec) return;
  for (const a of rec.object.attributes.filter((x) => x.type === "relation")) {
    await syncInverse(recordId, a, (rec.values as Record<string, unknown>)[a.slug], null);
  }
}
