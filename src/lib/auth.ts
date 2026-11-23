import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { SESSION_COOKIE, verifySession } from "./session";
import { fullName } from "./format";

export async function getCurrentUser() {
  const store = await cookies();
  const id = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!id) return null;
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return null;
  return { id: u.id, firstName: u.firstName, lastName: u.lastName, name: fullName(u), email: u.email, avatarColor: u.avatarColor, locale: u.locale, timezone: u.timezone, weekStart: u.weekStart };
}

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}

export const apiUser = getCurrentUser;
