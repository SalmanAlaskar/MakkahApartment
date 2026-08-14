import Link from "next/link";
import { query } from "@/lib/db";
import { getCurrentUser, canManageReservations } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import type { Locale } from "@/lib/i18n/config";

const STATUS_CLASS: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-200 text-gray-600",
};

export default async function ReservationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const dict = getDictionary(locale);
  const user = await getCurrentUser();
  const reservations = await query<{
    id: string;
    guest_name: string;
    check_in: string;
    check_out: string;
    gross_amount: number;
    net_amount: number;
    status: string;
  }>(
    `select id, guest_name, check_in, check_out, gross_amount, net_amount, status
     from reservations
     order by check_in desc`,
  );

  const canManage = user ? canManageReservations(user.role) : false;
  const t = dict.reservations;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.title}</h1>
        {canManage && (
          <Link
            href={`/${locale}/reservations/new`}
            className="rounded-md bg-sky-600 px-3 py-2 text-sm text-white transition-colors hover:bg-sky-700"
          >
            {t.new}
          </Link>
        )}
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
