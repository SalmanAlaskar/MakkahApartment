import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

function csvField(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: partner } = await supabase.from("partners").select("name").eq("id", id).single();
  if (!partner) return new NextResponse("Not found", { status: 404 });

  const { data: shareRows } = await supabase
    .from("reservation_shares")
    .select("reservation_id, share_amount, payout_status")
    .eq("partner_id", id)
    .order("created_at", { ascending: true });

  const reservationIds = (shareRows ?? []).map((s) => s.reservation_id);
  const { data: reservations } =
    reservationIds.length > 0
      ? await supabase
          .from("reservations")
          .select("id, guest_name, check_in, check_out")
          .in("id", reservationIds)
      : { data: [] };

  const reservationById = new Map((reservations ?? []).map((r) => [r.id, r]));

  const header = ["Guest", "Check-in", "Check-out", "Share Amount (SAR)", "Payout Status"];
  const rows = (shareRows ?? []).map((s) => {
    const reservation = reservationById.get(s.reservation_id);
    return [
      reservation?.guest_name ?? "",
      reservation?.check_in ?? "",
      reservation?.check_out ?? "",
      Number(s.share_amount).toFixed(2),
      s.payout_status,
    ];
  });

  const total = (shareRows ?? []).reduce((sum, s) => sum + Number(s.share_amount), 0);
  rows.push(["", "", "Total", total.toFixed(2), ""]);

  const csv = [header, ...rows].map((row) => row.map(csvField).join(",")).join("\n");
  const filename = `${partner.name.replace(/[^a-zA-Z0-9-]/g, "_")}_report.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
