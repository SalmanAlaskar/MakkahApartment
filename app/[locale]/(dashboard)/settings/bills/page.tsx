import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getPartners } from "@/lib/data/partners";
import { upsertMonthlyExpense } from "@/lib/actions/monthlyExpenses";
import { MonthlyExpenseForm } from "@/components/billing/MonthlyExpenseForm";
import { BillShareStatusBadge } from "@/components/billing/BillShareStatusBadge";
import type { Locale } from "@/lib/i18n/config";
import type { MonthlyExpenseRow, MonthlyExpenseShareRow } from "@/lib/types/database";

export default async function MonthlyBillsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const { month: editMonth } = await searchParams;
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) redirect(`/${locale}/dashboard`);

  const dict = getDictionary(locale);
  const partners = await getPartners();

  const expenses = await query<MonthlyExpenseRow>(
    `select * from monthly_expenses order by month desc`,
  );

  type ShareRow = Pick<
    MonthlyExpenseShareRow,
    "id" | "monthly_expense_id" | "partner_id" | "share_amount" | "payout_status"
  >;
  const expenseIds = expenses.map((e) => e.id);
  const shareRows =
    expenseIds.length > 0
      ? await query<ShareRow>(
          `select id, monthly_expense_id, partner_id, share_amount, payout_status
           from monthly_expense_shares
           where monthly_expense_id = any($1)`,
          [expenseIds],
        )
      : [];

  const partnerById = new Map(partners.map((p) => [p.id, p]));
  const sharesByExpense = new Map<string, ShareRow[]>();
  for (const s of shareRows) {
    const list = sharesByExpense.get(s.monthly_expense_id) ?? [];
    list.push(s);
    sharesByExpense.set(s.monthly_expense_id, list);
  }

  const editing = editMonth ? expenses.find((e) => e.month.slice(0, 7) === editMonth) : undefined;
  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{dict.bills.title}</h1>

      <MonthlyExpenseForm
        dict={dict}
        partners={partners}
        action={upsertMonthlyExpense.bind(null, locale)}
        defaultValues={
          editing
            ? {
                month: editing.month.slice(0, 7),
                internetBill: String(editing.internet_bill),
                electricityBill: String(editing.electricity_bill),
                otherExpense: String(editing.other_expense),
                otherExpenseNote: editing.other_expense_note ?? "",
              }
            : { month: currentMonth }
        }
      />

      <div>
        <h2 className="mb-2 text-sm font-medium text-gray-500">{dict.bills.history}</h2>
        <ul className="space-y-3">
          {expenses.map((e) => {
            const total = Number(e.internet_bill) + Number(e.electricity_bill) + Number(e.other_expense);
            const shares = sharesByExpense.get(e.id) ?? [];
            return (
              <li key={e.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium" dir="ltr">
                    {e.month.slice(0, 7)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {total.toFixed(2)} {dict.common.sar}
                    </span>
                    <a href={`?month=${e.month.slice(0, 7)}`} className="text-xs text-gray-600 underline">
                      {dict.common.edit}
                    </a>
                  </div>
                </div>
                <ul className="mt-2 space-y-1">
                  {shares.map((s) => (
                    <li key={s.id} className="flex items-center justify-between text-sm">
                      <span>{partnerById.get(s.partner_id)?.name}</span>
                      <span className="flex items-center gap-2">
                        {Number(s.share_amount).toFixed(2)} {dict.common.sar}
                        <BillShareStatusBadge
                          monthlyExpenseId={e.id}
                          partnerId={s.partner_id}
                          status={s.payout_status}
                          locale={locale}
                          dict={dict}
                          canToggle
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
