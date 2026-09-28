import { createClient } from "@/lib/supabase/server";

// Placeholder shown for a partner's identity fields (full name / national ID) that haven't
// been filled in yet via Settings -- see substitutePartnerTokens.
const BLANK_PLACEHOLDER = "__________________";

// The contract text is free-form admin-edited prose, but a partner's full legal name and
// national ID are never typed directly into it: those are structured fields on `partners`
// (edited via Settings, with a plain LTR input for the ID) substituted in here via
// {{PARTNER_N_FULL_NAME}} / {{PARTNER_N_NATIONAL_ID}} tokens, N being 1-based display_order.
// This exists specifically because typing a number in the middle of a right-to-left
// <textarea> is a well-known browser trap -- the cursor can jump in ways that silently save
// the digits in reverse order without the person noticing while typing.
function substitutePartnerTokens(
  content: string,
  partners: Array<{ full_name: string | null; national_id: string | null }>,
): string {
  let result = content;
  partners.forEach((p, i) => {
    const n = i + 1;
    result = result.replaceAll(`{{PARTNER_${n}_FULL_NAME}}`, p.full_name?.trim() || BLANK_PLACEHOLDER);
    result = result.replaceAll(`{{PARTNER_${n}_NATIONAL_ID}}`, p.national_id?.trim() || BLANK_PLACEHOLDER);
  });
  return result;
}

export interface ContractWithSignatures {
  content: string;
  renderedContent: string;
  version: number;
  updatedAt: string;
  signatures: Array<{
    partnerId: string;
    partnerName: string;
    signToken: string;
    signedAt: string | null;
    signerName: string | null;
  }>;
}

export async function getContractWithSignatures(): Promise<ContractWithSignatures | null> {
  const supabase = await createClient();
  const { data: contract } = await supabase
    .from("partnership_contract")
    .select("content, version, updated_at")
    .eq("id", true)
    .single();
  if (!contract) return null;

  const [{ data: signatures }, { data: partners }] = await Promise.all([
    supabase
      .from("contract_signatures")
      .select("partner_id, sign_token, signed_at, signer_name")
      .eq("contract_version", contract.version),
    supabase.from("partners").select("id, name, full_name, national_id").order("display_order"),
  ]);

  const signatureByPartnerId = new Map((signatures ?? []).map((s) => [s.partner_id, s]));

  return {
    content: contract.content,
    renderedContent: substitutePartnerTokens(contract.content, partners ?? []),
    version: contract.version,
    updatedAt: contract.updated_at,
    signatures: (partners ?? []).map((p) => {
      const s = signatureByPartnerId.get(p.id);
      return {
        partnerId: p.id,
        partnerName: p.name,
        signToken: s?.sign_token ?? "",
        signedAt: s?.signed_at ?? null,
        signerName: s?.signer_name ?? null,
      };
    }),
  };
}

export interface SigningContext {
  contractContent: string;
  contractVersion: number;
  partnerName: string;
  signedAt: string | null;
}

export async function getSigningContextByToken(token: string): Promise<SigningContext | null> {
  const supabase = await createClient();
  const { data: signature } = await supabase
    .from("contract_signatures")
    .select("partner_id, contract_version, signed_at")
    .eq("sign_token", token)
    .single();
  if (!signature) return null;

  const [{ data: contract }, { data: partner }, { data: allPartners }] = await Promise.all([
    supabase.from("partnership_contract").select("content, version").eq("id", true).single(),
    supabase.from("partners").select("name").eq("id", signature.partner_id).single(),
    supabase.from("partners").select("full_name, national_id").order("display_order"),
  ]);
  if (!contract || !partner || contract.version !== signature.contract_version) return null;

  return {
    contractContent: substitutePartnerTokens(contract.content, allPartners ?? []),
    contractVersion: contract.version,
    partnerName: partner.name,
    signedAt: signature.signed_at,
  };
}
