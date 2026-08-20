import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { updatePartner } from "@/lib/actions/settings";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) redirect(`/${locale}/dashboard`);

  const dict = getDictionary(locale);
  const supabase = await createClient();
  const [{ data: property }, { data: partners }] = await Promise.all([
    supabase.from("property_settings").select("*").limit(1).single(),
    supabase.from("partners").select("*").order("display_order"),
  ]);

  const inputClass =
    "mt-1.5 block w-full rounded-lg border border-stone-dark bg-stone/40 px-3.5 py-2.5 text-base text-ink transition focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-soft";

  return (
    <div className="space-y-6">
      <PageHeader title={dict.settings.title} />

      {property && (
        <Card>
          <h2 className="mb-2.5 text-sm font-medium text-ink-muted">{dict.settings.propertyInfo}</h2>
          <Row label={dict.settings.propertyName} value={property.property_name} />
          <Row label={dict.settings.unitNumber} value={property.unit_number ?? "-"} />
          <Row
            label={dict.settings.propertyPrice}
            value={`${Number(property.property_price).toFixed(2)} ${dict.common.sar}`}
          />
          <Row
            label={dict.settings.transactionFee}
            value={`${Number(property.transaction_fee).toFixed(2)} ${dict.common.sar}`}
          />
          <Row
            label={dict.settings.totalAcquisitionCost}
            value={`${Number(property.total_acquisition_cost).toFixed(2)} ${dict.common.sar}`}
            bold
          />
        </Card>
      )}

      <div>
        <h2 className="mb-2 text-sm font-medium text-ink-muted">{dict.settings.ownership}</h2>
        <p className="mb-3 rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn">
          {dict.settings.editOwnershipWarning}
        </p>
        <ul className="space-y-3">
          {(partners ?? []).map((p) => (
            <li key={p.id}>
              <Card>
                <form action={updatePartner.bind(null, p.id, locale)} className="space-y-2.5">
                  <p className="font-semibold text-ink">{p.name}</p>
                  <label className="block text-xs font-medium text-ink-muted">
                    {dict.partners.ownershipPercent}
                    <input
                      name="ownershipPercent"
                      type="number"
                      step="0.000001"
                      defaultValue={p.ownership_percent}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-xs font-medium text-ink-muted">
                    {dict.partners.capitalContributed}
                    <input
                      name="capitalContributed"
                      type="number"
                      step="0.01"
                      defaultValue={p.capital_contributed}
                      className={inputClass}
                    />
                  </label>
                  <button type="submit" className={buttonClass("primary", "!px-3 !py-1.5 text-sm")}>
                    {dict.common.save}
                  </button>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? "font-semibold text-ink" : "text-ink-muted"}`}>
      <span>{label}</span>
      <span className={bold ? "tabular-nums text-ink" : "tabular-nums"}>{value}</span>
    </div>
  );
}
