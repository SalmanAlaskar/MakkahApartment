import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";

export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  redirect(`/${locale}/dashboard`);
}
