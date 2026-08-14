import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { updateUser } from "@/lib/actions/settings";
import type { Locale } from "@/lib/i18n/config";
import type { UserRow, PartnerRow } from "@/lib/types/database";

export default async function UsersSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) redirect(`/${locale}/dashboard`);

  const dict = getDictionary(locale);
  const [users, partners] = await Promise.all([
    query<UserRow>(`select * from users order by created_at`),
    query<Pick<PartnerRow, "id" | "name">>(`select id, name from partners order by display_order`),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{dict.settings.users}</h1>
      <ul className="space-y-3">
        {users.map((p) => (
          <li key={p.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <form action={updateUser.bind(null, p.id, locale)} className="space-y-2">
              <p className="text-xs text-gray-400" dir="ltr">
                {p.email}
              </p>
              <label className="block text-xs text-gray-500">
                {dict.settings.fullName}
                <input
                  name="fullName"
                  defaultValue={p.name ?? ""}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                />
              </label>
              <label className="block text-xs text-gray-500">
                {dict.settings.role}
                <select
                  name="role"
                  defaultValue={p.role}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                >
                  <option value="admin">{dict.settings.role_admin}</option>
                  <option value="manager">{dict.settings.role_manager}</option>
                  <option value="partner">{dict.settings.role_partner}</option>
                </select>
              </label>
              <label className="block text-xs text-gray-500">
                {dict.settings.linkedPartner}
                <select
                  name="partnerId"
                  defaultValue={p.partner_id ?? ""}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                >
                  <option value="">{dict.settings.none}</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-sky-700"
              >
                {dict.common.save}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
