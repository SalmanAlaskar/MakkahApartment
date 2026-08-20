import { redirect } from "next/navigation";
import { getCurrentUser, canManageReservations } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { getPartners } from "@/lib/data/partners";
import { createReservation } from "@/lib/actions/reservations";
import { ReservationForm } from "@/components/reservations/ReservationForm";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Locale } from "@/lib/i18n/config";

export default async function NewReservationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const user = await getCurrentUser();
  if (!user || !canManageReservations(user.role)) redirect(`/${locale}/reservations`);

  const dict = getDictionary(locale);
  const partners = await getPartners();

  return (
    <div>
      <PageHeader title={dict.reservations.new} backHref={`/${locale}/reservations`} />
      <ReservationForm dict={dict} partners={partners} action={createReservation.bind(null, locale)} />
    </div>
  );
}
