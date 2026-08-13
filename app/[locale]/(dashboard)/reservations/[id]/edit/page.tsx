import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canManageReservations } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getPartners } from "@/lib/data/partners";
import { updateReservation } from "@/lib/actions/reservations";
import { ReservationForm } from "@/components/reservations/ReservationForm";
import type { Locale } from "@/lib/i18n/config";

export default async function EditReservationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = (await params) as { locale: Locale; id: string };
  const user = await getCurrentUser();
  if (!user || !canManageReservations(user.role)) redirect(`/${locale}/reservations/${id}`);

  const dict = getDictionary(locale);
  const partners = await getPartners();
  const supabase = await createClient();
  const { data: reservation } = await supabase.from("reservations").select("*").eq("id", id).single();
  if (!reservation) notFound();

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">{dict.common.edit}</h1>
      <p className="mb-4 text-sm text-amber-700">{dict.reservations.editRecalcWarning}</p>
      <ReservationForm
        dict={dict}
        partners={partners}
        action={updateReservation.bind(null, id, locale)}
        defaultValues={{
          guestName: reservation.guest_name,
          platform: reservation.platform,
          rentalType: reservation.rental_type,
          checkIn: reservation.check_in,
          checkOut: reservation.check_out,
          grossAmount: String(reservation.gross_amount),
          paidAmount: String(reservation.paid_amount),
          paymentMethod: reservation.payment_method ?? "cash",
          feeMethod: reservation.fee_method,
          feeAmount: reservation.fee_method === "flat_amount" ? String(reservation.fee_amount) : "",
          feePercent: reservation.fee_percent !== null ? String(reservation.fee_percent) : "",
          expenseAmount: String(reservation.expense_amount),
          expenseNote: reservation.expense_note ?? "",
          status: reservation.status,
          notes: reservation.notes ?? "",
        }}
      />
    </div>
  );
}
