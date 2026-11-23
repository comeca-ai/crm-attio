"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { LOCALES, LOCALE_LABEL, LOCALE_COOKIE } from "@/i18n/dict";

export default function LoginPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [email, setEmail] = useState("jhonata@exemplo.com");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    setLoading(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setErr(d.error || t("common.error"));
      return;
    }
    router.push("/home");
    router.refresh();
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-panel px-4">
      <form onSubmit={submit} className="w-full max-w-[360px] rounded-2xl border border-line-2 bg-white p-7 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-lg bg-[#1c1d1f] text-[15px] font-bold text-white">A</div>
        <h1 className="text-[20px] font-semibold tracking-[-0.01em]">{t("auth.title")}</h1>
        <p className="mb-6 mt-1 text-[13px] text-ink-2">{t("auth.subtitle")}</p>
        <label className="mb-3 block">
          <span className="mb-1 block text-[12px] font-medium text-ink-2">{t("auth.email")}</span>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 w-full rounded-lg border border-line-2 px-3 text-[14px] outline-none focus:border-[#9dbcf8] focus:ring-2 focus:ring-[#e3ecfd]" />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-[12px] font-medium text-ink-2">{t("auth.password")}</span>
          <input type="password" autoComplete="current-password" required autoFocus value={password} onChange={(e) => setPassword(e.target.value)} className="h-9 w-full rounded-lg border border-line-2 px-3 text-[14px] outline-none focus:border-[#9dbcf8] focus:ring-2 focus:ring-[#e3ecfd]" />
        </label>
        {err && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>}
        <button disabled={loading} className="h-9 w-full rounded-lg bg-[#266df0] text-[14px] font-medium text-white hover:bg-[#1f5fd6] disabled:opacity-60">
          {loading ? t("auth.submitting") : t("auth.submit")}
        </button>
        <p className="mt-4 text-center text-[12px] text-ink-3">{t("auth.demo")} <code className="rounded bg-hover px-1">attio123</code></p>
        <div className="mt-4 flex justify-center gap-3 text-[12px]">
          {LOCALES.map((l) => (
            <button type="button" key={l} onClick={() => { document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`; router.refresh(); }} className={l === locale ? "font-medium text-ink" : "text-ink-3 hover:text-ink-2"}>{LOCALE_LABEL[l]}</button>
          ))}
        </div>
      </form>
    </div>
  );
}
