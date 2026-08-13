"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/getDictionary";

export function LoginForm({ locale, dict }: { locale: Locale; dict: Dictionary["login"] }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-lg font-medium">{dict.checkEmail}</p>
        <p className="mt-2 text-sm text-gray-600">
          {dict.checkEmailBody.replace("{email}", email)}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          {dict.emailLabel}
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={dict.emailPlaceholder}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-gray-500 focus:outline-none"
          dir="ltr"
        />
      </div>
      {status === "error" && <p className="text-sm text-red-600">{dict.error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-base font-medium text-white disabled:opacity-60"
      >
        {dict.sendLink}
      </button>
    </form>
  );
}
