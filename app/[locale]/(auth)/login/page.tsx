import { getDictionary } from "@/lib/i18n/getDictionary";
import type { Locale } from "@/lib/i18n/config";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: Locale };
  const dict = getDictionary(locale);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-semibold">{dict.common.appName}</h1>
        <p className="mb-6 text-center text-sm text-gray-600">{dict.login.subtitle}</p>
        <LoginForm locale={locale} dict={dict.login} />
      </div>
    </div>
  );
}
