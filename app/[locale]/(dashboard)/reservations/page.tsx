import Link from "next/link";
import { getCurrentUser, canManageReservations } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import {
  DEFAULT_RESERVATION_SORT,
  getSortedReservations,
  isReservationSort,
  type ReservationSort,
} from "@/lib/data/reservations";
import type { Locale } from "@/lib/i18n/config";

const STATUS_CLASS: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-200 text-gray-600",
};

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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.title}</h1>
        {canManage && (
          <Link
            href={`/${locale}/reservations/new`}
            className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white"
          >
            {t.new}
          </Link>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex gap-1.5 overflow-x-auto">
          {SORT_OPTIONS.map((option) => (
            <Link
              key={option}
              href={`/${locale}/reservations?sort=${option}`}
              className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                sort === option ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {t[`sort_${option}` as keyof typeof t]}
            </Link>
          ))}
        </div>
        <div className="flex shrink-0 gap-2 text-xs">
          <a
            href={`/${locale}/reservations/export?format=xlsx&sort=${sort}`}
            className="rounded-md border border-gray-300 px-2.5 py-1 text-gray-700"
          >
            {t.exportExcel}
          </a>
          <a
            href={`/${locale}/reservations/export?format=pdf&sort=${sort}`}
            className="rounded-md border border-gray-300 px-2.5 py-1 text-gray-700"
          >
            {t.exportPdf}
          </a>
        </div>
      </div>

      {reservations.length === 0 ? (
        <p className="text-sm text-gray-500">{t.noReservations}</p>
      ) : (
        <ul className="space-y-3">
          {reservations.map((r) => (
            <li key={r.id}>
              <Link
                href={`/${locale}/reservations/${r.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.guest_name}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs ${STATUS_CLASS[r.status] ?? ""}`}
                  >
                    {t[`status_${r.status}` as keyof typeof t]}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-500" dir="ltr">
                  {r.check_in} → {r.check_out}
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-500">{t.grossAmount}</span>
                  <span>
                    {Number(r.gross_amount).toFixed(2)} {dict.common.sar}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-500">{t.netAmount}</span>
                  <span>
                    {Number(r.net_amount).toFixed(2)} {dict.common.sar}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
