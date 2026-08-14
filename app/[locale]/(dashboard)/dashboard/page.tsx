import Link from "next/link";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getCurrentUser, canSeePartnerShares } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { InboxIcon } from "@/components/layout/icons";
import type { Locale } from "@/lib/i18n/config";
import type { PayoutStatus } from "@/lib/types/database";

function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login`);

  const dict = getDictionary(locale);
  const d = dict.dashboard;

  const reservations = await query<{
    id: string;
    guest_name: string;
    check_in: string;
    check_out: string;
    gross_amount: number;
    paid_amount: number;
    fee_amount: number;
    expense_amount: number;
    net_amount: number;
    status: string;
    created_at: string;
  }>(
    `select id, guest_name, check_in, check_out, gross_amount, paid_amount, fee_amount, expense_amount, net_amount, status, created_at
     from reservations
     order by created_at desc`,
  );

  const active = reservations.filter((r) => r.status !== "cancelled");

  const totals = active.reduce(
    (acc, r) => {
      acc.nights += nightsBetween(r.check_in, r.check_out);
      acc.gross += Number(r.gross_amount);
      acc.paid += Number(r.paid_amount);
      acc.fee += Number(r.fee_amount);
      acc.expense += Number(r.expense_amount);
      acc.net += Number(r.net_amount);
      return acc;
    },
    { nights: 0, gross: 0, paid: 0, fee: 0, expense: 0, net: 0 },
  );
  const outstanding = totals.gross - totals.paid;

  const monthlyExpenses = await query<{
    internet_bill: number;
    electricity_bill: number;
    other_expense: number;
  }>(`select internet_bill, electricity_bill, other_expense from monthly_expenses`);
  const totalMonthlyBills = monthlyExpenses.reduce(
    (sum, m) => sum + Number(m.internet_bill) + Number(m.electricity_bill) + Number(m.other_expense),
    0,
  );

  let pendingPayouts = 0;
  let paidPayouts = 0;
  if (canSeePartnerShares(user.role)) {
    const [shares, billShares] = await Promise.all([
      query<{ share_amount: number; payout_status: PayoutStatus }>(
        `select share_amount, payout_status from reservation_shares`,
      ),
      query<{ share_amount: number; payout_status: PayoutStatus }>(
        `select share_amount, payout_status from monthly_expense_shares`,
      ),
    ]);
    for (const s of shares) {
      const amount = Number(s.share_amount);
      if (s.payout_status === "paid") paidPayouts += amount;
      else pendingPayouts += amount;
    }
    // Net each partner's unsettled share of the monthly bills against what's still owed to them --
    // a bill already marked paid was settled outside this pool, so it doesn't touch the total.
    for (const s of billShares) {
      if (s.payout_status === "pending") pendingPayouts -= Number(s.share_amount);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = active.filter((r) => r.check_in >= today).slice(0, 5);
  const recent = reservations.slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{d.title}</h1>

      <div className="rounded-2xl bg-gradient-to-br from-sky-600 to-sky-500 p-5 text-white shadow-md">
        <p className="text-sm text-sky-100">{d.netProfit}</p>
        <p className="mt-1 text-3xl font-bold">
          {totals.net.toFixed(2)} <span className="text-base font-medium text-sky-100">{dict.common.sar}</span>
        </p>
        <div className="mt-4 flex gap-6 border-t border-sky-400/40 pt-3 text-sm text-sky-100">
          <span>
            {d.totalReservations}: <strong className="text-white">{active.length}</strong>
          </span>
          <span>
            {d.totalNights}: <strong className="text-white">{totals.nights}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {canSeePartnerShares(user.role) && (
          <>
            <StatCard label={d.pendingPayouts} value={`${pendingPayouts.toFixed(2)} ${dict.common.sar}`} tone="amber" />
            <StatCard label={d.paidPayouts} value={`${paidPayouts.toFixed(2)} ${dict.common.sar}`} tone="green" />
          </>
        )}
        <StatCard label={d.totalRent} value={`${totals.gross.toFixed(2)} ${dict.common.sar}`} tone="sky" />
        <StatCard label={d.totalCollected} value={`${totals.paid.toFixed(2)} ${dict.common.sar}`} tone="green" />
        <StatCard label={d.totalOutstanding} value={`${outstanding.toFixed(2)} ${dict.common.sar}`} tone="amber" />
        <StatCard label={d.totalCommission} value={`${totals.fee.toFixed(2)} ${dict.common.sar}`} tone="rose" />
        <StatCard label={d.totalExpenses} value={`${totals.expense.toFixed(2)} ${dict.common.sar}`} tone="rose" />
        <StatCard label={d.totalMonthlyBills} value={`${totalMonthlyBills.toFixed(2)} ${dict.common.sar}`} tone="rose" />
      </div>

      <Section title={d.upcomingCheckins} locale={locale} items={upcoming} />
      <Section title={d.recentReservations} locale={locale} items={recent} emptyMessage={d.noData} />
    </div>
  );
}

const TONE_BORDER = {
  sky: "border-s-sky-400",
  green: "border-s-emerald-400",
  amber: "border-s-amber-400",
  rose: "border-s-rose-400",
} as const;

function StatCard({ label, value, tone }: { label: string; value: string; tone: keyof typeof TONE_BORDER }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-3 shadow-sm border-s-4 ${TONE_BORDER[tone]}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function Section({
  title,
  locale,
  items,
  emptyMessage,
}: {
  title: string;
  locale: Locale;
  items: Array<{ id: string; guest_name: string; check_in: string; check_out: string }>;
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    if (!emptyMessage) return null;
    return (
      <div>
        <h2 className="mb-2 text-sm font-medium text-gray-500">{title}</h2>
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white/60 py-8 text-sm text-gray-400">
          <InboxIcon className="h-8 w-8" />
          {emptyMessage}
        </div>
      </div>
    );
  }
  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-gray-500">{title}</h2>
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.id}>
            <Link
              href={`/${locale}/reservations/${r.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 text-sm shadow-sm transition-shadow hover:shadow-md"
            >
              <span>{r.guest_name}</span>
              <span className="text-gray-500" dir="ltr">
                {r.check_in} → {r.check_out}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
