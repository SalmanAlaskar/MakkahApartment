"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import type { Locale } from "@/lib/i18n/config";
import type { PayoutStatus } from "@/lib/types/database";

// Pure status update, admin-only, never touches lib/finance.ts — payout status never
// recomputes a share amount, it only records whether the (external, bank-transfer) payment
// has happened.
export async function updateShareStatus(
  reservationId: string,
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
    .from("reservation_shares")
    .update({
      payout_status: nextStatus,
      paid_at: nextStatus === "paid" ? new Date().toISOString() : null,
    })
    .eq("reservation_id", reservationId)
    .eq("partner_id", partnerId);

  if (error) throw error;

  revalidatePath(`/${locale}/reservations/${reservationId}`);
  revalidatePath(`/${locale}/partners`);
  revalidatePath(`/${locale}/dashboard`);
}
