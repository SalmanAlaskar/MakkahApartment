// Hand-written types matching db/migrations/*.sql. Update by hand alongside any schema change --
// there's no client library generating these anymore now that queries are plain SQL via pg.

export type UserRole = "admin" | "manager" | "partner";
export type ReservationStatus = "confirmed" | "cancelled" | "completed";
export type FeeMethod = "flat_amount" | "percent_of_gross";
export type PayoutStatus = "pending" | "paid";

export type PartnerRow = {
  id: string;
  name: string;
  ownership_percent: number;
  capital_contributed: number;
  display_order: number;
  created_at: string;
}

export type PropertySettingsRow = {
  id: string;
  property_name: string;
  unit_number: string | null;
  property_price: number;
  transaction_fee: number;
  total_acquisition_cost: number;
  created_at: string;
  updated_at: string;
}

// Auth.js owns this table (id/name/email/emailVerified/image); role and partner_id are our own
// columns bolted on since there's now a single source of user identity.
export type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  partner_id: string | null;
  created_at: string;
}

export type ReservationRow = {
  id: string;
  guest_name: string;
  platform: string;
  rental_type: string;
  check_in: string;
  check_out: string;
  gross_amount: number;
  paid_amount: number;
  payment_method: string | null;
  fee_method: FeeMethod;
  fee_percent: number | null;
  fee_amount: number;
  expense_amount: number;
  expense_note: string | null;
  net_amount: number;
  status: ReservationStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ReservationShareRow = {
  id: string;
  reservation_id: string;
  partner_id: string;
  ownership_percent_snapshot: number;
  share_amount: number;
  payout_status: PayoutStatus;
  paid_at: string | null;
  paid_note: string | null;
  created_at: string;
}

export type MonthlyExpenseRow = {
  id: string;
  month: string;
  internet_bill: number;
  electricity_bill: number;
  other_expense: number;
  other_expense_note: string | null;
  created_at: string;
  updated_at: string;
}

export type MonthlyExpenseShareRow = {
  id: string;
  monthly_expense_id: string;
  partner_id: string;
  ownership_percent_snapshot: number;
  share_amount: number;
  payout_status: PayoutStatus;
  paid_at: string | null;
  paid_note: string | null;
  created_at: string;
}
