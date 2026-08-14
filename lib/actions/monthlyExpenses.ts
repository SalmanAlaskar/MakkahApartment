"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
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

    const supabase = await createClient();
    const { error } = await supabase.rpc("upsert_monthly_expense_with_shares", {
      p_month: monthDate,
      p_internet_bill: input.internetBill,
      p_electricity_bill: input.electricityBill,
      p_other_expense: input.otherExpense,
      p_other_expense_note: input.otherExpenseNote || null,
      p_shares: shares.map((s) => ({
        partner_id: s.partnerId,
        ownership_percent_snapshot: s.ownershipPercentSnapshot,
        share_amount: s.shareAmount,
      })),
    });

    if (error) throw error;
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

  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_expense_shares")
    .update({
      payout_status: nextStatus,
      paid_at: nextStatus === "paid" ? new Date().toISOString() : null,
    })
    .eq("monthly_expense_id", monthlyExpenseId)
    .eq("partner_id", partnerId);

  if (error) throw error;

  revalidatePath(`/${locale}/settings/bills`);
  revalidatePath(`/${locale}/partners`);
  revalidatePath(`/${locale}/dashboard`);
}
