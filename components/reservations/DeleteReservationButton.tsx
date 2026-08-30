"use client";

import { deleteReservation } from "@/lib/actions/reservations";
import { buttonClass } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";

export function DeleteReservationButton({
  id,
  locale,
  confirmMessage,
  label,
}: {
  id: string;
  locale: Locale;
  confirmMessage: string;
  label: string;
}) {
  return (
    <form
      action={deleteReservation.bind(null, id, locale)}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <button type="submit" className={buttonClass("danger", "text-sm")}>
        {label}
      </button>
    </form>
  );
}
