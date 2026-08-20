import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canManageReservations, canSeePartnerShares, isAdmin } from "@/lib/auth";
import { getDictionary, type Dictionary } from "@/lib/i18n/getDictionary";
import { deleteReservation } from "@/lib/actions/reservations";
import { ShareStatusBadge } from "@/components/reservations/ShareStatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = (await params) as { locale: Locale; id: string };
  const dict = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const supabase = await createClient();
  const { data: reservation } = await supabase.from("reservations").select("*").eq("id", id).single();
  if (!reservation) notFound();

  let shares: Array<{
    partner_id: string;
    share_amount: number;
    payout_status: "pending" | "paid";
    partnerName: string;
  }> = [];

  if (canSeePartnerShares(user.role)) {
    const [{ data: shareRows }, { data: partners }] = await Promise.all([
      supabase
        .from("reservation_shares")
        .select("partner_id, share_amount, payout_status")
        .eq("reservation_id", id),
      supabase.from("partners").select("id, name"),
    ]);
    const nameById = new Map((partners ?? []).map((p) => [p.id, p.name]));
    shares = (shareRows ?? []).map((s) => ({
      ...s,
      partnerName: nameById.get(s.partner_id) ?? "",
    }));
  }

  const t = dict.reservations;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.detail}
        backHref={`/${locale}/reservations`}
        action={
          canManageReservations(user.role) ? (
            <a
              href={`/${locale}/reservations/${id}/edit`}
              className={buttonClass("secondary", "!px-3 !py-1.5 text-xs")}
            >
              {dict.common.edit}
            </a>
          ) : undefined
        }
      />

      <Card>
        <h2 className="font-semibold text-ink">{reservation.guest_name}</h2>
        <p className="text-sm text-ink-faint" dir="ltr">
          {reservation.check_in} → {reservation.check_out}
        </p>

        <dl className="mt-3.5 space-y-1.5 border-t border-stone pt-3.5 text-sm">
          <MoneyRow label={t.grossAmount} value={reservation.gross_amount} dict={dict} />
          <MoneyRow label={t.paidAmount} value={reservation.paid_amount} dict={dict} />
          <MoneyRow
            label={t.outstanding}
            value={reservation.gross_amount - reservation.paid_amount}
            dict={dict}
          />
          <MoneyRow label={t.feeAmount} value={reservation.fee_amount} dict={dict} />
          <MoneyRow label={t.expenseAmount} value={reservation.expense_amount} dict={dict} />
          <MoneyRow label={t.netAmount} value={reservation.net_amount} dict={dict} bold />
        </dl>

        {reservation.expense_note && (
          <p className="mt-3.5 border-t border-stone pt-3.5 text-sm text-ink-muted">
            {t.expenseNote}: {reservation.expense_note}
          </p>
        )}
        {reservation.notes && <p className="mt-1.5 text-sm text-ink-muted">{t.notes}: {reservation.notes}</p>}
      </Card>

      {canSeePartnerShares(user.role) && shares.length > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-medium text-ink-muted">{t.shareBreakdown}</h3>
          <ul className="space-y-2.5">
            {shares.map((s) => (
              <li key={s.partner_id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-ink">{s.partnerName}</span>
                <span className="flex items-center gap-2 tabular-nums">
                  {Number(s.share_amount).toFixed(2)} {dict.common.sar}
                  <ShareStatusBadge
                    reservationId={id}
                    partnerId={s.partner_id}
                    status={s.payout_status}
                    locale={locale}
                    dict={dict}
                    canToggle={isAdmin(user.role)}
                  />
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isAdmin(user.role) && (
        <form action={deleteReservation.bind(null, id, locale)}>
          <button type="submit" className={buttonClass("danger", "text-sm")}>
            {dict.common.delete}
          </button>
        </form>
      )}
    </div>
  );
}

function MoneyRow({
  label,
  value,
  dict,
  bold,
}: {
  label: string;
  value: number;
  dict: Dictionary;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-ink" : "text-ink-muted"}`}>
      <span>{label}</span>
      <span className={`tabular-nums ${bold ? "text-ink" : ""}`}>
        {Number(value).toFixed(2)} {dict.common.sar}
      </span>
    </div>
  );
}
