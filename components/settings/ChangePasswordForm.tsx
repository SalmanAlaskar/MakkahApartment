"use client";

import { useActionState } from "react";
import { changePassword, type ChangePasswordActionState } from "@/lib/actions/auth";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/getDictionary";

const ERROR_KEY: Record<NonNullable<ChangePasswordActionState["error"]>, "errorCurrent" | "errorShort" | "errorMismatch"> =
  {
    current: "errorCurrent",
    short: "errorShort",
    mismatch: "errorMismatch",
  };

export function ChangePasswordForm({ locale, dict }: { locale: Locale; dict: Dictionary["changePassword"] }) {
  const [state, formAction, isPending] = useActionState<ChangePasswordActionState, FormData>(
    changePassword.bind(null, locale),
    {},
  );

  const inputClass =
    "mt-1.5 block w-full rounded-lg border border-stone-dark bg-stone/40 px-3.5 py-2.5 text-base text-ink transition focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-soft";
  const labelClass = "block text-sm font-medium text-ink-muted";

  return (
    <form action={formAction} className="space-y-3.5" key={state.success ? "reset" : "form"}>
      <div>
        <label className={labelClass} htmlFor="currentPassword">
          {dict.currentPasswordLabel}
        </label>
        <input id="currentPassword" name="currentPassword" type="password" required dir="ltr" className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="newPassword">
          {dict.newPasswordLabel}
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          dir="ltr"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="confirmPassword">
          {dict.confirmPasswordLabel}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          dir="ltr"
          className={inputClass}
        />
      </div>
      {state.error && (
        <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{dict[ERROR_KEY[state.error]]}</p>
      )}
      {state.success && (
        <p className="rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">{dict.success}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {dict.submit}
      </button>
    </form>
  );
}
