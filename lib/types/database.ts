// Hand-written types matching supabase/migrations/*.sql. Regenerate with `supabase gen types
// typescript` once the project is linked, if the schema grows enough to make this tedious.
//
// `Relationships: []` on every table and the `Views`/`Functions` keys below are required by
// @supabase/postgrest-js's GenericSchema/GenericTable constraints — omitting them makes every
// query's inferred Row type collapse to `never`.

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

export type ProfileRow = {
  id: string;
  full_name: string;
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

type ReservationShareInput = {
  partner_id: string;
  ownership_percent_snapshot: number;
  share_amount: number;
}

type CreateReservationArgs = {
  p_guest_name: string;
  p_platform: string;
  p_rental_type: string;
  p_check_in: string;
  p_check_out: string;
  p_gross_amount: number;
  p_paid_amount: number;
  p_payment_method: string | null;
  p_fee_method: FeeMethod;
  p_fee_percent: number | null;
  p_fee_amount: number;
  p_expense_amount: number;
  p_expense_note: string | null;
  p_net_amount: number;
  p_status: ReservationStatus;
  p_notes: string | null;
  p_created_by: string;
  p_shares: ReservationShareInput[];
}

type UpdateReservationArgs = {
  p_reservation_id: string;
  p_guest_name: string;
  p_platform: string;
  p_rental_type: string;
  p_check_in: string;
  p_check_out: string;
  p_gross_amount: number;
  p_paid_amount: number;
  p_payment_method: string | null;
  p_fee_method: FeeMethod;
  p_fee_percent: number | null;
  p_fee_amount: number;
  p_expense_amount: number;
  p_expense_note: string | null;
  p_net_amount: number;
  p_status: ReservationStatus;
  p_notes: string | null;
  p_shares: ReservationShareInput[];
}

type UpsertMonthlyExpenseArgs = {
  p_month: string;
  p_internet_bill: number;
  p_electricity_bill: number;
  p_other_expense: number;
  p_other_expense_note: string | null;
  p_shares: ReservationShareInput[];
}

export type Database = {
  public: {
    Tables: {
      partners: {
        Row: PartnerRow;
        Insert: Partial<PartnerRow>;
        Update: Partial<PartnerRow>;
        Relationships: [];
      };
      property_settings: {
        Row: PropertySettingsRow;
        Insert: Partial<PropertySettingsRow>;
        Update: Partial<PropertySettingsRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow>;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      reservations: {
        Row: ReservationRow;
        Insert: Partial<ReservationRow>;
        Update: Partial<ReservationRow>;
        Relationships: [];
      };
      reservation_shares: {
        Row: ReservationShareRow;
        Insert: Partial<ReservationShareRow>;
        Update: Partial<ReservationShareRow>;
        Relationships: [];
      };
      monthly_expenses: {
        Row: MonthlyExpenseRow;
        Insert: Partial<MonthlyExpenseRow>;
        Update: Partial<MonthlyExpenseRow>;
        Relationships: [];
      };
      monthly_expense_shares: {
        Row: MonthlyExpenseShareRow;
        Insert: Partial<MonthlyExpenseShareRow>;
        Update: Partial<MonthlyExpenseShareRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_reservation_with_shares: {
        Args: CreateReservationArgs;
        Returns: string;
      };
      update_reservation_with_shares: {
        Args: UpdateReservationArgs;
        Returns: undefined;
      };
      upsert_monthly_expense_with_shares: {
        Args: UpsertMonthlyExpenseArgs;
        Returns: string;
      };
    };
  };
}
