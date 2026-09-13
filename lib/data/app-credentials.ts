import { createClient } from "@/lib/supabase/server";

export interface AppCredentials {
  password_hash: string;
  recovery_code_hash: string;
}

export async function getAppCredentials(): Promise<AppCredentials | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_credentials")
    .select("password_hash, recovery_code_hash")
    .eq("id", true)
    .single();
  return data ?? null;
}

export async function setAppPasswordHash(passwordHash: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("app_credentials")
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) throw error;
}
