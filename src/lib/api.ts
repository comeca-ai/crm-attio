import { NextResponse } from "next/server";
import { getT } from "@/i18n/server";
import type { MessageKey } from "@/i18n/dict";
import { apiUser } from "./auth";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

export async function err(key: MessageKey, status = 400, vars?: Record<string, string>) {
  const { t } = await getT();
  return json({ error: t(key, vars) }, status);
}

/** Executa o handler só com usuário logado. */
export async function withUser<T>(fn: (user: NonNullable<Awaited<ReturnType<typeof apiUser>>>) => Promise<T>) {
  const user = await apiUser();
  if (!user) return err("auth.required", 401);
  return fn(user);
}
