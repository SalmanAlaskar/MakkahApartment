"use client";

import { markAllSharesPaid } from "@/lib/actions/shares";
import { buttonClass } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";

export function MarkAllPaidButton({
  locale,
  confirmMessage,
  label,
}: {
  locale: Locale;
  confirmMessage: string;
  label: string;
}) {
  return (
    <form
      action={markAllSharesPaid.bind(null, locale)}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <button type="submit" className={buttonClass("secondary", "!px-3 !py-1.5 text-xs")}>
        {label}
      </button>
    </form>
  );
}
