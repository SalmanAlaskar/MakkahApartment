import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, canSeePartnerShares, isAdmin } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import type { Locale } from "@/lib/i18n/config";
import { LocaleToggle } from "@/components/layout/LocaleToggle";
import { LogoutButton } from "@/components/layout/LogoutButton";

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

  const navItems = [
    { href: `/${locale}/dashboard`, label: dict.nav.dashboard, show: true },
    { href: `/${locale}/reservations`, label: dict.nav.reservations, show: true },
    { href: `/${locale}/partners`, label: dict.nav.partners, show: canSeePartnerShares(user.role) },
    { href: `/${locale}/settings`, label: dict.nav.settings, show: isAdmin(user.role) },
  ];

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="font-semibold">{dict.common.appName}</span>
          <div className="flex items-center gap-4">
            <LocaleToggle locale={locale} label={dict.nav.language} />
            <LogoutButton locale={locale} label={dict.nav.logout} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl justify-around">
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 py-3 text-center text-sm text-gray-700"
              >
                {item.label}
              </Link>
            ))}
        </div>
      </nav>
    </div>
  );
}
