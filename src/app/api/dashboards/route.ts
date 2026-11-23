import { prisma } from "@/lib/db";
import { json, withUser } from "@/lib/api";

export async function POST(req: Request) {
  return withUser(async () => {
    const b = await req.json().catch(() => ({}));
    const d = await prisma.dashboard.create({ data: { name: String(b.name ?? "").trim() || "Untitled dashboard" } });
    return json(d, 201);
  });
}
