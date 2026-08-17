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
    <form action={formAction} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          {dict.passwordLabel}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-gray-500 focus:outline-none"
          dir="ltr"
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{dict.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-base font-medium text-white disabled:opacity-60"
      >
        {dict.signIn}
      </button>
    </form>
  );
}
