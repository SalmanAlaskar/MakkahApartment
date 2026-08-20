"use client";

import { useActionState } from "react";
import { login, type LoginActionState } from "@/lib/actions/auth";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/getDictionary";

export function LoginForm({ locale, dict }: { locale: Locale; dict: Dictionary["login"] }) {
  const [state, formAction, isPending] = useActionState<LoginActionState, FormData>(
    login.bind(null, locale),
    {},
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-stone-dark bg-surface p-6 shadow-sm"
    >
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-ink">
          {dict.passwordLabel}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="mt-1.5 block w-full rounded-lg border border-stone-dark bg-stone/40 px-3.5 py-2.5 text-base text-ink transition focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-soft"
          dir="ltr"
        />
      </div>
      {state.error && (
        <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{dict.error}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-base font-medium text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {dict.signIn}
      </button>
    </form>
  );
}
