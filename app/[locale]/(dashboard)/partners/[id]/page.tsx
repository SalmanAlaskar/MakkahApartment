import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canSeePartnerShares } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
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
      <PageHeader
        title={partner.name}
        backHref={`/${locale}/partners`}
        action={
          <a
            href={`/${locale}/partners/${id}/export`}
            className="text-sm font-medium text-brand hover:text-brand-dark"
          >
            {dict.partners.exportCsv}
          </a>
        }
      />

      <Card>
        <p className="text-sm text-ink-muted">
          {dict.partners.ownershipPercent}:{" "}
          <span className="font-medium text-ink">{Number(partner.ownership_percent).toFixed(4)}%</span>
        </p>
        <p className="text-sm text-ink-muted">
          {dict.partners.capitalContributed}:{" "}
          <span className="font-medium text-ink tabular-nums">
            {Number(partner.capital_contributed).toFixed(2)} {dict.common.sar}
          </span>
        </p>
        <div className="mt-3.5 flex justify-between border-t border-stone pt-3.5 text-sm">
          <span className="text-ink-muted">{dict.partners.pending}</span>
          <span className="font-semibold tabular-nums text-warn">
            {pending.toFixed(2)} {dict.common.sar}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-muted">{dict.partners.paid}</span>
          <span className="font-semibold tabular-nums text-ok">
            {paid.toFixed(2)} {dict.common.sar}
          </span>
        </div>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-medium text-ink-muted">{dict.partners.history}</h2>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-stone-dark bg-surface p-3.5 text-sm shadow-sm"
            >
              <div>
                <p className="font-medium text-ink">{r.reservation?.guest_name}</p>
                <p className="text-xs text-ink-faint" dir="ltr">
                  {r.reservation?.check_in} → {r.reservation?.check_out}
                </p>
              </div>
              <div className="text-end">
                <p className="tabular-nums text-ink">
                  {Number(r.share_amount).toFixed(2)} {dict.common.sar}
                </p>
                <StatusPill tone={r.payout_status === "paid" ? "ok" : "warn"} className="mt-1">
                  {r.payout_status === "paid" ? dict.shares.paid : dict.shares.pending}
                </StatusPill>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
