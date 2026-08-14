"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";
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

  await pool.query(
    `update reservation_shares set
       payout_status = $3,
       paid_at = case when $3 = 'paid' then now() else null end
     where reservation_id = $1 and partner_id = $2`,
    [reservationId, partnerId, nextStatus],
  );

  revalidatePath(`/${locale}/reservations/${reservationId}`);
  revalidatePath(`/${locale}/partners`);
  revalidatePath(`/${locale}/dashboard`);
}
