import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

export interface CurrentUser {
  id: string;
  fullName: string;
  role: UserRole;
  partnerId: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, partner_id")
    .eq("id", authData.user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    fullName: profile.full_name,
    role: profile.role,
    partnerId: profile.partner_id,
  };
}

export function canManageReservations(role: UserRole): boolean {
  return role === "admin" || role === "manager";
}

export function canSeePartnerShares(role: UserRole): boolean {
  return role === "admin" || role === "partner";
}

export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}
