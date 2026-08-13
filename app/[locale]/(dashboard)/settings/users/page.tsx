import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { updateProfile } from "@/lib/actions/settings";
import type { Locale } from "@/lib/i18n/config";

export default async function UsersSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await params) as { locale: Locale };
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) redirect(`/${locale}/dashboard`);

  const dict = getDictionary(locale);
  const supabase = await createClient();
  const [{ data: profiles }, { data: partners }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at"),
    supabase.from("partners").select("id, name").order("display_order"),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{dict.settings.users}</h1>
      <ul className="space-y-3">
        {(profiles ?? []).map((p) => (
          <li key={p.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <form action={updateProfile.bind(null, p.id, locale)} className="space-y-2">
              <label className="block text-xs text-gray-500">
                {dict.settings.fullName}
                <input
                  name="fullName"
                  defaultValue={p.full_name}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base"
                />
              </label>
              <label className="block text-xs text-gray-500">
                {dict.settings.role}
                <select
                  name="role"
                  defaultValue={p.role}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base"
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
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base"
                >
                  <option value="">{dict.settings.none}</option>
                  {(partners ?? []).map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white">
                {dict.common.save}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
