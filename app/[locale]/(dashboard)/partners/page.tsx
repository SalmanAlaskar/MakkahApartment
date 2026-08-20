import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canSeePartnerShares } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Locale } from "@/lib/i18n/config";

export default async function PartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const user = await getCurrentUser();
  if (!user || !canSeePartnerShares(user.role)) redirect(`/${locale}/dashboard`);

  const dict = getDictionary(locale);
  const supabase = await createClient();
  const [{ data: partners }, { data: shares }] = await Promise.all([
    supabase
      .from("partners")
      .select("id, name, ownership_percent, capital_contributed")
      .order("display_order"),
    supabase.from("reservation_shares").select("partner_id, share_amount, payout_status"),
  ]);

  const totals = new Map<string, { total: number; pending: number; paid: number }>();
  for (const s of shares ?? []) {
    const entry = totals.get(s.partner_id) ?? { total: 0, pending: 0, paid: 0 };
    const amount = Number(s.share_amount);
    entry.total += amount;
    if (s.payout_status === "paid") entry.paid += amount;
    else entry.pending += amount;
    totals.set(s.partner_id, entry);
  }

  return (
    <div>
      <PageHeader title={dict.partners.title} />
      <ul className="space-y-3">
        {(partners ?? []).map((p) => {
          const t = totals.get(p.id) ?? { total: 0, pending: 0, paid: 0 };
          const paidPercent = t.total > 0 ? Math.max(0, Math.min(100, (t.paid / t.total) * 100)) : 0;
          return (
            <li key={p.id}>
              <Link
                href={`/${locale}/partners/${p.id}`}
                className="block rounded-xl border border-stone-dark bg-surface p-4 shadow-sm transition hover:border-brand/30"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-ink">{p.name}</span>
                  <span className="text-sm font-medium text-brand">
                    {Number(p.ownership_percent).toFixed(2)}%
                  </span>
                </div>
                <div className="mt-2.5 flex justify-between text-sm">
                  <span className="text-ink-muted">{dict.partners.totalEarned}</span>
                  <span className="font-semibold tabular-nums text-ink">
                    {t.total.toFixed(2)} {dict.common.sar}
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-warn-soft">
                  <div className="h-full rounded-full bg-ok" style={{ width: `${paidPercent}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between text-xs text-ink-faint">
                  <span>
                    {dict.partners.pending}: {t.pending.toFixed(2)}
                  </span>
                  <span>
                    {dict.partners.paid}: {t.paid.toFixed(2)}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
