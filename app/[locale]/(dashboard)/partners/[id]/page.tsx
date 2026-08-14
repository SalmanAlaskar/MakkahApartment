import { notFound, redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getCurrentUser, canSeePartnerShares } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import type { Locale } from "@/lib/i18n/config";
import type { PartnerRow, PayoutStatus } from "@/lib/types/database";

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = (await params) as { locale: Locale; id: string };
  const user = await getCurrentUser();
  if (!user || !canSeePartnerShares(user.role)) redirect(`/${locale}/dashboard`);

  const dict = getDictionary(locale);
  const partnerRows = await query<PartnerRow>(`select * from partners where id = $1`, [id]);
  const partner = partnerRows[0];
  if (!partner) notFound();

  type ReservationShareRow = { id: string; reservation_id: string; share_amount: number; payout_status: PayoutStatus };
  type BillShareRow = { id: string; monthly_expense_id: string; share_amount: number; payout_status: PayoutStatus };

  const [shareRows, billShareRows] = await Promise.all([
    query<ReservationShareRow>(
      `select id, reservation_id, share_amount, payout_status
       from reservation_shares where partner_id = $1
       order by created_at desc`,
      [id],
    ),
    query<BillShareRow>(
      `select id, monthly_expense_id, share_amount, payout_status
       from monthly_expense_shares where partner_id = $1
       order by created_at desc`,
      [id],
    ),
  ]);

  const reservationIds = shareRows.map((s) => s.reservation_id);
  const reservations =
    reservationIds.length > 0
      ? await query<{ id: string; guest_name: string; check_in: string; check_out: string }>(
          `select id, guest_name, check_in, check_out from reservations where id = any($1)`,
          [reservationIds],
        )
      : [];

  const reservationById = new Map(reservations.map((r) => [r.id, r]));
  const rows = shareRows.map((s) => ({
    ...s,
    reservation: reservationById.get(s.reservation_id),
  }));

  const expenseIds = billShareRows.map((s) => s.monthly_expense_id);
  const expenses =
    expenseIds.length > 0
      ? await query<{ id: string; month: string }>(
          `select id, month from monthly_expenses where id = any($1)`,
          [expenseIds],
        )
      : [];

  const expenseById = new Map(expenses.map((e) => [e.id, e]));
  const billRows = billShareRows.map((s) => ({
    ...s,
    expense: expenseById.get(s.monthly_expense_id),
  }));

  const pending = rows
    .filter((r) => r.payout_status === "pending")
    .reduce((sum, r) => sum + Number(r.share_amount), 0);
  const paid = rows
    .filter((r) => r.payout_status === "paid")
    .reduce((sum, r) => sum + Number(r.share_amount), 0);
  const billPending = billRows
    .filter((r) => r.payout_status === "pending")
    .reduce((sum, r) => sum + Number(r.share_amount), 0);
  const netPending = pending - billPending;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">{partner.name}</h1>
        <p className="text-sm text-gray-500">
          {dict.partners.ownershipPercent}: {Number(partner.ownership_percent).toFixed(4)}%
        </p>
        <p className="text-sm text-gray-500">
          {dict.partners.capitalContributed}: {Number(partner.capital_contributed).toFixed(2)}{" "}
          {dict.common.sar}
        </p>
        <div className="mt-3 flex justify-between text-sm">
          <span>{dict.partners.pending}</span>
          <span className="font-medium">
            {pending.toFixed(2)} {dict.common.sar}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>{dict.partners.paid}</span>
          <span className="font-medium">
            {paid.toFixed(2)} {dict.common.sar}
          </span>
        </div>
        {billRows.length > 0 && (
          <div className="flex justify-between text-sm">
            <span>{dict.partners.billsOwed}</span>
            <span className="font-medium">
              -{billPending.toFixed(2)} {dict.common.sar}
            </span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-sm font-semibold">
          <span>{dict.partners.netPending}</span>
          <span>
            {netPending.toFixed(2)} {dict.common.sar}
          </span>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-gray-500">{dict.partners.history}</h2>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 text-sm"
            >
              <div>
                <p className="font-medium">{r.reservation?.guest_name}</p>
                <p className="text-xs text-gray-500" dir="ltr">
                  {r.reservation?.check_in} → {r.reservation?.check_out}
                </p>
              </div>
              <div className="text-end">
                <p>
                  {Number(r.share_amount).toFixed(2)} {dict.common.sar}
                </p>
                <p
                  className={`text-xs ${
                    r.payout_status === "paid" ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {r.payout_status === "paid" ? dict.shares.paid : dict.shares.pending}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {billRows.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-gray-500">{dict.partners.billHistory}</h2>
          <ul className="space-y-2">
            {billRows.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 text-sm"
              >
                <p className="font-medium" dir="ltr">
                  {r.expense?.month.slice(0, 7)}
                </p>
                <div className="text-end">
                  <p>
                    -{Number(r.share_amount).toFixed(2)} {dict.common.sar}
                  </p>
                  <p
                    className={`text-xs ${
                      r.payout_status === "paid" ? "text-green-600" : "text-yellow-600"
                    }`}
                  >
                    {r.payout_status === "paid" ? dict.shares.paid : dict.shares.pending}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
