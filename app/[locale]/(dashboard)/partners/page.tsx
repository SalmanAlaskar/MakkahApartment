import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canSeePartnerShares } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
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
      <h1 className="mb-4 text-xl font-semibold">{dict.partners.title}</h1>
      <ul className="space-y-3">
        {(partners ?? []).map((p) => {
          const t = totals.get(p.id) ?? { total: 0, pending: 0, paid: 0 };
          return (
            <li key={p.id}>
              <Link
                href={`/${locale}/partners/${p.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-sm text-gray-500">
                    {Number(p.ownership_percent).toFixed(2)}%
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-500">{dict.partners.totalEarned}</span>
                  <span className="font-medium">
                    {t.total.toFixed(2)} {dict.common.sar}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
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
