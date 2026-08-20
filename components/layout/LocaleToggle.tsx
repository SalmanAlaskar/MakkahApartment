"use client";

import { useRouter, usePathname } from "next/navigation";
import { otherLocale, type Locale } from "@/lib/i18n/config";

export function LocaleToggle({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function toggle() {
    const target = otherLocale(locale);
    document.cookie = `NEXT_LOCALE=${target}; path=/; max-age=31536000`;
    const segments = pathname.split("/").filter(Boolean);
    segments[0] = target;
    router.push("/" + segments.join("/"));
  }

  return (
    <button type="button" onClick={toggle} className="text-sm font-medium text-ink-muted transition hover:text-brand">
      {label}
    </button>
  );
}
