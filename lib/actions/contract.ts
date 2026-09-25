"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { uploadAttachment, deleteAttachment } from "@/lib/storage/contract-attachments";
import type { Locale } from "@/lib/i18n/config";

export interface UpdateContractActionState {
  error?: boolean;
  success?: boolean;
}

// Admin-only. Bumps the version and seeds a fresh pending row (with a new sign_token) per
// partner for that version -- a "signed" status can then never survive a silent text edit,
// and every old sign link naturally stops resolving to the current text.
export async function updateContractContent(
  locale: Locale,
  _prevState: UpdateContractActionState,
  formData: FormData,
): Promise<UpdateContractActionState> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) throw new Error("Not authorized");

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: true };

  const supabase = await createClient();
  const { data: current } = await supabase.from("partnership_contract").select("version").eq("id", true).single();
  const nextVersion = (current?.version ?? 0) + 1;

  const { error: contractError } = await supabase
    .from("partnership_contract")
    .update({ content, version: nextVersion, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (contractError) throw contractError;

  const { data: partners } = await supabase.from("partners").select("id");
  const rows = (partners ?? []).map((p) => ({ partner_id: p.id, contract_version: nextVersion }));
  if (rows.length > 0) {
    const { error: seedError } = await supabase.from("contract_signatures").insert(rows);
    if (seedError) throw seedError;
  }

  revalidatePath(`/${locale}/contract`);
  return { success: true };
}

export interface SignContractActionState {
  error?: "invalid" | "empty_signature";
  success?: boolean;
}

// Public (no session) -- the token itself, sent only to the named partner, is the access
// control. Not full identity verification (no KYC), appropriate for a private family document
// but not a substitute for formal notarization, as the contract text itself says.
export async function signContract(
  token: string,
  _prevState: SignContractActionState,
  formData: FormData,
): Promise<SignContractActionState> {
  const signerName = String(formData.get("signerName") ?? "").trim();
  const nationalId = String(formData.get("nationalId") ?? "").trim();
  const signatureData = String(formData.get("signatureData") ?? "").trim();

  if (!signerName || !signatureData) {
    return { error: "empty_signature" };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("contract_signatures")
    .select("id, signed_at")
    .eq("sign_token", token)
    .single();
  if (!existing) return { error: "invalid" };
  if (existing.signed_at) return { success: true };

  const headerList = await headers();
  const ipAddress = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const { error } = await supabase
    .from("contract_signatures")
    .update({
      signer_name: signerName,
      national_id: nationalId || null,
      signature_data: signatureData,
      signed_at: new Date().toISOString(),
      ip_address: ipAddress,
    })
    .eq("id", existing.id);
  if (error) throw error;

  return { success: true };
}

export interface UploadAttachmentActionState {
  error?: boolean;
}

export async function uploadContractAttachment(
  locale: Locale,
  _prevState: UploadAttachmentActionState,
  formData: FormData,
): Promise<UploadAttachmentActionState> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) throw new Error("Not authorized");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: true };

  await uploadAttachment(file);
  revalidatePath(`/${locale}/contract`);
  return {};
}

export async function deleteContractAttachment(locale: Locale, name: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) throw new Error("Not authorized");

  await deleteAttachment(name);
  revalidatePath(`/${locale}/contract`);
}
