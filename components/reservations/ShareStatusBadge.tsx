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
  const badgeClass = `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
    isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
  }`;

  const dot = <span className={`h-1.5 w-1.5 rounded-full ${isPaid ? "bg-emerald-500" : "bg-amber-500"}`} />;

  if (!canToggle) {
    return (
      <span className={badgeClass}>
        {dot}
        {isPaid ? dict.shares.paid : dict.shares.pending}
      </span>
    );
  }

  const nextStatus: PayoutStatus = isPaid ? "pending" : "paid";

  return (
    <form action={updateShareStatus.bind(null, reservationId, partnerId, locale, nextStatus)}>
      <button type="submit" className={badgeClass}>
        {dot}
        {isPaid ? dict.shares.paid : dict.shares.pending}
      </button>
    </form>
  );
}
