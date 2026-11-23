import type { Metadata } from "next";
import "./globals.css";
import { getLocale } from "@/i18n/server";
import { I18nProvider } from "@/i18n/client";

export const metadata: Metadata = {
  title: "Attio CRM (self-hosted)",
  description: "Self-hosted CRM modeled on Attio",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className="h-full">
      <body className="h-full">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
