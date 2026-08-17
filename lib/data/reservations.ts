import { createClient } from "@/lib/supabase/server";

export type ReservationSort = "date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "guest_asc";

export const DEFAULT_RESERVATION_SORT: ReservationSort = "date_desc";

const SORT_MAP: Record<ReservationSort, { column: string; ascending: boolean }> = {
  date_desc: { column: "check_in", ascending: false },
  date_asc: { column: "check_in", ascending: true },
  amount_desc: { column: "net_amount", ascending: false },
  amount_asc: { column: "net_amount", ascending: true },
  guest_asc: { column: "guest_name", ascending: true },
};

export function isReservationSort(value: string | undefined): value is ReservationSort {
  return !!value && value in SORT_MAP;
}

export interface ReservationReportRow {
  id: string;
  guest_name: string;
  platform: string;
  rental_type: string;
  check_in: string;
  check_out: string;
  gross_amount: number;
  paid_amount: number;
  fee_amount: number;
  expense_amount: number;
  net_amount: number;
  status: string;
}

export async function getSortedReservations(sort: ReservationSort): Promise<ReservationReportRow[]> {
  const { column, ascending } = SORT_MAP[sort];
  const supabase = await createClient();
  const { data } = await supabase
    .from("reservations")
    .select(
      "id, guest_name, platform, rental_type, check_in, check_out, gross_amount, paid_amount, fee_amount, expense_amount, net_amount, status",
    )
    .order(column, { ascending });
  return data ?? [];
}
