import { prisma } from "@/lib/db";
import { err, json, withUser } from "@/lib/api";

export async function POST(req: Request) {
  return withUser(async () => {
    const b = await req.json().catch(() => ({}));
    const name = String(b.name ?? "").trim();
    if (!name) return err("list.nameRequired");
    if (!b.objectId) return err("api.pickRelation");
    return json(await prisma.list.create({ data: { name, objectId: String(b.objectId) } }), 201);
  });
}
