import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, signSession } from "@/lib/session";
import { err, json } from "@/lib/api";
import { LOCALE_COOKIE } from "@/i18n/dict";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return err("auth.missing");
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) return err("auth.invalid", 401);
  const res = json({ ok: true, locale: user.locale });
  const opts = { sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 365, secure: process.env.COOKIE_SECURE === "true" };
  res.cookies.set(SESSION_COOKIE, await signSession(user.id), { ...opts, httpOnly: true, maxAge: 60 * 60 * 24 * 30 });
  res.cookies.set(LOCALE_COOKIE, user.locale, opts);
  return res;
}
