import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// Single-owner app: there is no per-user Supabase session anymore (auth is a shared
// password, not Supabase Auth), so every request just uses the service-role key
// server-side. RLS policies stay in the database as defense in depth, but this client
// bypasses them by design — access control happens at the app layer (proxy.ts).
export async function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
