import Link from "next/link";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { updatePartner } from "@/lib/actions/settings";
import type { Locale } from "@/lib/i18n/config";
import type { PartnerRow, PropertySettingsRow } from "@/lib/types/database";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) redirect(`/${locale}/dashboard`);

  const dict = getDictionary(locale);
  const [propertyRows, partners] = await Promise.all([
    query<PropertySettingsRow>(`select * from property_settings limit 1`),
    query<PartnerRow>(`select * from partners order by display_order`),
  ]);
  const property = propertyRows[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{dict.settings.title}</h1>
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/settings/bills`} className="text-sm text-gray-600 underline">
            {dict.settings.monthlyBills}
          </Link>
          <Link href={`/${locale}/settings/users`} className="text-sm text-gray-600 underline">
            {dict.settings.users}
          </Link>
        </div>
      </div>

      {property && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-medium text-gray-500">{dict.settings.propertyInfo}</h2>
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
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-medium text-gray-500">{dict.settings.ownership}</h2>
        <p className="mb-3 text-xs text-amber-700">{dict.settings.editOwnershipWarning}</p>
        <ul className="space-y-3">
          {partners.map((p) => (
            <li key={p.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <form action={updatePartner.bind(null, p.id, locale)} className="space-y-2">
                <p className="font-medium">{p.name}</p>
                <label className="block text-xs text-gray-500">
                  {dict.partners.ownershipPercent}
                  <input
                    name="ownershipPercent"
                    type="number"
                    step="0.000001"
                    defaultValue={p.ownership_percent}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base"
                  />
                </label>
                <label className="block text-xs text-gray-500">
                  {dict.partners.capitalContributed}
                  <input
                    name="capitalContributed"
                    type="number"
                    step="0.01"
                    defaultValue={p.capital_contributed}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base"
                  />
                </label>
                <button type="submit" className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white">
                  {dict.common.save}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? "font-semibold" : ""}`}>
      <span className="text-gray-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}
