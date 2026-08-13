import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canSeePartnerShares } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import type { Locale } from "@/lib/i18n/config";

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
  const supabase = await createClient();

  const { data: reservations } = await supabase
    .from("reservations")
    .select(
      "id, guest_name, check_in, check_out, gross_amount, paid_amount, fee_amount, expense_amount, net_amount, status, created_at",
    )
    .order("created_at", { ascending: false });

  const active = (reservations ?? []).filter((r) => r.status !== "cancelled");

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

  const { data: monthlyExpenses } = await supabase
    .from("monthly_expenses")
    .select("internet_bill, electricity_bill, other_expense");
  const totalMonthlyBills = (monthlyExpenses ?? []).reduce(
    (sum, m) => sum + Number(m.internet_bill) + Number(m.electricity_bill) + Number(m.other_expense),
    0,
  );

  let pendingPayouts = 0;
  let paidPayouts = 0;
  if (canSeePartnerShares(user.role)) {
    const { data: shares } = await supabase.from("reservation_shares").select("share_amount, payout_status");
    for (const s of shares ?? []) {
      const amount = Number(s.share_amount);
      if (s.payout_status === "paid") paidPayouts += amount;
      else pendingPayouts += amount;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = active.filter((r) => r.check_in >= today).slice(0, 5);
  const recent = (reservations ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{d.title}</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label={d.totalReservations} value={String(active.length)} />
        <StatCard label={d.totalNights} value={String(totals.nights)} />
        <StatCard label={d.totalRent} value={`${totals.gross.toFixed(2)} ${dict.common.sar}`} />
        <StatCard label={d.totalCollected} value={`${totals.paid.toFixed(2)} ${dict.common.sar}`} />
        <StatCard label={d.totalOutstanding} value={`${outstanding.toFixed(2)} ${dict.common.sar}`} />
        <StatCard label={d.totalCommission} value={`${totals.fee.toFixed(2)} ${dict.common.sar}`} />
        <StatCard label={d.totalExpenses} value={`${totals.expense.toFixed(2)} ${dict.common.sar}`} />
        <StatCard label={d.totalMonthlyBills} value={`${totalMonthlyBills.toFixed(2)} ${dict.common.sar}`} />
        <StatCard label={d.netProfit} value={`${totals.net.toFixed(2)} ${dict.common.sar}`} highlight />
        {canSeePartnerShares(user.role) && (
          <>
            <StatCard label={d.pendingPayouts} value={`${pendingPayouts.toFixed(2)} ${dict.common.sar}`} />
            <StatCard label={d.paidPayouts} value={`${paidPayouts.toFixed(2)} ${dict.common.sar}`} />
          </>
        )}
      </div>

      <Section title={d.upcomingCheckins} locale={locale} items={upcoming} />
      <Section title={d.recentReservations} locale={locale} items={recent} />
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-lg border border-gray-200 p-3 shadow-sm ${highlight ? "col-span-2 bg-gray-900 text-white" : "bg-white"}`}
    >
      <p className={`text-xs ${highlight ? "text-gray-300" : "text-gray-500"}`}>{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Section({
  title,
  locale,
  items,
}: {
  title: string;
  locale: Locale;
  items: Array<{ id: string; guest_name: string; check_in: string; check_out: string }>;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-gray-500">{title}</h2>
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.id}>
            <Link
              href={`/${locale}/reservations/${r.id}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-sm"
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
