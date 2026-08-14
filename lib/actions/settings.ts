"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";
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

  await pool.query(`update partners set ownership_percent = $2, capital_contributed = $3 where id = $1`, [
    partnerId,
    ownershipPercent,
    capitalContributed,
  ]);

  revalidatePath(`/${locale}/settings`);
}

export async function updateUser(userId: string, locale: Locale, formData: FormData) {
  await requireAdmin();
  const fullName = String(formData.get("fullName") ?? "");
  const role = String(formData.get("role")) as UserRole;
  const partnerIdRaw = String(formData.get("partnerId") ?? "");

  await pool.query(`update users set name = $2, role = $3, partner_id = $4 where id = $1`, [
    userId,
    fullName,
    role,
    partnerIdRaw || null,
  ]);

  revalidatePath(`/${locale}/settings/users`);
}
