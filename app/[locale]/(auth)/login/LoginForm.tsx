"use client";

import { useActionState } from "react";
import { sendMagicLink } from "@/lib/actions/auth";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/getDictionary";

export function LoginForm({ locale, dict }: { locale: Locale; dict: Dictionary["login"] }) {
  const [state, formAction, isPending] = useActionState(sendMagicLink.bind(null, locale), {});

  if (state.sent) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-md">
        <p className="text-lg font-medium">{dict.checkEmail}</p>
        <p className="mt-2 text-sm text-gray-600">
          {dict.checkEmailBody.replace("{email}", state.email ?? "")}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          {dict.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder={dict.emailPlaceholder}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          dir="ltr"
        />
      </div>
      {state.error && (
        <p className="text-sm text-red-600" dir="ltr">
          {state.error === "required" ? dict.error : state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-sky-600 px-4 py-2 text-base font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
      >
        {dict.sendLink}
      </button>
    </form>
  );
}
