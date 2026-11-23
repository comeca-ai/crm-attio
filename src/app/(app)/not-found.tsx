import Link from "next/link";
import { getT } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <p className="text-[15px] font-semibold">{t("api.notFound", { what: "Page" })}</p>
      <Link href="/home" className="text-[13px] text-[#266df0] hover:underline">{t("nav.home")}</Link>
    </div>
  );
}
