import { updateShareStatus } from "@/lib/actions/shares";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/getDictionary";
import type { PayoutStatus } from "@/lib/types/database";

export function ShareStatusBadge({
  reservationId,
  partnerId,
  status,
  locale,
  dict,
  canToggle,
}: {
  reservationId: string;
  partnerId: string;
  status: PayoutStatus;
  locale: Locale;
  dict: Dictionary;
  canToggle: boolean;
}) {
  const isPaid = status === "paid";
  const badgeClass = `rounded px-1.5 py-0.5 text-xs ${
    isPaid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
  }`;

  if (!canToggle) {
    return <span className={badgeClass}>{isPaid ? dict.shares.paid : dict.shares.pending}</span>;
  }

  const nextStatus: PayoutStatus = isPaid ? "pending" : "paid";

  return (
    <form action={updateShareStatus.bind(null, reservationId, partnerId, locale, nextStatus)}>
      <button type="submit" className={badgeClass}>
        {isPaid ? dict.shares.paid : dict.shares.pending}
      </button>
    </form>
  );
}
