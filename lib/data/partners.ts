import { createClient } from "@/lib/supabase/server";
import type { PartnerRow } from "@/lib/types/database";

export async function getPartners(): Promise<PartnerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .order("display_order");

  if (error) throw error;
  return data ?? [];
}
