import { getDictionary } from "@/lib/i18n/getDictionary";
import type { Locale } from "@/lib/i18n/config";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = (await params) as { locale: Locale };
  const dict = getDictionary(locale);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V8l8-5 8 5v13" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 21v-6h6v6M9 12h.01M15 12h.01M9 9h.01M15 9h.01" />
          </svg>
        </div>
        <h1 className="mb-1 text-center text-2xl font-semibold tracking-tight text-ink">
          {dict.common.appName}
        </h1>
        <p className="mb-6 text-center text-sm text-ink-muted">{dict.login.subtitle}</p>
        <LoginForm locale={locale} dict={dict.login} />
      </div>
    </div>
  );
}
