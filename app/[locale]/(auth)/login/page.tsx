import { getDictionary } from "@/lib/i18n/getDictionary";
import { BuildingIcon } from "@/components/layout/icons";
import { LocaleToggle } from "@/components/layout/LocaleToggle";
import type { Locale } from "@/lib/i18n/config";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: Locale };
  const dict = getDictionary(locale);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="absolute top-4 end-4">
        <LocaleToggle locale={locale} label={dict.nav.language} />
      </div>
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 shadow-md">
          <BuildingIcon className="h-7 w-7 text-white" />
        </div>
        <h1 className="mb-1 text-center text-2xl font-semibold text-gray-900">{dict.common.appName}</h1>
        <p className="mb-6 text-center text-sm text-gray-600">{dict.login.subtitle}</p>
        <LoginForm locale={locale} dict={dict.login} />
      </div>
    </div>
  );
}
