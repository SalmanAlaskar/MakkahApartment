"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canManageReservations, isAdmin } from "@/lib/auth";
import { computeFee, computeShares } from "@/lib/finance";
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

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_reservation_with_shares", {
      p_guest_name: input.guestName,
      p_platform: input.platform,
      p_rental_type: input.rentalType,
      p_check_in: input.checkIn,
      p_check_out: input.checkOut,
      p_gross_amount: input.grossAmount,
      p_paid_amount: input.paidAmount,
      p_payment_method: input.paymentMethod || null,
      p_fee_method: input.feeMethod,
      p_fee_percent: feePercent,
      p_fee_amount: feeAmount,
      p_expense_amount: input.expenseAmount,
      p_expense_note: input.expenseNote || null,
      p_net_amount: netAmount,
      p_status: input.status,
      p_notes: input.notes || null,
      p_created_by: null,
      p_shares: shares.map((s) => ({
        partner_id: s.partnerId,
        ownership_percent_snapshot: s.ownershipPercentSnapshot,
        share_amount: s.shareAmount,
      })),
    });

    if (error) throw error;
    reservationId = data;
  } catch (err) {
    return { error: describeError(err) };
  }

  revalidatePath(`/${locale}/reservations`);
  redirect(`/${locale}/reservations/${reservationId}`);
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

    const supabase = await createClient();
    const { error } = await supabase.rpc("update_reservation_with_shares", {
      p_reservation_id: reservationId,
      p_guest_name: input.guestName,
      p_platform: input.platform,
      p_rental_type: input.rentalType,
      p_check_in: input.checkIn,
      p_check_out: input.checkOut,
      p_gross_amount: input.grossAmount,
      p_paid_amount: input.paidAmount,
      p_payment_method: input.paymentMethod || null,
      p_fee_method: input.feeMethod,
      p_fee_percent: feePercent,
      p_fee_amount: feeAmount,
      p_expense_amount: input.expenseAmount,
      p_expense_note: input.expenseNote || null,
      p_net_amount: netAmount,
      p_status: input.status,
      p_notes: input.notes || null,
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

  revalidatePath(`/${locale}/reservations`);
  redirect(`/${locale}/reservations/${reservationId}`);
}

export async function deleteReservation(reservationId: string, locale: Locale) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    throw new Error("Not authorized to delete reservations");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reservations").delete().eq("id", reservationId);
  if (error) throw error;

  revalidatePath(`/${locale}/reservations`);
  redirect(`/${locale}/reservations`);
}
