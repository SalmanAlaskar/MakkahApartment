"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { pool, withTransaction } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { computeShares, round2 } from "@/lib/finance";
import { monthlyExpenseFormSchema } from "@/lib/validation/monthlyExpense";
import { getPartners } from "@/lib/data/partners";
import type { Locale } from "@/lib/i18n/config";
import type { PayoutStatus } from "@/lib/types/database";

export interface MonthlyExpenseActionState {
  error?: string;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    throw new Error("Not authorized");
  }
  return user;
}

// Same error-flattening as lib/actions/reservations.ts -- one readable line instead of the raw
// Zod issues blob.
function describeError(err: unknown): string {
  if (err instanceof ZodError) {
    return err.issues.map((issue) => issue.message).join(", ");
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

export async function upsertMonthlyExpense(
  locale: Locale,
  _prevState: MonthlyExpenseActionState,
  formData: FormData,
): Promise<MonthlyExpenseActionState> {
  try {
    await requireAdmin();
    const raw = Object.fromEntries(formData.entries());
    const input = monthlyExpenseFormSchema.parse(raw);
    const partners = await getPartners();

    const totalBills = round2(input.internetBill + input.electricityBill + input.otherExpense);
    const shares = computeShares(
      totalBills,
      partners.map((p) => ({ partnerId: p.id, ownershipPercent: p.ownership_percent })),
    );

    // <input type="month"> gives "YYYY-MM"; monthly_expenses.month is always the 1st of the month.
    const monthDate = input.month.length === 7 ? `${input.month}-01` : input.month;

    await withTransaction(async (client) => {
      const { rows } = await client.query<{ id: string }>(
        `insert into monthly_expenses (month, internet_bill, electricity_bill, other_expense, other_expense_note)
         values ($1,$2,$3,$4,$5)
         on conflict (month) do update set
           internet_bill = excluded.internet_bill,
           electricity_bill = excluded.electricity_bill,
           other_expense = excluded.other_expense,
           other_expense_note = excluded.other_expense_note,
           updated_at = now()
         returning id`,
        [monthDate, input.internetBill, input.electricityBill, input.otherExpense, input.otherExpenseNote || null],
      );
      const expenseId = rows[0].id;

      for (const share of shares) {
        // Same "reset to pending on a changed amount" rule as reservation shares.
        await client.query(
          `insert into monthly_expense_shares (monthly_expense_id, partner_id, ownership_percent_snapshot, share_amount)
           values ($1,$2,$3,$4)
           on conflict (monthly_expense_id, partner_id) do update set
             ownership_percent_snapshot = excluded.ownership_percent_snapshot,
             share_amount = excluded.share_amount,
             payout_status = case
               when monthly_expense_shares.share_amount is distinct from excluded.share_amount then 'pending'
               else monthly_expense_shares.payout_status
             end,
             paid_at = case
               when monthly_expense_shares.share_amount is distinct from excluded.share_amount then null
               else monthly_expense_shares.paid_at
             end`,
          [expenseId, share.partnerId, share.ownershipPercentSnapshot, share.shareAmount],
        );
      }
    });
  } catch (err) {
    return { error: describeError(err) };
  }

  revalidatePath(`/${locale}/settings/bills`);
  revalidatePath(`/${locale}/partners`);
  revalidatePath(`/${locale}/dashboard`);
  redirect(`/${locale}/settings/bills`);
}

// Pure status update, admin-only, mirrors lib/actions/shares.ts#updateShareStatus -- never
// recomputes a share amount, only records whether the bill portion has been settled.
export async function updateMonthlyExpenseShareStatus(
  monthlyExpenseId: string,
  partnerId: string,
  locale: Locale,
  nextStatus: PayoutStatus,
) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    throw new Error("Not authorized to update payout status");
  }

  await pool.query(
    `update monthly_expense_shares set
       payout_status = $3,
       paid_at = case when $3 = 'paid' then now() else null end
     where monthly_expense_id = $1 and partner_id = $2`,
    [monthlyExpenseId, partnerId, nextStatus],
  );

  revalidatePath(`/${locale}/settings/bills`);
  revalidatePath(`/${locale}/partners`);
  revalidatePath(`/${locale}/dashboard`);
}
