import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canSeePartnerShares } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import type { Locale } from "@/lib/i18n/config";

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = (await params) as { locale: Locale; id: string };
  const user = await getCurrentUser();
  if (!user || !canSeePartnerShares(user.role)) redirect(`/${locale}/dashboard`);

  const dict = getDictionary(locale);
  const supabase = await createClient();
  const { data: partner } = await supabase.from("partners").select("*").eq("id", id).single();
  if (!partner) notFound();

  const { data: shareRows } = await supabase
    .from("reservation_shares")
    .select("id, reservation_id, share_amount, payout_status")
    .eq("partner_id", id)
    .order("created_at", { ascending: false });

  const reservationIds = (shareRows ?? []).map((s) => s.reservation_id);
  const { data: reservations } =
    reservationIds.length > 0
      ? await supabase
          .from("reservations")
          .select("id, guest_name, check_in, check_out")
          .in("id", reservationIds)
      : { data: [] };

  const reservationById = new Map((reservations ?? []).map((r) => [r.id, r]));
  const rows = (shareRows ?? []).map((s) => ({
    ...s,
    reservation: reservationById.get(s.reservation_id),
  }));

  const pending = rows
    .filter((r) => r.payout_status === "pending")
    .reduce((sum, r) => sum + Number(r.share_amount), 0);
  const paid = rows
    .filter((r) => r.payout_status === "paid")
    .reduce((sum, r) => sum + Number(r.share_amount), 0);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">{partner.name}</h1>
        <p className="text-sm text-gray-500">
          {dict.partners.ownershipPercent}: {Number(partner.ownership_percent).toFixed(4)}%
        </p>
        <p className="text-sm text-gray-500">
          {dict.partners.capitalContributed}: {Number(partner.capital_contributed).toFixed(2)}{" "}
          {dict.common.sar}
        </p>
        <div className="mt-3 flex justify-between text-sm">
          <span>{dict.partners.pending}</span>
          <span className="font-medium">
            {pending.toFixed(2)} {dict.common.sar}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>{dict.partners.paid}</span>
          <span className="font-medium">
            {paid.toFixed(2)} {dict.common.sar}
          </span>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-gray-500">{dict.partners.history}</h2>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 text-sm"
            >
              <div>
                <p className="font-medium">{r.reservation?.guest_name}</p>
                <p className="text-xs text-gray-500" dir="ltr">
                  {r.reservation?.check_in} → {r.reservation?.check_out}
                </p>
              </div>
              <div className="text-end">
                <p>
                  {Number(r.share_amount).toFixed(2)} {dict.common.sar}
                </p>
                <p
                  className={`text-xs ${
                    r.payout_status === "paid" ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {r.payout_status === "paid" ? dict.shares.paid : dict.shares.pending}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
