import { auth } from "@/auth";
import { query } from "@/lib/db";
import type { UserRole } from "@/lib/types/database";

export interface CurrentUser {
  id: string;
  fullName: string;
  role: UserRole;
  partnerId: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const rows = await query<{ id: string; name: string | null; role: UserRole; partner_id: string | null }>(
    `select id, name, role, partner_id from users where id = $1`,
    [session.user.id],
  );
  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    fullName: row.name ?? session.user.email ?? "",
    role: row.role,
    partnerId: row.partner_id,
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
