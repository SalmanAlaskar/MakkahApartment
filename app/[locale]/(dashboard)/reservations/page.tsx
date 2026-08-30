import Link from "next/link";
import { getCurrentUser, canManageReservations } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import {
  DEFAULT_RESERVATION_SORT,
  getSortedReservations,
  isReservationSort,
  type ReservationSort,
} from "@/lib/data/reservations";
import { PageHeader } from "@/components/ui/PageHeader";
import { buttonClass } from "@/components/ui/button";
import { ReservationsList } from "@/components/reservations/ReservationsList";
import type { Locale } from "@/lib/i18n/config";

const SORT_OPTIONS: ReservationSort[] = ["date_desc", "date_asc", "amount_desc", "amount_asc", "guest_asc"];

export default async function ReservationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const { sort: sortParam } = await searchParams;
  const sort = isReservationSort(sortParam) ? sortParam : DEFAULT_RESERVATION_SORT;

  const dict = getDictionary(locale);
  const user = await getCurrentUser();
  const reservations = await getSortedReservations(sort);

  const canManage = user ? canManageReservations(user.role) : false;
  const t = dict.reservations;

  return (
    <div>
      <PageHeader
        title={t.title}
        action={
          canManage ? (
            <Link href={`/${locale}/reservations/new`} className={buttonClass("primary")}>
              {t.new}
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {SORT_OPTIONS.map((option) => (
            <Link
              key={option}
              href={`/${locale}/reservations?sort=${option}`}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                sort === option
                  ? "bg-brand text-white"
                  : "bg-stone-dark/60 text-ink-muted hover:text-ink"
              }`}
            >
              {t[`sort_${option}` as keyof typeof t]}
            </Link>
          ))}
        </div>
        <div className="flex shrink-0 gap-2 text-xs">
          <a
            href={`/${locale}/reservations/export?format=xlsx&sort=${sort}`}
            className="rounded-lg border border-stone-dark px-2.5 py-1.5 font-medium text-ink-muted transition hover:border-brand/40 hover:text-brand"
          >
            {t.exportExcel}
          </a>
          <a
            href={`/${locale}/reservations/export?format=pdf&sort=${sort}`}
            className="rounded-lg border border-stone-dark px-2.5 py-1.5 font-medium text-ink-muted transition hover:border-brand/40 hover:text-brand"
          >
            {t.exportPdf}
          </a>
        </div>
      </div>

      <ReservationsList reservations={reservations} locale={locale} dict={dict} />
    </div>
  );
}
