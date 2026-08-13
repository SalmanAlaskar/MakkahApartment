import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// Service-role client. Bypasses RLS entirely — use only for the handful of
// server-only, admin-triggered operations that genuinely need it (e.g. provisioning
// a profile row for a newly created auth user). Never import this from client code.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
