"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";
import { hashSecret, verifySecret } from "@/lib/credentials";
import { getAppCredentials, setAppPasswordHash } from "@/lib/data/app-credentials";
import { getCurrentUser } from "@/lib/auth";
import type { Locale } from "@/lib/i18n/config";

const MIN_PASSWORD_LENGTH = 8;

export interface LoginActionState {
  error?: boolean;
}

export async function login(
  locale: Locale,
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const password = String(formData.get("password") ?? "");
  const credentials = await getAppCredentials();

  if (!credentials || !verifySecret(password, credentials.password_hash)) {
    return { error: true };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect(`/${locale}/dashboard`);
}

export async function logout(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect(`/${locale}/login`);
}

export interface ChangePasswordActionState {
  error?: "current" | "short" | "mismatch";
  success?: boolean;
}

// Admin-only, requires knowing the current password — for a deliberate password change.
export async function changePassword(
  _locale: Locale,
  _prevState: ChangePasswordActionState,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const credentials = await getAppCredentials();
  if (!credentials || !verifySecret(currentPassword, credentials.password_hash)) {
    return { error: "current" };
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { error: "short" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "mismatch" };
  }

  await setAppPasswordHash(hashSecret(newPassword));
  return { success: true };
}

export interface ResetPasswordActionState {
  error?: "code" | "short" | "mismatch";
}

// Public (no session required) — recovers access using the recovery code instead of the
// current password, for when the password itself has been forgotten.
export async function resetPasswordWithRecoveryCode(
  locale: Locale,
  _prevState: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const recoveryCode = String(formData.get("recoveryCode") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const credentials = await getAppCredentials();
  if (!credentials || !verifySecret(recoveryCode, credentials.recovery_code_hash)) {
    return { error: "code" };
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { error: "short" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "mismatch" };
  }

  await setAppPasswordHash(hashSecret(newPassword));
  redirect(`/${locale}/login`);
}
