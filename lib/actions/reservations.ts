"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import type { PoolClient } from "pg";
import { pool, withTransaction } from "@/lib/db";
import { getCurrentUser, canManageReservations, isAdmin } from "@/lib/auth";
import { computeFee, computeShares, type ShareResult } from "@/lib/finance";
import { reservationFormSchema } from "@/lib/validation/reservation";
import { getPartners } from "@/lib/data/partners";
import type { Locale } from "@/lib/i18n/config";

export interface ReservationActionState {
  error?: string;
}

function parseForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return reservationFormSchema.parse(raw);
}

async function requireManagerOrAdmin() {
  const user = await getCurrentUser();
  if (!user || !canManageReservations(user.role)) {
    throw new Error("Not authorized to manage reservations");
  }
  return user;
}

// Zod's raw error.message is a JSON blob of issues -- turn it into one readable line
// instead of showing that to a non-technical user.
function describeError(err: unknown): string {
  if (err instanceof ZodError) {
    return err.issues.map((issue) => issue.message).join(", ");
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

export async function createReservation(
  locale: Locale,
  _prevState: ReservationActionState,
  formData: FormData,
): Promise<ReservationActionState> {
  let reservationId: string;
  try {
    const user = await requireManagerOrAdmin();
    const input = parseForm(formData);
    const partners = await getPartners();

    const { feeAmount, feePercent, netAmount } = computeFee({
      grossAmount: input.grossAmount,
      feeMethod: input.feeMethod,
      feeAmount: input.feeAmount,
      feePercent: input.feePercent,
      expenseAmount: input.expenseAmount,
    });

    const shares = computeShares(
      netAmount,
      partners.map((p) => ({ partnerId: p.id, ownershipPercent: p.ownership_percent })),
    );

    reservationId = await withTransaction(async (client) => {
      const { rows } = await client.query<{ id: string }>(
        `insert into reservations (
           guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount,
           payment_method, fee_method, fee_percent, fee_amount, expense_amount, expense_note,
           net_amount, status, notes, created_by
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         returning id`,
        [
          input.guestName,
          input.platform,
          input.rentalType,
          input.checkIn,
          input.checkOut,
          input.grossAmount,
          input.paidAmount,
          input.paymentMethod || null,
          input.feeMethod,
          feePercent,
          feeAmount,
          input.expenseAmount,
          input.expenseNote || null,
          netAmount,
          input.status,
          input.notes || null,
          user.id,
        ],
      );
      const newId = rows[0].id;
      await upsertShares(client, newId, shares);
      return newId;
    });
  } catch (err) {
    return { error: describeError(err) };
  }

  revalidatePath(`/${locale}/reservations`);
  redirect(`/${locale}/reservations/${reservationId}`);
}

// If the recomputed share amount differs from what's already stored, that partner's payout is
// forced back to 'pending' rather than silently keeping a stale 'paid' flag on a changed amount.
async function upsertShares(client: PoolClient, reservationId: string, shares: ShareResult[]) {
  for (const share of shares) {
    await client.query(
      `insert into reservation_shares (reservation_id, partner_id, ownership_percent_snapshot, share_amount)
       values ($1,$2,$3,$4)
       on conflict (reservation_id, partner_id) do update set
         ownership_percent_snapshot = excluded.ownership_percent_snapshot,
         share_amount = excluded.share_amount,
         payout_status = case
           when reservation_shares.share_amount is distinct from excluded.share_amount then 'pending'
           else reservation_shares.payout_status
         end,
         paid_at = case
           when reservation_shares.share_amount is distinct from excluded.share_amount then null
           else reservation_shares.paid_at
         end`,
      [reservationId, share.partnerId, share.ownershipPercentSnapshot, share.shareAmount],
    );
  }
}

export async function updateReservation(
  reservationId: string,
  locale: Locale,
  _prevState: ReservationActionState,
  formData: FormData,
): Promise<ReservationActionState> {
  try {
    await requireManagerOrAdmin();
    const input = parseForm(formData);
    const partners = await getPartners();

    const { feeAmount, feePercent, netAmount } = computeFee({
      grossAmount: input.grossAmount,
      feeMethod: input.feeMethod,
      feeAmount: input.feeAmount,
      feePercent: input.feePercent,
      expenseAmount: input.expenseAmount,
    });

    const shares = computeShares(
      netAmount,
      partners.map((p) => ({ partnerId: p.id, ownershipPercent: p.ownership_percent })),
    );

    await withTransaction(async (client) => {
      await client.query(
        `update reservations set
           guest_name = $2, platform = $3, rental_type = $4, check_in = $5, check_out = $6,
           gross_amount = $7, paid_amount = $8, payment_method = $9, fee_method = $10,
           fee_percent = $11, fee_amount = $12, expense_amount = $13, expense_note = $14,
           net_amount = $15, status = $16, notes = $17, updated_at = now()
         where id = $1`,
        [
          reservationId,
          input.guestName,
          input.platform,
          input.rentalType,
          input.checkIn,
          input.checkOut,
          input.grossAmount,
          input.paidAmount,
          input.paymentMethod || null,
          input.feeMethod,
          feePercent,
          feeAmount,
          input.expenseAmount,
          input.expenseNote || null,
          netAmount,
          input.status,
          input.notes || null,
        ],
      );

      await upsertShares(client, reservationId, shares);
    });
  } catch (err) {
    return { error: describeError(err) };
  }

  revalidatePath(`/${locale}/reservations`);
  redirect(`/${locale}/reservations/${reservationId}`);
}

export async function deleteReservation(reservationId: string, locale: Locale) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    throw new Error("Not authorized to delete reservations");
  }

  await pool.query(`delete from reservations where id = $1`, [reservationId]);

  revalidatePath(`/${locale}/reservations`);
  redirect(`/${locale}/reservations`);
}
