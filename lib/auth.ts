import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import type { UserRole } from "@/lib/types/database";

// Single-owner app now: one shared password gates everything, so there is exactly one
// "user" once authenticated. The role-check helpers below are kept (always true) so every
// existing page/component that calls them continues to compile and work unchanged.
export interface CurrentUser {
  id: string;
  fullName: string;
  role: UserRole;
  partnerId: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) return null;

  return { id: "owner", fullName: "Salman", role: "admin", partnerId: null };
}

export function canManageReservations(_role?: UserRole): boolean {
  return true;
}

export function canSeePartnerShares(_role?: UserRole): boolean {
  return true;
}

export function isAdmin(_role?: UserRole): boolean {
  return true;
}
