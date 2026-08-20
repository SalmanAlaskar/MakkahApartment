import { updateShareStatus } from "@/lib/actions/shares";
import { StatusPill, pillClass } from "@/components/ui/StatusPill";
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

  if (!canToggle) {
    return <StatusPill tone={isPaid ? "ok" : "warn"}>{isPaid ? dict.shares.paid : dict.shares.pending}</StatusPill>;
  }

  const nextStatus: PayoutStatus = isPaid ? "pending" : "paid";

  return (
    <form action={updateShareStatus.bind(null, reservationId, partnerId, locale, nextStatus)}>
      <button
        type="submit"
        className={pillClass(isPaid ? "ok" : "warn", "cursor-pointer transition hover:brightness-95")}
      >
        {isPaid ? dict.shares.paid : dict.shares.pending}
      </button>
    </form>
  );
}
