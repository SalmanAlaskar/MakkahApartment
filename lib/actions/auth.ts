"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";
import type { Locale } from "@/lib/i18n/config";

export interface LoginActionState {
  error?: boolean;
}

export async function login(
  locale: Locale,
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.APP_PASSWORD;

  if (!expected || password !== expected) {
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
