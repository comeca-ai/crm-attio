import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { err, json, withUser } from "@/lib/api";
import { domainColor } from "@/lib/format";

export async function POST(req: Request) {
  return withUser(async (me) => {
    const b = await req.json().catch(() => ({}));
    const email = String(b.email ?? "").toLowerCase().trim();
    const [firstName, ...rest] = String(b.name ?? "").trim().split(/\s+/);
    if (!email || !firstName || !b.password) return err("auth.missing");
    if (await prisma.user.findUnique({ where: { email } })) return err("set.members.exists", 409);
    const u = await prisma.user.create({ data: { email, firstName, lastName: rest.join(" "), passwordHash: await bcrypt.hash(String(b.password), 10), avatarColor: domainColor(email), locale: me.locale } });
    return json({ id: u.id }, 201);
  });
}
