import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getCurrentUser, canManageReservations, canSeePartnerShares, isAdmin } from "@/lib/auth";
import { getDictionary, type Dictionary } from "@/lib/i18n/getDictionary";
import { deleteReservation } from "@/lib/actions/reservations";
import { ShareStatusBadge } from "@/components/reservations/ShareStatusBadge";
import type { Locale } from "@/lib/i18n/config";
import type { ReservationRow } from "@/lib/types/database";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = (await params) as { locale: Locale; id: string };
  const dict = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const reservationRows = await query<ReservationRow>(`select * from reservations where id = $1`, [id]);
  const reservation = reservationRows[0];
  if (!reservation) notFound();

  let shares: Array<{
    partner_id: string;
    share_amount: number;
    payout_status: "pending" | "paid";
    partnerName: string;
  }> = [];

  if (canSeePartnerShares(user.role)) {
    const [shareRows, partners] = await Promise.all([
      query<{ partner_id: string; share_amount: number; payout_status: "pending" | "paid" }>(
        `select partner_id, share_amount, payout_status from reservation_shares where reservation_id = $1`,
        [id],
      ),
      query<{ id: string; name: string }>(`select id, name from partners`),
    ]);
    const nameById = new Map(partners.map((p) => [p.id, p.name]));
    shares = shareRows.map((s) => ({
      ...s,
      partnerName: nameById.get(s.partner_id) ?? "",
    }));
  }

  const t = dict.reservations;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.detail}</h1>
        {canManageReservations(user.role) && (
          <Link href={`/${locale}/reservations/${id}/edit`} className="text-sm text-gray-600 underline">
            {dict.common.edit}
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="font-medium">{reservation.guest_name}</h2>
        <p className="text-sm text-gray-500" dir="ltr">
          {reservation.check_in} → {reservation.check_out}
        </p>

        <dl className="mt-3 space-y-1 text-sm">
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
          <p className="mt-3 text-sm text-gray-600">
            {t.expenseNote}: {reservation.expense_note}
          </p>
        )}
        {reservation.notes && (
          <p className="mt-1 text-sm text-gray-600">
            {t.notes}: {reservation.notes}
          </p>
        )}
      </div>

      {canSeePartnerShares(user.role) && shares.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-medium text-gray-500">{t.shareBreakdown}</h3>
          <ul className="space-y-2">
            {shares.map((s) => (
              <li key={s.partner_id} className="flex items-center justify-between text-sm">
                <span>{s.partnerName}</span>
                <span className="flex items-center gap-2">
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
        </div>
      )}

      {isAdmin(user.role) && (
        <form action={deleteReservation.bind(null, id, locale)}>
          <button type="submit" className="text-sm text-red-600 underline">
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
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span className="text-gray-500">{label}</span>
      <span>
        {Number(value).toFixed(2)} {dict.common.sar}
      </span>
    </div>
  );
}
