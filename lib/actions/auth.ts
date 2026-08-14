"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import type { Locale } from "@/lib/i18n/config";

export interface LoginActionState {
  error?: string;
  sent?: boolean;
  email?: string;
}

export async function sendMagicLink(
  locale: Locale,
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "required" };

  try {
    await signIn("resend", { email, redirect: false, redirectTo: `/${locale}/dashboard` });
  } catch (err) {
    if (err instanceof AuthError) {
      // Temporarily surfacing the real cause (type + underlying message) instead of a generic
      // string -- this is the only diagnostic path available while wiring up a fresh deployment.
      const cause = (err.cause as { err?: Error } | undefined)?.err;
      return { error: `[${err.type}] ${cause?.message ?? err.message}` };
    }
    throw err;
  }

  return { sent: true, email };
}

export async function logout(locale: Locale) {
  await signOut({ redirectTo: `/${locale}/login` });
}
