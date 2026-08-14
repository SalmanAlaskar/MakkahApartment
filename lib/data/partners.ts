import { query } from "@/lib/db";
import type { PartnerRow } from "@/lib/types/database";

export async function getPartners(): Promise<PartnerRow[]> {
  return query<PartnerRow>(
    `select id, name, ownership_percent, capital_contributed, display_order, created_at
     from partners
     order by display_order`,
  );
}
