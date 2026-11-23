import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { SESSION_COOKIE, verifySession } from "./session";

export async function getCurrentUser() {
  const store = await cookies();
  const id = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!id) return null;
  return prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, avatarColor: true } });
}

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}

/** Para route handlers: retorna o usuário ou null (o handler responde 401). */
export async function apiUser() {
  return getCurrentUser();
}
