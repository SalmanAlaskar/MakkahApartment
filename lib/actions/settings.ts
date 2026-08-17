"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import type { Locale } from "@/lib/i18n/config";

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
