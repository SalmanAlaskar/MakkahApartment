"use client";

import { deleteContractAttachment } from "@/lib/actions/contract";
import type { Locale } from "@/lib/i18n/config";

export function DeleteAttachmentButton({
  locale,
  name,
  label,
  confirmMessage,
}: {
  locale: Locale;
  name: string;
  label: string;
  confirmMessage: string;
}) {
  return (
    <form
      action={deleteContractAttachment.bind(null, locale, name)}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <button type="submit" className="text-xs font-medium text-bad hover:underline">
        {label}
      </button>
    </form>
  );
}
