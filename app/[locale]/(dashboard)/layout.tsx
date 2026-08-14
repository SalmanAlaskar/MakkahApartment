import { redirect } from "next/navigation";
import { getCurrentUser, canSeePartnerShares, isAdmin } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import type { Locale } from "@/lib/i18n/config";
import { LocaleToggle } from "@/components/layout/LocaleToggle";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { BottomNav, type NavItem } from "@/components/layout/BottomNav";
import { BuildingIcon } from "@/components/layout/icons";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const dict = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const navItems: NavItem[] = [
    { href: `/${locale}/dashboard`, label: dict.nav.dashboard, icon: "dashboard" },
    { href: `/${locale}/reservations`, label: dict.nav.reservations, icon: "reservations" },
    ...(canSeePartnerShares(user.role)
      ? [{ href: `/${locale}/partners`, label: dict.nav.partners, icon: "partners" as const }]
      : []),
    ...(isAdmin(user.role)
      ? [{ href: `/${locale}/settings`, label: dict.nav.settings, icon: "settings" as const }]
      : []),
  ];

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 font-semibold text-gray-900">
            <BuildingIcon className="h-5 w-5 text-sky-600" />
            {dict.common.appName}
          </span>
          <div className="flex items-center gap-4">
            <LocaleToggle locale={locale} label={dict.nav.language} />
            <LogoutButton locale={locale} label={dict.nav.logout} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      <BottomNav items={navItems} />
    </div>
  );
}
