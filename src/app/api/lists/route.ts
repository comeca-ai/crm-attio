import { prisma } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { bad, json, unauthorized } from "@/lib/api";

export async function POST(req: Request) {
  if (!(await apiUser())) return unauthorized();
  const b = await req.json().catch(() => ({}));
  const name = String(b.name ?? "").trim();
  if (!name) return bad("Dê um nome à lista.");
  if (!b.objectId) return bad("Escolha o objeto da lista.");
  return json(await prisma.list.create({ data: { name, objectId: String(b.objectId) } }), 201);
}
