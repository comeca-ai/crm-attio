import { prisma } from "@/lib/db";
import { json, withUser } from "@/lib/api";
import { LOCALE_COOKIE, normalizeLocale } from "@/i18n/dict";

/** Current user profile. */
export async function GET() {
  return withUser(async (user) => json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, name: user.name, locale: user.locale, timezone: user.timezone, weekStart: user.weekStart } }));
}

/** Atualiza o perfil; o idioma fica no banco e no cookie. */
export async function PATCH(req: Request) {
  return withUser(async (user) => {
    const b = await req.json().catch(() => ({}));
    const data: Record<string, string> = {};
    for (const k of ["firstName", "lastName", "timezone", "weekStart"]) if (typeof b[k] === "string" && b[k].trim()) data[k] = b[k].trim();
    if (typeof b.locale === "string") data.locale = normalizeLocale(b.locale);
    await prisma.user.update({ where: { id: user.id }, data });
    const res = json({ ok: true });
    if (data.locale) res.cookies.set(LOCALE_COOKIE, data.locale, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
    return res;
  });
}
