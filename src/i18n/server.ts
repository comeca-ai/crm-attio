import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale, translate, type Locale, type MessageKey } from "./dict";

/** Idioma: cookie (gravado ao trocar e no login, a partir do perfil) → cabeçalho do navegador → inglês. */
export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (c) return normalizeLocale(c);
  const al = (await headers()).get("accept-language");
  return al?.toLowerCase().startsWith("pt") ? "pt-BR" : "en";
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars) };
}
