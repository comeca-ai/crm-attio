import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, signSession } from "@/lib/session";
import { bad, json } from "@/lib/api";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return bad("Informe e-mail e senha.");
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
    return json({ error: "E-mail ou senha incorretos." }, 401);
  }
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await signSession(user.id), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
    secure: process.env.COOKIE_SECURE === "true",
  });
  return res;
}
