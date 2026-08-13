"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import type { Locale } from "@/lib/i18n/config";
import type { UserRole } from "@/lib/types/database";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    throw new Error("Not authorized");
  }
  return user;
}

export async function updatePartner(partnerId: string, locale: Locale, formData: FormData) {
  await requireAdmin();
  const ownershipPercent = Number(formData.get("ownershipPercent"));
  const capitalContributed = Number(formData.get("capitalContributed"));

  const supabase = await createClient();
  const { error } = await supabase
    .from("partners")
    .update({ ownership_percent: ownershipPercent, capital_contributed: capitalContributed })
    .eq("id", partnerId);

  if (error) throw error;
  revalidatePath(`/${locale}/settings`);
}

export async function updateProfile(profileId: string, locale: Locale, formData: FormData) {
  await requireAdmin();
  const fullName = String(formData.get("fullName") ?? "");
  const role = String(formData.get("role")) as UserRole;
  const partnerIdRaw = String(formData.get("partnerId") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, role, partner_id: partnerIdRaw || null })
    .eq("id", profileId);

  if (error) throw error;
  revalidatePath(`/${locale}/settings/users`);
}
