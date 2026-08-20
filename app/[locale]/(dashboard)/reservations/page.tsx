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
import { StatusPill, type PillTone } from "@/components/ui/StatusPill";
import { buttonClass } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";

const STATUS_TONE: Record<string, PillTone> = {
  confirmed: "brand",
  completed: "ok",
  cancelled: "neutral",
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

      {reservations.length === 0 ? (
        <p className="text-sm text-ink-faint">{t.noReservations}</p>
      ) : (
        <ul className="space-y-3">
          {reservations.map((r) => (
            <li key={r.id}>
              <Link
                href={`/${locale}/reservations/${r.id}`}
                className="block rounded-xl border border-stone-dark bg-surface p-4 shadow-sm transition hover:border-brand/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-ink">{r.guest_name}</span>
                  <StatusPill tone={STATUS_TONE[r.status] ?? "neutral"}>
                    {t[`status_${r.status}` as keyof typeof t]}
                  </StatusPill>
                </div>
                <div className="mt-1 text-sm text-ink-faint" dir="ltr">
                  {r.check_in} → {r.check_out}
                </div>
                <div className="mt-2.5 flex justify-between border-t border-stone pt-2.5 text-sm">
                  <span className="text-ink-muted">{t.grossAmount}</span>
                  <span className="tabular-nums text-ink">
                    {Number(r.gross_amount).toFixed(2)} {dict.common.sar}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-ink-muted">{t.netAmount}</span>
                  <span className="tabular-nums text-ink">
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
