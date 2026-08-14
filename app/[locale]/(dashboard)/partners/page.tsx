import Link from "next/link";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getCurrentUser, canSeePartnerShares } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import type { Locale } from "@/lib/i18n/config";
import type { PayoutStatus } from "@/lib/types/database";

export default async function PartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const user = await getCurrentUser();
  if (!user || !canSeePartnerShares(user.role)) redirect(`/${locale}/dashboard`);

  const dict = getDictionary(locale);
  type ShareTotalRow = { partner_id: string; share_amount: number; payout_status: PayoutStatus };
  const [partners, shares, billShares] = await Promise.all([
    query<{ id: string; name: string; ownership_percent: number; capital_contributed: number }>(
      `select id, name, ownership_percent, capital_contributed from partners order by display_order`,
    ),
    query<ShareTotalRow>(`select partner_id, share_amount, payout_status from reservation_shares`),
    query<ShareTotalRow>(`select partner_id, share_amount, payout_status from monthly_expense_shares`),
  ]);

  const totals = new Map<string, { total: number; pending: number; paid: number }>();
  for (const s of shares) {
    const entry = totals.get(s.partner_id) ?? { total: 0, pending: 0, paid: 0 };
    const amount = Number(s.share_amount);
    entry.total += amount;
    if (s.payout_status === "paid") entry.paid += amount;
    else entry.pending += amount;
    totals.set(s.partner_id, entry);
  }

  const billTotals = new Map<string, { total: number; pending: number; paid: number }>();
  for (const s of billShares) {
    const entry = billTotals.get(s.partner_id) ?? { total: 0, pending: 0, paid: 0 };
    const amount = Number(s.share_amount);
    entry.total += amount;
    if (s.payout_status === "paid") entry.paid += amount;
    else entry.pending += amount;
    billTotals.set(s.partner_id, entry);
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">{dict.partners.title}</h1>
      <ul className="space-y-3">
        {partners.map((p) => {
          const t = totals.get(p.id) ?? { total: 0, pending: 0, paid: 0 };
          const b = billTotals.get(p.id) ?? { total: 0, pending: 0, paid: 0 };
          const netPending = t.pending - b.pending;
          return (
            <li key={p.id}>
              <Link
                href={`/${locale}/partners/${p.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-sm text-gray-500">
                    {Number(p.ownership_percent).toFixed(2)}%
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-500">{dict.partners.totalEarned}</span>
                  <span className="font-medium">
                    {t.total.toFixed(2)} {dict.common.sar}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>
                    {dict.partners.pending}: {t.pending.toFixed(2)}
                  </span>
                  <span>
                    {dict.partners.paid}: {t.paid.toFixed(2)}
                  </span>
                </div>
                {b.total > 0 && (
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>{dict.partners.billsOwed}</span>
                    <span>
                      -{b.pending.toFixed(2)} {dict.common.sar}
                    </span>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 text-sm font-semibold">
                  <span>{dict.partners.netPending}</span>
                  <span>
                    {netPending.toFixed(2)} {dict.common.sar}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
