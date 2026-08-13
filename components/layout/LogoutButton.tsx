"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/config";

export function LogoutButton({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <button type="button" onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900">
      {label}
    </button>
  );
}
