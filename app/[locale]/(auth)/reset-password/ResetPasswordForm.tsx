"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordWithRecoveryCode, type ResetPasswordActionState } from "@/lib/actions/auth";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/getDictionary";

const ERROR_KEY: Record<NonNullable<ResetPasswordActionState["error"]>, "errorCode" | "errorShort" | "errorMismatch"> = {
  code: "errorCode",
  short: "errorShort",
  mismatch: "errorMismatch",
};

export function ResetPasswordForm({ locale, dict }: { locale: Locale; dict: Dictionary["resetPassword"] }) {
  const [state, formAction, isPending] = useActionState<ResetPasswordActionState, FormData>(
    resetPasswordWithRecoveryCode.bind(null, locale),
    {},
  );

  const inputClass =
    "mt-1.5 block w-full rounded-lg border border-stone-dark bg-stone/40 px-3.5 py-2.5 text-base text-ink transition focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-soft";

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-stone-dark bg-surface p-6 shadow-sm"
    >
      <div>
        <label htmlFor="recoveryCode" className="block text-sm font-medium text-ink">
          {dict.recoveryCodeLabel}
        </label>
        <input
          id="recoveryCode"
          name="recoveryCode"
          type="text"
          required
          autoFocus
          autoCapitalize="characters"
          className={inputClass}
          dir="ltr"
        />
      </div>
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-ink">
          {dict.newPasswordLabel}
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          className={inputClass}
          dir="ltr"
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink">
          {dict.confirmPasswordLabel}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className={inputClass}
          dir="ltr"
        />
      </div>
      {state.error && (
        <p className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{dict[ERROR_KEY[state.error]]}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-base font-medium text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {dict.submit}
      </button>
      <Link
        href={`/${locale}/login`}
        className="block text-center text-sm font-medium text-ink-muted transition hover:text-brand"
      >
        {dict.backToLogin}
      </Link>
    </form>
  );
}
